"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { asset } from "@/lib/asset";

/* ---------------- ícones ---------------- */

const PATHS: Record<string, ReactNode> = {
  casa: <path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9" />,
  nota: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9.5 8.5h5M9.5 12.5h5" />
    </>
  ),
  credito: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
    </>
  ),
  conta: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5.5 10v8M18.5 10v8M10 10v8M14 10v8M3 20h18" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
  seta: <path d="m9 5 7 7-7 7" />,
  mais: <path d="M12 5v14M5 12h14" />,
  enviar: <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  cadeado: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  raio: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  olho: (
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  escudo: <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3Z" />,
  voltar: <path d="m14 5-7 7 7 7" />,
};

export function Icone({
  nome,
  tamanho = 20,
  className = "",
}: {
  nome: keyof typeof PATHS | string;
  tamanho?: number;
  className?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[nome] ?? null}
    </svg>
  );
}

/* ---------------- superfícies ---------------- */

export function Tile({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base = `rounded-card bg-surface shadow-card ${className}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full text-left transition-transform active:scale-[0.985]`}
      >
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

export function Titulo({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">{children}</h2>
      {acao}
    </div>
  );
}

/* ---------------- números ---------------- */

export function Figura({
  valor,
  rotulo,
  tom = "ink",
  nota,
}: {
  valor: string;
  rotulo?: string;
  tom?: "ink" | "brand" | "bad";
  nota?: ReactNode;
}) {
  const cor = tom === "brand" ? "text-brand" : tom === "bad" ? "text-bad" : "text-ink";
  return (
    <div>
      {rotulo && <p className="text-[13px] font-medium text-muted">{rotulo}</p>}
      <p className={`figure mt-1.5 ${cor}`}>{valor}</p>
      {nota && <p className="mt-2 text-[13px] leading-snug text-muted">{nota}</p>}
    </div>
  );
}

/* ---------------- controles ---------------- */

export function Botao({
  children,
  onClick,
  variante = "primario",
  disabled,
  carregando,
  largura = "auto",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "suave" | "texto";
  disabled?: boolean;
  carregando?: boolean;
  largura?: "auto" | "cheia";
}) {
  const look =
    variante === "primario"
      ? "bg-brand text-brand-ink"
      : variante === "suave"
        ? "bg-raised text-ink"
        : "text-brand";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 ${look} ${
        largura === "cheia" ? "w-full" : ""
      }`}
    >
      {carregando && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/** Atalho circular — a fileira de ações do topo. */
export function Atalho({
  icone,
  rotulo,
  href,
  onClick,
  ativo = true,
}: {
  icone: string;
  rotulo: string;
  href?: string;
  onClick?: () => void;
  ativo?: boolean;
}) {
  const miolo = (
    <>
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand text-brand-ink">
        <Icone nome={icone} tamanho={21} />
      </span>
      <span className="text-center text-[11.5px] font-medium leading-tight text-ink">{rotulo}</span>
    </>
  );
  const classe =
    "flex w-[70px] shrink-0 flex-col items-center gap-2 transition-transform active:scale-95";

  if (href && ativo) {
    return (
      <Link href={href} className={classe}>
        {miolo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={!ativo} className={`${classe} disabled:opacity-35`}>
      {miolo}
    </button>
  );
}

export function Chip({
  children,
  tom = "neutro",
}: {
  children: ReactNode;
  tom?: "neutro" | "bom" | "atencao" | "ruim";
}) {
  const cor =
    tom === "bom"
      ? "bg-brand-soft text-brand"
      : tom === "atencao"
        ? "bg-warn-soft text-warn"
        : tom === "ruim"
          ? "bg-bad-soft text-bad"
          : "bg-raised text-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${cor}`}>
      {children}
    </span>
  );
}

/* ---------------- listas ---------------- */

export function Linha({
  icone,
  titulo,
  sub,
  valor,
  valorSub,
  tom = "ink",
  acao,
  onClick,
}: {
  icone?: string;
  titulo: string;
  sub?: string;
  valor?: string;
  valorSub?: ReactNode;
  tom?: "ink" | "brand" | "bad";
  acao?: ReactNode;
  onClick?: () => void;
}) {
  const cor = tom === "brand" ? "text-brand" : tom === "bad" ? "text-bad" : "text-ink";
  const conteudo = (
    <>
      {icone && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-muted">
          <Icone nome={icone} tamanho={18} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium text-ink">{titulo}</span>
        {sub && <span className="mt-0.5 block truncate text-[12.5px] text-muted">{sub}</span>}
      </span>
      {valor && (
        <span className="shrink-0 text-right">
          <span className={`tnum block text-[14.5px] font-semibold ${cor}`}>{valor}</span>
          {valorSub && <span className="mt-0.5 block text-[11.5px] text-faint">{valorSub}</span>}
        </span>
      )}
      {acao}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-raised"
      >
        {conteudo}
      </button>
    );
  }
  return <div className="flex items-center gap-3 px-4 py-3">{conteudo}</div>;
}

export function Divisor() {
  return <div className="ml-[68px] h-px bg-line" />;
}

/* ---------------- progresso ---------------- */

export function Barra({
  valor,
  tom = "brand",
  altura = 8,
}: {
  valor: number;
  tom?: "brand" | "bad" | "warn";
  altura?: number;
}) {
  const cor = tom === "bad" ? "bg-bad" : tom === "warn" ? "bg-warn" : "bg-brand";
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-raised"
      style={{ height: altura }}
      role="progressbar"
      aria-valuenow={Math.round(valor * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${cor} transition-[width] duration-700 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, valor * 100))}%` }}
      />
    </div>
  );
}

/** Anel de score, no lugar de um gráfico cheio de eixo. */
export function Anel({ valor, centro, sub }: { valor: number; centro: string; sub?: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[132px] w-[132px] shrink-0">
      <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--raised)" strokeWidth="11" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, valor)))}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-[30px] font-bold leading-none tracking-tight text-ink">{centro}</span>
        {sub && <span className="mt-1 text-[11.5px] font-medium text-muted">{sub}</span>}
      </div>
    </div>
  );
}

/* ---------------- texto de apoio ---------------- */

/** Uma frase curta que explica o porquê, sem jargão. */
export function Dica({ icone = "olho", children }: { icone?: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-card bg-raised px-4 py-3.5">
      <span className="mt-px shrink-0 text-brand">
        <Icone nome={icone} tamanho={17} />
      </span>
      <p className="text-[13px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-[13px] leading-relaxed text-faint">{children}</p>;
}

/* ---------------- marca ---------------- */

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-brand"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/coope-mark.png")} alt="Coope" style={{ width: size * 0.78, height: size * 0.78 }} />
    </span>
  );
}

export function Lockup({ largura = 108 }: { largura?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset("/coope-lockup.png")}
      alt="Coope"
      className="block rounded-md"
      style={{ width: largura, height: "auto" }}
    />
  );
}
