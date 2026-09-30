"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { asset } from "@/lib/asset";
import { Icone, Logo } from "./ui";

const ABAS = [
  { href: "/app", icone: "casa", rotulo: "Início" },
  { href: "/app/imposto", icone: "nota", rotulo: "Imposto" },
  { href: "/app/credito", icone: "credito", rotulo: "Crédito" },
  { href: "/app/conta", icone: "conta", rotulo: "Conta" },
  { href: "/app/conversa", icone: "chat", rotulo: "Conversa" },
] as const;

function Menu() {
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState<"dark" | "light">("light");
  const [indo, setIndo] = useState(false);

  // localStorage lança exceção em navegador que bloqueia armazenamento; o tema
  // é só conveniência, então sem armazenamento o app fica no claro e segue.
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

  function alternar() {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("coope-tema", novo);
    } catch {
      /* vale só nesta visita */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-muted transition-colors active:bg-line"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="h-[3px] w-[3px] rounded-full bg-current" />
          <span className="h-[3px] w-[3px] rounded-full bg-current" />
          <span className="h-[3px] w-[3px] rounded-full bg-current" />
        </span>
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} aria-hidden />
          <div className="pop absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-card bg-surface shadow-float">
            {[
              { href: "/app/seguranca", icone: "escudo", rotulo: "Segurança" },
              { href: "/app/cooperativa", icone: "conta", rotulo: "Visão da cooperativa" },
              { href: "/app/negocio", icone: "credito", rotulo: "Números do negócio" },
              { href: "/motor", icone: "raio", rotulo: "Motor de decisão" },
            ].map((l) => (
              <div key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setAberto(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium text-ink transition-colors active:bg-raised"
                >
                  <Icone nome={l.icone} tamanho={17} />
                  {l.rotulo}
                </Link>
                <div className="h-px bg-line" />
              </div>
            ))}
            <button
              type="button"
              onClick={alternar}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium text-ink transition-colors active:bg-raised"
            >
              <Icone nome="olho" tamanho={17} />
              Tema {tema === "dark" ? "claro" : "escuro"}
            </button>
            <div className="h-px bg-line" />
            <Link
              href="/"
              onClick={() => setAberto(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium text-ink transition-colors active:bg-raised"
            >
              <Icone nome="voltar" tamanho={17} />
              Voltar à apresentação
            </Link>
            <div className="h-px bg-line" />
            <button
              type="button"
              disabled={indo}
              onClick={async () => {
                setIndo(true);
                await fetch("/api/reset", { method: "POST" });
                window.location.assign(asset("/app/"));
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium text-muted transition-colors active:bg-raised disabled:opacity-50"
            >
              <Icone nome="voltar" tamanho={17} />
              {indo ? "Reiniciando…" : "Começar do zero"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen justify-center bg-outer md:items-center md:py-8">
      {/* Moldura do app: ocupa a tela no celular, vira um aparelho no desktop. */}
      <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-canvas md:h-[860px] md:max-h-[92vh] md:rounded-[38px] md:shadow-float md:ring-1 md:ring-black/5">
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-5">
          <Logo size={34} />
          <Menu />
        </header>

        <main className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          {children}
        </main>

        <nav className="shrink-0 border-t border-line bg-surface px-1 pb-2 pt-1.5">
          <ul className="flex">
            {ABAS.map((a) => {
              const ativo = path === a.href;
              return (
                <li key={a.href} className="flex-1">
                  <Link
                    href={a.href}
                    className={`flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors ${
                      ativo ? "text-brand" : "text-faint"
                    }`}
                  >
                    <Icone nome={a.icone} tamanho={21} />
                    <span className="text-[10.5px] font-semibold leading-none">{a.rotulo}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
