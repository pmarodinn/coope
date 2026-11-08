"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Chip, Icone } from "@/components/ui";
import type { Certificado, ClientePortal, StatusConvite } from "@/lib/portal";
import { ROTULO_ENQUADRAMENTO, type Extrato } from "@/lib/reforma";

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const mi = (v: number) =>
  v >= 1_000_000 ? `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} mi` : `R$ ${Math.round(v / 1000)} mil`;

/* ---------------- superfícies ---------------- */

export function Cartao({
  titulo,
  legenda,
  acao,
  children,
  className = "",
  semPadding = false,
}: {
  titulo?: ReactNode;
  legenda?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
  semPadding?: boolean;
}) {
  return (
    <section className={`min-w-0 rounded-card bg-surface shadow-card ring-1 ring-line ${className}`}>
      {(titulo || acao) && (
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div className="min-w-0">
            {titulo && <h2 className="text-[15px] font-semibold tracking-tight text-ink">{titulo}</h2>}
            {legenda && <p className="mt-1 text-[12.5px] leading-snug text-muted">{legenda}</p>}
          </div>
          {acao && <div className="shrink-0">{acao}</div>}
        </header>
      )}
      <div className={semPadding ? "" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

export function Kpi({
  rotulo,
  valor,
  nota,
  tom = "ink",
  icone,
  onClick,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  tom?: "ink" | "brand" | "warn" | "bad";
  icone?: string;
  onClick?: () => void;
}) {
  const cor = { ink: "text-ink", brand: "text-brand", warn: "text-warn", bad: "text-bad" }[tom];
  const fundo = { ink: "bg-raised text-muted", brand: "bg-brand-soft text-brand", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad" }[tom];
  const miolo = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] font-medium text-muted">{rotulo}</p>
        {icone && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${fundo}`}>
            <Icone nome={icone} tamanho={16} />
          </span>
        )}
      </div>
      <p className={`tnum mt-2 text-[30px] font-bold leading-none tracking-tight ${cor}`}>{valor}</p>
      {nota && <p className="mt-2 text-[12px] leading-snug text-faint">{nota}</p>}
    </>
  );
  const classe = "rounded-card bg-surface p-4 text-left shadow-card ring-1 ring-line";
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={`${classe} transition-shadow hover:shadow-float`}>
        {miolo}
      </button>
    );
  return <div className={classe}>{miolo}</div>;
}

export function BotaoP({
  children,
  onClick,
  variante = "primario",
  icone,
  disabled,
  tamanho = "m",
  type = "button",
  title,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "suave" | "contorno" | "texto" | "perigo";
  icone?: string;
  disabled?: boolean;
  tamanho?: "p" | "m";
  type?: "button" | "submit";
  title?: string;
}) {
  const look = {
    primario: "bg-brand text-brand-ink hover:brightness-110",
    suave: "bg-raised text-ink hover:bg-line",
    contorno: "bg-surface text-ink ring-1 ring-line hover:ring-faint",
    texto: "text-brand hover:bg-brand-soft",
    perigo: "text-bad hover:bg-bad-soft",
  }[variante];
  const tam = tamanho === "p" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${tam} ${look}`}
    >
      {icone && <Icone nome={icone} tamanho={tamanho === "p" ? 14 : 16} />}
      {children}
    </button>
  );
}

export function Campo({
  rotulo,
  children,
  dica,
}: {
  rotulo: string;
  children: ReactNode;
  dica?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink">{rotulo}</span>
      <div className="mt-1.5">{children}</div>
      {dica && <span className="mt-1 block text-[11.5px] text-faint">{dica}</span>}
    </label>
  );
}

export const classeEntrada =
  "h-10 w-full rounded-xl bg-raised px-3.5 text-[13.5px] text-ink outline-none ring-1 ring-transparent placeholder:text-faint focus:bg-surface focus:ring-brand";

/* ---------------- sobreposições ---------------- */

function useEsc(fechar: () => void) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [fechar]);
}

