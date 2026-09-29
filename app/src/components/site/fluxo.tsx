"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/**
 * O argumento regulatório em imagem: o dinheiro vai direto do financiador para
 * a conta do produtor e dela para o fornecedor. A Coope só emite instrução e
 * recebe dado — nunca entra no caminho dos recursos.
 *
 * As duas linguagens visuais são o ponto: sólido é dinheiro, tracejado é dado.
 */

const NOS = [
  { id: "fiagro", x: 96, y: 92, titulo: "Fiagro", sub: "financiador" },
  { id: "produtor", x: 460, y: 92, titulo: "Produtor", sub: "conta no CPF dele" },
  { id: "fornecedor", x: 824, y: 92, titulo: "Fornecedor", sub: "insumo" },
  { id: "coope", x: 460, y: 288, titulo: "Coope", sub: "orquestração" },
];

const DINHEIRO = [
  { d: "M 168 92 L 388 92", atraso: 0 },
  { d: "M 532 92 L 752 92", atraso: 1.1 },
];

const DADOS = [
  { d: "M 460 252 L 460 128", atraso: 0.2 },
  { d: "M 404 272 C 240 248 150 190 122 132", atraso: 0.9 },
  { d: "M 516 272 C 680 248 770 190 798 132", atraso: 1.5 },
];

function No({ no }: { no: (typeof NOS)[number] }) {
  const destaque = no.id === "coope";
  const w = destaque ? 144 : 136;
  const h = 62;

  return (
    <g>
      <rect
        x={no.x - w / 2}
        y={no.y - h / 2}
        width={w}
        height={h}
        rx={14}
        fill={destaque ? "rgba(63,199,127,0.1)" : "#0b1f17"}
        stroke={destaque ? "rgba(63,199,127,0.55)" : "rgba(233,255,241,0.12)"}
        strokeWidth={1}
      />
      <text
        x={no.x}
        y={no.y - 4}
        textAnchor="middle"
        fill={destaque ? "#3fc77f" : "#eaf2ec"}
        style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        {no.titulo}
      </text>
      <text
        x={no.x}
        y={no.y + 15}
        textAnchor="middle"
        fill="#66796e"
        style={{ fontSize: 10.5, letterSpacing: "0.04em" }}
      >
        {no.sub}
      </text>
    </g>
  );
}

export function Fluxo() {
  const ref = useRef<HTMLDivElement>(null);
  const visivel = useInView(ref, { once: true, margin: "-18% 0px" });
  const reduz = useReducedMotion();
  const anima = visivel && !reduz;

  return (
    <div ref={ref} className="w-full">
      {/* No celular o diagrama não cabe legível: em vez de encolher o texto
          para 5px, ele rola na horizontal com uma largura mínima. */}
      <div className="-mx-6 overflow-x-auto px-6 pb-2 md:mx-0 md:overflow-visible md:px-0">
      <svg
        viewBox="0 0 920 360"
        className="w-full min-w-[620px] md:min-w-0"
        role="img"
        aria-label="O dinheiro vai do financiador direto para a conta do produtor e dela para o fornecedor. A Coope troca apenas dados e instruções com os três."
      >
        {/* dados: tracejado */}
        {DADOS.map((p, i) => (
          <motion.path
            key={`d-${i}`}
            d={p.d}
            fill="none"
            stroke="rgba(233,255,241,0.2)"
            strokeWidth={1}
            strokeDasharray="4 5"
            initial={reduz ? undefined : { pathLength: 0, opacity: 0 }}
            animate={visivel ? { pathLength: 1, opacity: 1 } : undefined}
            transition={{ duration: 1.1, delay: 0.5 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}

        {/* dinheiro: sólido */}
        {DINHEIRO.map((p, i) => (
          <motion.path
            key={`m-${i}`}
            d={p.d}
            fill="none"
            stroke="rgba(63,199,127,0.5)"
            strokeWidth={1.6}
            initial={reduz ? undefined : { pathLength: 0 }}
            animate={visivel ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}

        {/* pontos que percorrem: o movimento é o que diz a direção */}
        {anima &&
          DINHEIRO.map((p, i) => (
            <motion.circle
              key={`md-${i}`}
              r={4}
              fill="#3fc77f"
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: "100%" }}
              transition={{
                duration: 2.2,
                delay: 1.1 + p.atraso,
                repeat: Infinity,
                repeatDelay: 1.4,
                ease: "easeInOut",
              }}
              style={{ offsetPath: `path("${p.d}")`, offsetRotate: "0deg" }}
            />
          ))}

        {anima &&
          DADOS.map((p, i) => (
            <motion.circle
              key={`dd-${i}`}
              r={2.4}
              fill="rgba(233,255,241,0.55)"
              initial={{ offsetDistance: "100%" }}
              animate={{ offsetDistance: "0%" }}
              transition={{
                duration: 2.6,
                delay: 1.4 + p.atraso,
                repeat: Infinity,
                repeatDelay: 1.1,
                ease: "easeInOut",
              }}
              style={{ offsetPath: `path("${p.d}")`, offsetRotate: "0deg" }}
            />
          ))}

        {NOS.map((n) => (
          <motion.g
            key={n.id}
            initial={reduz ? undefined : { opacity: 0, y: 10 }}
            animate={visivel ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: n.id === "coope" ? 0.45 : 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <No no={n} />
          </motion.g>
        ))}
      </svg>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2.5">
        <span className="flex items-center gap-2.5 text-[12.5px] text-[--tinta-2]">
          <span className="h-[2px] w-7 rounded-full bg-[--acento]" />
          dinheiro
        </span>
        <span className="flex items-center gap-2.5 text-[12.5px] text-[--tinta-2]">
          <span className="h-[1px] w-7 rounded-full border-t border-dashed border-[--tinta-2]" />
          dado e instrução
        </span>
      </div>
    </div>
  );
}
