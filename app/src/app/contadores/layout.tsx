import type { Metadata } from "next";
import type { ReactNode } from "react";
import { asset } from "@/lib/asset";

const TITULO = "Coope para contadores: a carteira rural pronta para 2027";
const DESCRICAO =
  "A Coope lê notas e extratos dos seus produtores e entrega a carteira conferida para a reforma de 2027. Faça o pré-cadastro do escritório.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    type: "website",
    locale: "pt_BR",
    images: [{ url: asset("/contadores/og.jpg"), width: 1200, height: 630, alt: "Coope para contadores" }],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO, images: [asset("/contadores/og.jpg")] },
};

export default function LayoutContadores({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
