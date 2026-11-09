"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Entrada de seção ao rolar: leva o olho para o bloco que acabou de chegar.
 *
 * O HTML do servidor sai sempre visível (sem JavaScript, para buscadores e para
 * a prévia do link). Só no navegador, e só o que ainda está abaixo da tela, é
 * escondido e volta ao entrar na vista. Com movimento reduzido, nada se mexe.
 */
export function Revelar({
  children,
  atraso = 0,
  className = "",
}: {
  children: ReactNode;
  atraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<"parado" | "oculto" | "visto">("parado");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setFase("oculto");
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setFase("visto");
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${fase === "parado" ? "" : "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"} ${
        fase === "oculto" ? "translate-y-[18px] opacity-0" : ""
      }`}
      style={fase === "visto" ? { transitionDelay: `${atraso}s` } : undefined}
    >
      {children}
    </div>
  );
}
