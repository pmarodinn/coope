"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Scroll com inércia. O padrão do navegador entrega a rolagem em degraus; a
 * interpolação do Lenis é o que faz o resto das animações de scroll parecerem
 * contínuas em vez de picotadas.
 */
export function LenisScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3.2),
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
    });

    let frame = 0;
    const laco = (t: number) => {
      lenis.raf(t);
      frame = requestAnimationFrame(laco);
    };
    frame = requestAnimationFrame(laco);

    // Âncoras internas passam a respeitar a mesma inércia.
    const clique = (e: MouseEvent) => {
      const alvo = (e.target as HTMLElement)?.closest?.('a[href^="#"]');
      const href = alvo?.getAttribute("href");
      if (!href || href === "#") return;
      const destino = document.querySelector(href);
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino as HTMLElement, { offset: -72 });
    };
    document.addEventListener("click", clique);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", clique);
      lenis.destroy();
    };
  }, []);

  return null;
}
