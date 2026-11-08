"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Icone } from "@/components/ui";
import { Cabecalho } from "@/components/contador/portal";
import { usePortal } from "@/components/contador/estado";
import { BotaoP, Campo, Cartao, classeEntrada, copiar, Esqueleto, Kpi, SeloConvite, Vazio } from "@/components/contador/ui";
import {
  celularDe,
  CODIGO_ESCRITORIO,
  dataCurta,
  linkConvite,
  quando,
  type StatusConvite,
  type TipoConvite,
} from "@/lib/portal";

const mascaraCelular = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Convites />
    </Suspense>
  );
}

function Convites() {
  const p = usePortal();
  const params = useSearchParams();
  const nomeRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<TipoConvite>("cadastro");
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [filtro, setFiltro] = useState<StatusConvite | "todos">("todos");

  useEffect(() => {
    if (params.get("novo") === "1") nomeRef.current?.focus();
  }, [params, p.carregado]);

  if (!p.carregado) return <Esqueleto />;

  const todos = p.estado.convites;
  const lista = todos.filter((c) => filtro === "todos" || c.status === filtro);
  const validos = todos.filter((c) => c.status !== "cancelado");
  const abertos = validos.filter((c) => c.status === "aberto" || c.status === "concluido").length;
  const concluidos = validos.filter((c) => c.status === "concluido").length;
  const semOpenFinance = p.clientes.filter((c) => c.extratos !== "open_finance");
  const linkGeral = linkConvite(CODIGO_ESCRITORIO);

  const celularOk = celular.replace(/\D/g, "").length >= 10;
  const pode = tipo === "cadastro" ? nome.trim().length > 2 && celularOk : !!clienteId && celularOk;

  const enviar = () => {
    if (!pode) return;
    const cli = p.cliente(clienteId);
    const c = p.convidar({
      tipo,
      nome: tipo === "cadastro" ? nome.trim() : (cli?.nome ?? nome),
      celular,
      clienteId: tipo === "open_finance" ? clienteId : undefined,
    });
    p.mostrarLink(c);
    setNome("");
    setCelular("");
    setClienteId("");
  };

  return (
    <div className="rise space-y-6">
      <Cabecalho
        titulo="Convites"
        sub="Mande ao produtor um link para o pré-cadastro no app da Coope ou para autorizar o Open Finance. Ao concluir, o cliente entra na carteira com as autorizações dadas."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi rotulo="Convites enviados" valor={String(validos.length)} icone="link" />
        <Kpi rotulo="Abertos" valor={String(abertos)} nota={validos.length ? `${Math.round((abertos / validos.length) * 100)}% dos enviados` : undefined} icone="olho" />
        <Kpi rotulo="Concluídos" valor={String(concluidos)} tom="brand" icone="check" />
        <Kpi
          rotulo="Clientes sem Open Finance"
          valor={String(semOpenFinance.length)}
          nota="Candidatos a um pedido"
          tom="warn"
          icone="banco"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Cartao titulo="Novo convite">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                enviar();
              }}
            >
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-raised p-1">
                {(
                  [
                    ["cadastro", "Pré-cadastro no app"],
                    ["open_finance", "Pedir Open Finance"],
                  ] as const
                ).map(([k, r]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTipo(k)}
                    className={`rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-colors ${
                      tipo === k ? "bg-surface text-ink shadow-card" : "text-muted"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {tipo === "cadastro" ? (
                <Campo rotulo="Nome do produtor">
                  <input
                    ref={nomeRef}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: João da Silva"
                    className={classeEntrada}
                  />
                </Campo>
              ) : (
                <Campo rotulo="Cliente da carteira" dica="Só aparecem os que ainda não estão no Open Finance">
                  <select
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      if (e.target.value) setCelular(celularDe(e.target.value));
                    }}
                    className={classeEntrada}
                  >
                    <option value="">Escolha um cliente</option>
                    {semOpenFinance.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </Campo>
              )}

              <Campo rotulo="Celular com DDD" dica="O link vai por WhatsApp ou SMS. Use um número fictício.">
                <input
                  value={celular}
                  onChange={(e) => setCelular(mascaraCelular(e.target.value))}
                  placeholder="(66) 99999-0000"
                  inputMode="tel"
                  className={classeEntrada}
                />
              </Campo>

              <BotaoP type="submit" icone="link" disabled={!pode}>
                Gerar link do convite
              </BotaoP>
            </form>
          </Cartao>

          <Cartao
            titulo="Link do escritório"
            legenda="Um link fixo para colocar no site, na assinatura do e-mail ou no balcão. Qualquer produtor se cadastra por ele."
          >
            <div className="flex items-center gap-2 rounded-xl bg-raised p-1.5 pl-3.5">
              <span className="mono min-w-0 flex-1 truncate text-[12px]">{linkGeral}</span>
              <BotaoP
                tamanho="p"
                variante="contorno"
                icone="copiar"
                onClick={() => copiar(linkGeral) && p.avisar("Link do escritório copiado")}
              >
                Copiar
              </BotaoP>
            </div>
            <a href={linkGeral} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
              <Icone nome="externo" tamanho={14} /> Abrir como produtor
            </a>
          </Cartao>
        </div>

        <Cartao semPadding>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight">Enviados</h2>
            <div className="flex gap-1.5">
              {(["todos", "enviado", "aberto", "concluido", "cancelado"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFiltro(s)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize ${
                    filtro === s ? "bg-ink text-canvas" : "bg-raised text-muted hover:text-ink"
                  }`}
                >
                  {s === "concluido" ? "concluídos" : s === "todos" ? "todos" : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          {lista.length === 0 ? (
            <Vazio icone="link" titulo="Nenhum convite aqui">
              Gere um convite ao lado e mande o link ao produtor.
            </Vazio>
          ) : (
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-[660px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line text-[11.5px] text-faint">
                    <th className="py-3 pl-5 pr-3 font-semibold">Produtor</th>
                    <th className="px-3 py-3 font-semibold">Tipo</th>
                    <th className="px-3 py-3 font-semibold">Criado</th>
                    <th className="px-3 py-3 font-semibold">Situação</th>
                    <th className="py-3 pl-3 pr-5 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c) => {
                    const idCarteira = c.tipo === "cadastro" ? `novo-${c.codigo}` : c.clienteId;
                    return (
                      <tr key={c.codigo} className="border-b border-line last:border-b-0 hover:bg-raised">
                        <td className="py-3 pl-5 pr-3">
                          <p className="font-semibold">{c.cadastro?.nome ?? c.nome}</p>
                          <p className="text-[11.5px] text-muted">
                            {c.celular}
                            {c.avulso && " · pelo link do escritório"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted">{c.tipo === "cadastro" ? "Pré-cadastro" : "Open Finance"}</td>
                        <td className="px-3 py-3 text-muted">
                          {quando(c.criadoEm)}
                          <span className="block text-[11px] text-faint">{dataCurta(c.criadoEm)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <SeloConvite v={c.status} />
                          {c.status === "aberto" && c.abertoEm && (
                            <span className="mt-1 block text-[11px] text-faint">aberto {quando(c.abertoEm)}</span>
                          )}
                          {c.status === "concluido" && c.concluidoEm && (
                            <span className="mt-1 block text-[11px] text-faint">{quando(c.concluidoEm)}</span>
                          )}
                        </td>
                        <td className="py-3 pl-3 pr-5">
                          <div className="flex justify-end gap-1">
                            {c.status === "concluido" ? (
                              idCarteira && (
                                <Link href={`/contador/clientes?c=${idCarteira}`}>
                                  <BotaoP tamanho="p" variante="contorno">
                                    Ver na carteira
                                  </BotaoP>
                                </Link>
                              )
                            ) : c.status === "cancelado" ? (
                              <BotaoP
                                tamanho="p"
                                variante="texto"
                                onClick={() => {
                                  p.reenviarConvite(c.codigo);
                                  p.avisar("Convite reativado");
                                }}
                              >
                                Reativar
                              </BotaoP>
                            ) : (
                              <>
                                <BotaoP tamanho="p" variante="contorno" icone="copiar" onClick={() => copiar(linkConvite(c.codigo)) && p.avisar("Link copiado")}>
                                  Link
                                </BotaoP>
                                <BotaoP tamanho="p" variante="suave" onClick={() => p.mostrarLink(c)}>
                                  Reenviar
                                </BotaoP>
                                <BotaoP tamanho="p" variante="perigo" onClick={() => p.cancelarConvite(c.codigo)}>
                                  Cancelar
                                </BotaoP>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>
      </div>
    </div>
  );
}
