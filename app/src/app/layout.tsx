import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Chrome } from "@/components/chrome";
import { asset } from "@/lib/asset";
import "./globals.css";

const TITULO = "Coope — Crédito rural em horas, com a nota fiscal como prova";
const DESCRICAO =
  "A fazenda já emite as notas que provam o que ela fatura e o que gasta. A Coope organiza esse histórico e leva pronto a quem empresta.";

export const metadata: Metadata = {
  // Sem isto o Next resolve a imagem contra localhost e a prévia do link
  // chega quebrada no WhatsApp.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4310"),
  title: TITULO,
  description: DESCRICAO,
  // Link compartilhável, mas fora de buscadores: o conteúdo traz modelo de
  // negócio que não deve ser indexado.
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    type: "website",
    locale: "pt_BR",
    images: [{ url: asset("/og.png"), width: 1200, height: 630, alt: "Coope" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
    images: [asset("/og.png")],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Claro é o padrão servido; a preferência salva é reaplicada no cliente.
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
