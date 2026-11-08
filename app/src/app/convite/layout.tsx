import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Coope — convite do seu contador",
  description: "Demonstração: pré-cadastro do produtor rural a partir do link enviado pelo escritório.",
};

export default function LayoutConvite({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
