"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Carteira } from "@/lib/reforma";
import {
  codigoNovo,
  estadoInicial,
  evento,
  lerEstado,
  limparEstado,
  montarCarteira,
  notasDe,
  resumir,
  salvarEstado,
  type ClientePortal,
  type Convite,
  type Decisao,
  type EstadoPortal,
  type NotaPendente,
  type TipoConvite,
} from "@/lib/portal";

interface Aviso {
  id: number;
  texto: string;
}

interface Portal {
  carregado: boolean;
  escritorio: string;
  cidade: string;
  diasParaCbs: number;
  clientes: ClientePortal[];
  resumo: ReturnType<typeof resumir>;
  estado: EstadoPortal;
  notas: NotaPendente[];
  cliente: (id: string) => ClientePortal | undefined;

  registrarCnpj: (id: string, numero: string) => void;
  renovarCertificado: (id: string, validade: string) => void;
  decidir: (id: string, d: Exclude<Decisao, "nao_se_aplica" | "pendente">) => void;
  corrigirNotas: (ids: string[]) => void;
  marcarExtratoArquivo: (id: string) => void;
  convidar: (dados: { tipo: TipoConvite; nome: string; celular: string; clienteId?: string }) => Convite;
  cancelarConvite: (codigo: string) => void;
  reenviarConvite: (codigo: string) => void;
  marcarLidas: () => void;
  reiniciar: () => void;

  avisar: (texto: string) => void;
  linkAberto: Convite | null;
  mostrarLink: (c: Convite | null) => void;
}

const Contexto = createContext<Portal | null>(null);

