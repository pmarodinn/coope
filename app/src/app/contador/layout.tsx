import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Coope — portal do contador",
  description: "Demonstração: o portal do escritório de contabilidade com a carteira rural pronta para o IBS/CBS de 2027.",
};

export default function LayoutContador({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
