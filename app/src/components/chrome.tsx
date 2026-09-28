"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { instalarApiLocal } from "@/lib/api-local";
import { Shell } from "./shell";

/** Rotas que não são o app do produtor e por isso não usam a moldura de celular. */
const SOLTAS = ["/investidores"];

// No build estático não há servidor para atender /api/*. A instalação acontece
// na avaliação do módulo, antes de qualquer efeito de tela disparar um fetch.
if (process.env.NEXT_PUBLIC_ESTATICO === "1") {
  instalarApiLocal();
}

export function Chrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (process.env.NEXT_PUBLIC_ESTATICO === "1") instalarApiLocal();
  if (SOLTAS.some((r) => path.startsWith(r))) return <>{children}</>;
  return <Shell>{children}</Shell>;
}
