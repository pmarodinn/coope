"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icone, Logo } from "@/components/ui";
import { linkConvite, linkWhatsApp, mensagemConvite, quando } from "@/lib/portal";
import { PortalProvider, usePortal } from "./estado";
import { BotaoP, copiar, Iniciais, Modal, PontoUrgencia } from "./ui";

const CONTADORA = { nome: "Marta Ribeiro", cargo: "Contadora responsável" };

function useNav() {
  const { resumo, notas, estado } = usePortal();
  const notasAbertas = notas.filter((n) => !n.corrigida).length;
  const convitesAbertos = estado.convites.filter((c) => c.status === "enviado" || c.status === "aberto").length;
  return [
    { href: "/contador", icone: "painel", rotulo: "Visão geral" },
    { href: "/contador/clientes", icone: "pessoas", rotulo: "Clientes", contador: resumo.urgentes, tom: "bad" as const },
    { href: "/contador/notas", icone: "nota", rotulo: "Notas fiscais", contador: notasAbertas, tom: "warn" as const },
    {
      href: "/contador/documentos",
      icone: "pasta",
      rotulo: "Certificados e extratos",
      contador: resumo.certificadosProblema + resumo.semExtrato,
      tom: "warn" as const,
    },
    { href: "/contador/convites", icone: "link", rotulo: "Convites", contador: convitesAbertos, tom: "neutro" as const },
    { href: "/contador/prazos", icone: "calendario", rotulo: "Prazos da reforma" },
  ];
}

function Lateral() {
  const path = usePathname();
  const nav = useNav();
  const { escritorio, cidade, reiniciar } = usePortal();

  return (
    <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <Logo size={32} />
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight">Coope</p>
          <p className="text-[11px] font-medium text-muted">Portal do contador</p>
        </div>
      </div>

      <div className="mx-3 mb-4 rounded-2xl bg-raised px-3.5 py-3">
        <p className="truncate text-[12.5px] font-semibold leading-snug">{escritorio || "Escritório"}</p>
        <p className="mt-0.5 text-[11.5px] text-muted">{cidade} · plano Carteira</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map((n) => {
          const ativo = n.href === "/contador" ? path === "/contador" || path === "/contador/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                ativo ? "bg-brand-soft text-brand" : "text-muted hover:bg-raised hover:text-ink"
              }`}
            >
              <Icone nome={n.icone} tamanho={18} />
              <span className="flex-1">{n.rotulo}</span>
              {!!n.contador && (
                <span
                  className={`tnum min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold ${
                    n.tom === "bad"
                      ? "bg-bad-soft text-bad"
                      : n.tom === "warn"
                        ? "bg-warn-soft text-warn"
                        : "bg-raised text-muted"
                  }`}
                >
                  {n.contador}
                </span>
              )}
            </Link>
          );
        })}

        <p className="px-3 pb-1.5 pt-6 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">
          Demonstração
        </p>
        <Link
          href="/app"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-muted hover:bg-raised hover:text-ink"
        >
          <Icone nome="externo" tamanho={18} />
          App do produtor
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-muted hover:bg-raised hover:text-ink"
        >
          <Icone nome="voltar" tamanho={18} />
          Apresentação
        </Link>
        <button
          type="button"
          onClick={reiniciar}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-muted hover:bg-raised hover:text-ink"
        >
          <Icone nome="relogio" tamanho={18} />
          Reiniciar demonstração
        </button>
      </nav>

      <div className="flex items-center gap-3 border-t border-line px-5 py-4">
        <Iniciais nome={CONTADORA.nome} tamanho={34} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold">{CONTADORA.nome}</p>
          <p className="truncate text-[11.5px] text-muted">{CONTADORA.cargo}</p>
        </div>
      </div>
    </aside>
  );
}

function Busca() {
  const { clientes } = usePortal();
  const [q, setQ] = useState("");
  const [foco, setFoco] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  const achados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return clientes
      .filter((c) => `${c.nome} ${c.municipio} ${c.cultura}`.toLowerCase().includes(t))
      .slice(0, 6);
  }, [q, clientes]);

  const abrir = (id: string) => {
    setQ("");
    ref.current?.blur();
    router.push(`/contador/clientes?c=${id}`);
  };

  return (
    <div className="relative w-full max-w-[420px]">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">
        <Icone nome="busca" tamanho={16} />
      </span>
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFoco(true)}
        onBlur={() => setTimeout(() => setFoco(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && achados[0]) abrir(achados[0].id);
          if (e.key === "Escape") setQ("");
        }}
        placeholder="Buscar cliente, município ou cultura"
        className="h-10 w-full rounded-full bg-raised pl-10 pr-14 text-[13.5px] outline-none ring-1 ring-transparent placeholder:text-faint focus:bg-surface focus:ring-brand"
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md bg-surface px-1.5 py-0.5 text-[10.5px] font-semibold text-faint ring-1 ring-line">
        Ctrl K
      </span>
      {foco && q.trim() && (
        <div className="pop absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl bg-surface shadow-float ring-1 ring-line">
          {achados.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">Nenhum cliente com “{q}”.</p>
          ) : (
            achados.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => abrir(c.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-raised"
              >
                <PontoUrgencia u={c.urgencia} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{c.nome}</span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {c.municipio} · {c.proxima}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Notificacoes() {
  const { estado, marcarLidas } = usePortal();
  const [aberto, setAberto] = useState(false);
  const naoLidas = estado.eventos.filter((e) => e.em > estado.lidasAte).length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => {
          setAberto((a) => !a);
          if (!aberto && naoLidas) setTimeout(marcarLidas, 1500);
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-raised text-muted transition-colors hover:text-ink"
      >
        <Icone nome="sino" tamanho={18} />
        {naoLidas > 0 && (
          <span className="tnum absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">
            {naoLidas}
          </span>
        )}
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} aria-hidden />
          <div className="pop absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl bg-surface shadow-float ring-1 ring-line">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[14px] font-semibold">Atividade da carteira</p>
              <button type="button" onClick={marcarLidas} className="text-[12px] font-semibold text-brand">
                Marcar como lidas
              </button>
            </div>
            <div className="scroll-thin max-h-[420px] overflow-y-auto">
              {estado.eventos.slice(0, 20).map((e) => (
                <Link
                  key={e.id}
                  href={e.clienteId ? `/contador/clientes?c=${e.clienteId}` : "/contador"}
                  onClick={() => setAberto(false)}
                  className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-raised"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      e.tom === "bom" ? "bg-brand" : e.tom === "atencao" ? "bg-warn" : "bg-faint"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] leading-snug ${e.em > estado.lidasAte ? "font-semibold" : ""}`}>
                      {e.texto}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-faint">{quando(e.em)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Tema() {
  const [tema, setTema] = useState<"dark" | "light">("light");
  useEffect(() => {
    let salvo: "dark" | "light" = "light";
    try {
      salvo = localStorage.getItem("coope-tema") === "dark" ? "dark" : "light";
    } catch {
      /* fica no claro */
    }
    document.documentElement.setAttribute("data-theme", salvo);
    setTema(salvo);
  }, []);
  const alternar = () => {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("coope-tema", novo);
    } catch {
      /* só nesta visita */
    }
  };
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={`Tema ${tema === "dark" ? "claro" : "escuro"}`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-raised text-muted transition-colors hover:text-ink"
    >
      <Icone nome={tema === "dark" ? "sol" : "lua"} tamanho={18} />
    </button>
  );
}