export function usePortal() {
  const p = useContext(Contexto);
  if (!p) throw new Error("usePortal fora do PortalProvider");
  return p;
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<Carteira | null>(null);
  const [estado, setEstado] = useState<EstadoPortal>(() => estadoInicial());
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [linkAberto, setLinkAberto] = useState<Convite | null>(null);

  useEffect(() => {
    setEstado(lerEstado());
    fetch("/api/contador")
      .then((r) => r.json())
      .then(setBase);
    // O produtor responde o convite em outra aba: o portal acompanha ao vivo.
    const ouvir = (ev: StorageEvent) => {
      if (ev.key === null || ev.key.startsWith("coope-portal")) setEstado(lerEstado());
    };
    window.addEventListener("storage", ouvir);
    return () => window.removeEventListener("storage", ouvir);
  }, []);

  const atualRef = useRef(estado);
  atualRef.current = estado;

  // Fora do updater do setState: no modo estrito ele roda duas vezes, e reler
  // o que acabou de ser gravado duplicaria o convite.
  const mudar = useCallback((f: (e: EstadoPortal) => EstadoPortal) => {
    const novo = f(lerEstadoOu(atualRef.current));
    atualRef.current = novo;
    salvarEstado(novo);
    setEstado(novo);
  }, []);

  const avisar = useCallback((texto: string) => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, texto }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 3200);
  }, []);

  const clientes = useMemo(() => (base ? montarCarteira(base, estado) : []), [base, estado]);
  const resumo = useMemo(() => resumir(clientes), [clientes]);
  const notas = useMemo(
    () => clientes.flatMap((c) => notasDe(c, estado.ajustes[c.id]?.notasCorrigidas ?? [])),
    [clientes, estado],
  );
  const cliente = useCallback((id: string) => clientes.find((c) => c.id === id), [clientes]);
  const nomeDe = useCallback((id: string) => clientes.find((c) => c.id === id)?.nome ?? "Cliente", [clientes]);

  const ajustar = useCallback(
    (id: string, parcial: EstadoPortal["ajustes"][string], texto: string, tom: "bom" | "neutro" = "bom") =>
      mudar((e) => ({
        ...e,
        ajustes: { ...e.ajustes, [id]: { ...e.ajustes[id], ...parcial } },
        eventos: [evento(texto, tom, id), ...e.eventos].slice(0, 60),
      })),
    [mudar],
  );

  const valor: Portal = {
    carregado: base !== null,
    escritorio: base?.escritorio ?? "",
    cidade: base?.cidade ?? "",
    diasParaCbs: base?.diasParaCbs ?? 0,
    clientes,
    resumo,
    estado,
    notas,
    cliente,

    registrarCnpj: (id, numero) => {
      ajustar(id, { cnpj: "feito", cnpjNumero: numero || undefined }, `${nomeDe(id)}: CNPJ registrado`);
      avisar("CNPJ registrado na ficha do cliente");
    },
    renovarCertificado: (id, validade) => {
      ajustar(
        id,
        { certificado: "valido", certificadoValidade: validade },
        `${nomeDe(id)}: certificado renovado, SEFAZ voltou a baixar as notas`,
      );
      avisar("Certificado atualizado. A busca na SEFAZ foi retomada.");
    },
    decidir: (id, d) => {
      ajustar(
        id,
        { decisao: d },
        `${nomeDe(id)}: decidiu ${d === "entrar" ? "entrar no regime regular" : "ficar fora do IBS/CBS"} em 2027`,
        "neutro",
      );
      avisar("Decisão registrada");
    },
    corrigirNotas: (ids) => {
      if (!ids.length) return;
      mudar((e) => {
        const ajustes = { ...e.ajustes };
        const porCliente = new Map<string, number>();
        for (const id of ids) {
          const cid = id.slice(0, id.lastIndexOf("-"));
          const atual = ajustes[cid]?.notasCorrigidas ?? [];
          if (atual.includes(id)) continue;
          ajustes[cid] = { ...ajustes[cid], notasCorrigidas: [...atual, id] };
          porCliente.set(cid, (porCliente.get(cid) ?? 0) + 1);
        }
        const novos = [...porCliente].map(([cid, n]) =>
          evento(`${nomeDe(cid)}: ${n} ${n === 1 ? "nota corrigida" : "notas corrigidas"} com IBS/CBS`, "bom", cid),
        );
        return { ...e, ajustes, eventos: [...novos, ...e.eventos].slice(0, 60) };
      });
      avisar(ids.length === 1 ? "Nota marcada como corrigida" : `${ids.length} notas marcadas como corrigidas`);
    },
    marcarExtratoArquivo: (id) => {
      ajustar(id, { extratos: "ofx" }, `${nomeDe(id)}: arquivo do banco recebido`, "neutro");
      avisar("Extrato por arquivo registrado");
    },
    convidar: ({ tipo, nome, celular, clienteId }) => {
      const c: Convite = {
        codigo: codigoNovo(),
        tipo,
        nome,
        celular,
        clienteId,
        criadoEm: new Date().toISOString(),
        status: "enviado",
      };
      mudar((e) => ({
        ...e,
        convites: [c, ...e.convites],
        eventos: [
          evento(
            tipo === "cadastro" ? `Convite de pré-cadastro criado para ${nome}` : `Pedido de Open Finance criado para ${nome}`,
            "neutro",
            clienteId,
          ),
          ...e.eventos,
        ].slice(0, 60),
      }));
      return c;
    },
    cancelarConvite: (codigo) => {
      mudar((e) => ({
        ...e,
        convites: e.convites.map((c) => (c.codigo === codigo ? { ...c, status: "cancelado" } : c)),
      }));
      avisar("Convite cancelado: o link deixou de funcionar");
    },
    reenviarConvite: (codigo) => {
      mudar((e) => ({
        ...e,
        convites: e.convites.map((c) =>
          c.codigo === codigo ? { ...c, status: c.status === "cancelado" ? "enviado" : c.status, criadoEm: new Date().toISOString() } : c,
        ),
      }));
    },
    marcarLidas: () => mudar((e) => ({ ...e, lidasAte: new Date().toISOString() })),
    reiniciar: () => {
      limparEstado();
      const e = estadoInicial();
      salvarEstado(e);
      setEstado(e);
      avisar("Demonstração reiniciada");
    },

    avisar,
    linkAberto,
    mostrarLink: setLinkAberto,
  };

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
        {avisos.map((a) => (
          <div
            key={a.id}
            className="pop rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-canvas shadow-float"
          >
            {a.texto}
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

/** Lê de novo antes de gravar: outra aba pode ter mudado o estado entre um clique e outro. */
function lerEstadoOu(atual: EstadoPortal): EstadoPortal {
  try {
    if (localStorage.getItem("coope-portal-v1")) return lerEstado();
  } catch {
    /* sem armazenamento */
  }
  return atual;
}
