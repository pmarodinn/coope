"use client";

import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { useRef } from "react";

/**
 * Texto que acende palavra a palavra conforme a página rola. O efeito só se
 * justifica em uma frase por página — usar em todo parágrafo vira ruído.
 */

function Palavra({
  texto,
  inicio,
  fim,
  progresso,
  destaque,
}: {
  texto: string;
  inicio: number;
  fim: number;
  progresso: MotionValue<number>;
  destaque: boolean;
}) {
  const opacidade = useTransform(progresso, [inicio, fim], [0.16, 1]);
  return (
    <motion.span
      style={{ opacity: opacidade }}
      className={destaque ? "text-[--acento]" : undefined}
    >
      {texto}{" "}
    </motion.span>
  );
}

export function TextoScroll({
  texto,
  destacar = [],
  className = "",
}: {
  texto: string;
  /** Palavras que recebem a cor de acento, comparadas sem pontuação. */
  destacar?: string[];
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduz = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });

  const palavras = texto.split(" ");
  const limpa = (p: string) => p.replace(/[.,—:;]/g, "").toLowerCase();
  const alvo = destacar.map((d) => d.toLowerCase());

  if (reduz) {
    return (
      <p ref={ref} className={className}>
        {palavras.map((p, i) => (
          <span key={i} className={alvo.includes(limpa(p)) ? "text-[--acento]" : undefined}>
            {p}{" "}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p ref={ref} className={className}>
      {palavras.map((p, i) => {
        const passo = 1 / palavras.length;
        return (
          <Palavra
            key={i}
            texto={p}
            inicio={i * passo}
            fim={i * passo + passo * 2.2}
            progresso={scrollYProgress}
            destaque={alvo.includes(limpa(p))}
          />
        );
      })}
    </p>
  );
}

/**
 * Faixa deslizante das normas. Duas cópias lado a lado e um deslocamento de
 * -50% dão um laço sem costura, sem depender de medir o conteúdo.
 */
export function Marquise({ itens, duracao = 46 }: { itens: string[]; duracao?: number }) {
  const reduz = useReducedMotion();
  const fita = [...itens, ...itens];

  if (reduz) {
    return (
      <div className="flex flex-wrap gap-x-8 gap-y-3 px-6">
        {itens.map((i) => (
          <span key={i} className="mono text-[11.5px] uppercase tracking-[0.16em] text-[--tinta-3]">
            {i}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)]">
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: duracao, repeat: Infinity, ease: "linear" }}
      >
        {fita.map((i, k) => (
          <span
            key={`${i}-${k}`}
            className="mono flex items-center gap-10 text-[11.5px] uppercase tracking-[0.16em] text-[--tinta-3]"
          >
            {i}
            <span className="h-1 w-1 rounded-full bg-[--acento] opacity-50" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
