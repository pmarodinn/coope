"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { instalarApiLocal } from "@/lib/api-local";
import { LenisScroll } from "./site/lenis-scroll";
import { Shell } from "./shell";

// No build estático não há servidor para atender /api/*. A instalação acontece
// na avaliação do módulo, antes de qualquer efeito de tela disparar um fetch.
if (process.env.NEXT_PUBLIC_ESTATICO === "1") {
  instalarApiLocal();
}

/**
 * A raiz é o site de apresentação; o produto vive sob /app e usa a moldura de
 * celular. Quem chega pelo endereço nu encontra a tese, não um painel logado.
 */
export function Chrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (process.env.NEXT_PUBLIC_ESTATICO === "1") instalarApiLocal();

  if (path.startsWith("/app")) return <Shell>{children}</Shell>;

  // O console é leitura de dado denso: rolagem suave atrapalha a varredura.
  const ehConsole = path.startsWith("/motor");

  return (
    <div className="site-escuro min-h-screen bg-[--fundo] text-[--tinta] antialiased">
      {!ehConsole && <LenisScroll />}
      {children}
    </div>
  );
}
