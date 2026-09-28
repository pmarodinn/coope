import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LenisScroll } from "@/components/site/lenis-scroll";

export const metadata: Metadata = {
  title: "Coope — A camada que falta entre o dado fiscal do campo e o capital",
  description:
    "O agronegócio move 25% do PIB brasileiro sobre uma camada financeira analógica. A Coope constrói a orquestração entre a nota fiscal do produtor, a infraestrutura bancária regulada e o capital privado.",
};

export default function LayoutInvestidores({ children }: { children: ReactNode }) {
  return (
    <div className="site-escuro min-h-screen bg-[--fundo] text-[--tinta] antialiased">
      <LenisScroll />
      {children}
    </div>
  );
}
