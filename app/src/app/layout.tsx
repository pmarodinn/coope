import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Chrome } from "@/components/chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coope — Do agro, para o agro",
  description:
    "Suas notas organizadas, menos imposto e crédito em horas. Protótipo de demonstração.",
  // Link compartilhável, mas fora de buscadores: o conteúdo traz modelo de
  // negócio que não deve ser indexado.
  robots: { index: false, follow: false, nocache: true },
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