export function Modal({
  aberto,
  fechar,
  titulo,
  children,
  largura = 520,
}: {
  aberto: boolean;
  fechar: () => void;
  titulo: string;
  children: ReactNode;
  largura?: number;
}) {
  useEsc(fechar);
  if (!aberto) return null;
  // No body: a tela entra com transform (.rise), que prenderia o fixed dentro dela.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={fechar} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-label={titulo}
        className="pop relative max-h-[90vh] w-full overflow-y-auto rounded-sheet bg-surface p-6 shadow-float"
        style={{ maxWidth: largura }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-[17px] font-semibold tracking-tight">{titulo}</h2>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="-mr-2 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-raised"
          >
            <Icone nome="fechar" tamanho={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Gaveta({ aberta, fechar, children }: { aberta: boolean; fechar: () => void; children: ReactNode }) {
  useEsc(fechar);
  if (!aberta) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/20" onClick={fechar} aria-hidden />
      <aside className="gaveta absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col bg-canvas shadow-float">
        {children}
      </aside>
    </div>,
    document.body,
  );
}

/* ---------------- selos de situação ---------------- */

export function SeloEnquadramento({ c }: { c: Pick<ClientePortal, "enquadramento"> }) {
  return (
    <Chip tom={c.enquadramento === "obrigatorio" ? "atencao" : c.enquadramento === "perto" ? "ruim" : "neutro"}>
      {ROTULO_ENQUADRAMENTO[c.enquadramento]}
    </Chip>
  );
}

export function SeloCnpj({ v }: { v: "feito" | "pendente" }) {
  return <Chip tom={v === "feito" ? "bom" : "ruim"}>{v === "feito" ? "Feito" : "Falta"}</Chip>;
}

export const ROTULO_CERT: Record<Certificado, string> = {
  valido: "Válido",
  vence: "Vence logo",
  vencido: "Vencido",
  faltando: "Sem certificado",
};

export function SeloCertificado({ v }: { v: Certificado }) {
  return <Chip tom={v === "valido" ? "bom" : v === "vence" ? "atencao" : "ruim"}>{ROTULO_CERT[v]}</Chip>;
}

export const ROTULO_EXTRATO: Record<Extrato, string> = {
  open_finance: "Open Finance",
  ofx: "Arquivo",
  faltando: "Faltando",
};

export function SeloExtrato({ v }: { v: Extrato }) {
  return (
    <Chip tom={v === "open_finance" ? "bom" : v === "ofx" ? "atencao" : "ruim"}>{ROTULO_EXTRATO[v]}</Chip>
  );
}

export function SeloConvite({ v }: { v: StatusConvite }) {
  const tom = v === "concluido" ? "bom" : v === "aberto" ? "atencao" : "neutro";
  const r = { enviado: "Enviado", aberto: "Aberto", concluido: "Concluído", cancelado: "Cancelado" }[v];
  return <Chip tom={tom}>{r}</Chip>;
}

export function PontoUrgencia({ u }: { u: 1 | 2 | 3 }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${u === 1 ? "bg-bad" : u === 2 ? "bg-warn" : "bg-brand"}`}
      title={u === 1 ? "Trava janeiro" : u === 2 ? "Precisa de ação" : "Em dia"}
    />
  );
}

export function Iniciais({ nome, tamanho = 36 }: { nome: string; tamanho?: number }) {
  const partes = nome
    .replace(/\(.*\)/, "")
    .split(" ")
    .filter((p) => p.length > 2 || /^[A-Z]/.test(p));
  const ini = ((partes[0]?.[0] ?? "") + (partes[partes.length - 1]?.[0] ?? "")).toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand"
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
    >
      {ini}
    </span>
  );
}

export function Vazio({ icone = "check", titulo, children }: { icone?: string; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Icone nome={icone} tamanho={22} />
      </span>
      <p className="mt-3 text-[14px] font-semibold">{titulo}</p>
      {children && <p className="mt-1 max-w-[42ch] text-[12.5px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export function Esqueleto() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-card bg-surface" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-card bg-surface" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-card bg-surface" />
    </div>
  );
}

export function copiar(texto: string) {
  try {
    void navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
