import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Coope — app do produtor",
  description: "Demonstração navegável: notas, imposto, crédito e conta com Pix.",
};

export default function LayoutApp({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
