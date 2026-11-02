import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Coope — painel do contador",
  description: "Demonstração: a carteira rural de um escritório pronta para o IBS/CBS de 2027.",
};

export default function LayoutContador({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
