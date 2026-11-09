import type { Metadata } from "next";
import type { ReactNode } from "react";
import { asset } from "@/lib/asset";

const TITULO = "Pesquisa com escritórios de contabilidade";
const DESCRICAO = "Perguntas sobre como o seu escritório trabalha hoje, cerca de 4 minutos. É só escolher, quase sem digitar.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    type: "website",
    locale: "pt_BR",
    images: [{ url: asset("/og-pesquisa-contadores.png"), width: 1200, height: 630, alt: TITULO }],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO, images: [asset("/og-pesquisa-contadores.png")] },
};

export default function LayoutPesquisaContadores({ children }: { children: ReactNode }) {
  return children;
}