function Topo() {
  const nav = useNav();
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-6 xl:px-8">
        <span className="lg:hidden">
          <Logo size={30} />
        </span>
        <Busca />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full bg-warn-soft px-3 py-1.5 text-[11.5px] font-semibold text-warn xl:inline">
            Protótipo · dados fictícios
          </span>
          <Tema />
          <Notificacoes />
          <Link href="/contador/convites?novo=1">
            <BotaoP icone="mais">Convidar cliente</BotaoP>
          </Link>
        </div>
      </div>
      {/* Telas estreitas: a barra lateral vira uma fileira de abas. */}
      <nav className="no-bar flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {nav.map((n) => {
          const ativo = n.href === "/contador" ? path === "/contador" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-medium ${
                ativo ? "bg-brand-soft text-brand" : "text-muted"
              }`}
            >
              {n.rotulo}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

/** Depois de criar um convite: link, mensagem pronta e envio. */
function LinkGerado() {
  const { linkAberto: c, mostrarLink, escritorio, avisar } = usePortal();
  const link = c ? linkConvite(c.codigo) : "";
  const msg = c ? mensagemConvite(c, escritorio, link) : "";

  return (
    <Modal
      aberto={!!c}
      fechar={() => mostrarLink(null)}
      titulo={c?.tipo === "open_finance" ? "Pedido de Open Finance pronto" : "Convite de pré-cadastro pronto"}
    >
      {c && (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-muted">
            Envie para <span className="font-semibold text-ink">{c.nome}</span> ({c.celular}). Quando{" "}
            {c.tipo === "open_finance" ? "a autorização for dada" : "o cadastro for concluído"}, a carteira atualiza sozinha e
            você recebe uma notificação.
          </p>
          <div className="flex items-center gap-2 rounded-xl bg-raised p-1.5 pl-3.5">
            <span className="mono min-w-0 flex-1 truncate text-[12.5px] text-ink">{link}</span>
            <BotaoP
              tamanho="p"
              variante="contorno"
              icone="copiar"
              onClick={() => copiar(link) && avisar("Link copiado")}
            >
              Copiar
            </BotaoP>
          </div>
          <div>
            <p className="mb-1.5 text-[12.5px] font-semibold">Mensagem sugerida</p>
            <p className="rounded-xl bg-raised px-3.5 py-3 text-[13px] leading-relaxed text-muted">{msg}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href={linkWhatsApp(c.celular, msg)} target="_blank" rel="noreferrer">
              <BotaoP icone="whatsapp">Enviar pelo WhatsApp</BotaoP>
            </a>
            <BotaoP variante="suave" icone="copiar" onClick={() => copiar(msg) && avisar("Mensagem copiada")}>
              Copiar mensagem
            </BotaoP>
            <a href={link} target="_blank" rel="noreferrer">
              <BotaoP variante="texto" icone="externo">
                Abrir como produtor
              </BotaoP>
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <Lateral />
      <div className="min-w-0 flex-1">
        <Topo />
        <main className="mx-auto max-w-[1400px] px-6 py-7 xl:px-8">{children}</main>
      </div>
      <LinkGerado />
    </div>
  );
}

export function PortalContador({ children }: { children: ReactNode }) {
  return (
    <PortalProvider>
      <Moldura>{children}</Moldura>
    </PortalProvider>
  );
}

/** Cabeçalho de cada tela do portal. */
export function Cabecalho({
  titulo,
  sub,
  acoes,
}: {
  titulo: string;
  sub?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">{titulo}</h1>
        {sub && <p className="mt-1.5 max-w-[80ch] text-[13.5px] leading-relaxed text-muted">{sub}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
