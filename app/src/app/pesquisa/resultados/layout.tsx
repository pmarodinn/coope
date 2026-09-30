import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Resultados da pesquisa",
  description: "Leitura das respostas da pesquisa com produtores.",
  // A página não guarda nada no servidor, mas o link não precisa circular.
  robots: { index: false, follow: false },
  openGraph: { title: "Resultados da pesquisa", images: [] },
  twitter: { card: "summary", title: "Resultados da pesquisa", images: [] },
};

export default function LayoutResultados({ children }: { children: ReactNode }) {
  return children;
}
