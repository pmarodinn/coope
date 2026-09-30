import type { Metadata } from "next";
import type { ReactNode } from "react";
import { asset } from "@/lib/asset";

const TITULO = "Pesquisa rápida para quem produz";
const DESCRICAO = "Perguntas sobre como você toca a fazenda hoje, cerca de 3 minutos. Sem nome, CPF ou telefone.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    type: "website",
    locale: "pt_BR",
    images: [{ url: asset("/og-pesquisa.png"), width: 1200, height: 630, alt: TITULO }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
    images: [asset("/og-pesquisa.png")],
  },
};

export default function LayoutPesquisa({ children }: { children: ReactNode }) {
  return children;
}
