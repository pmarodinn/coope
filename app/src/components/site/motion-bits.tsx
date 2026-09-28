"use client";

import NumberFlow from "@number-flow/react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Mola única para toda a página: um material só se comporta de um jeito. */
export const MOLA = { type: "spring", stiffness: 140, damping: 22, mass: 0.9 } as const;
export const MOLA_SUAVE = { type: "spring", stiffness: 80, damping: 20, mass: 1 } as const;

/* ---------------- entrada ---------------- */

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduz = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduz ? false : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ ...MOLA_SUAVE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Revela palavra a palavra — só para a manchete, onde a leitura é o evento. */
export function RevealText({
  texto,
  className = "",
  delay = 0,
}: {
  texto: string;
  className?: string;
  delay?: number;
}) {
  const reduz = useReducedMotion();
  const palavras = texto.split(" ");

  if (reduz) return <span className={className}>{texto}</span>;

  return (
    <span className={className}>
      {palavras.map((p, i) => (
        <span key={`${p}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ ...MOLA_SUAVE, delay: delay + i * 0.055 }}
          >
            {p}
            {i < palavras.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ---------------- números ---------------- */

/** Só conta quando entra na tela — um número que já rodou não comunica nada. */
export function Contador({
  valor,
  prefixo = "",
  sufixo = "",
  casas = 0,
  className = "",
}: {
  valor: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visivel = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduz = useReducedMotion();

  return (
    <span ref={ref} className={className}>
      {prefixo}
      <NumberFlow
        value={visivel || reduz ? valor : 0}
        format={{ minimumFractionDigits: casas, maximumFractionDigits: casas }}
        locales="pt-BR"
        transformTiming={{ duration: reduz ? 0 : 1100, easing: "cubic-bezier(.22,1,.36,1)" }}
        spinTiming={{ duration: reduz ? 0 : 1100, easing: "cubic-bezier(.22,1,.36,1)" }}
        willChange
      />
      {sufixo}
    </span>
  );
}

/* ---------------- ponteiro ---------------- */

/** Botão que se inclina na direção do cursor. Valores fora do ciclo do React. */
export function Magnetico({
  children,
  forca = 0.35,
  className = "",
  onClick,
}: {
  children: ReactNode;
  forca?: number;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduz = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, MOLA);
  const y = useSpring(my, MOLA);

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={reduz ? undefined : { x, y }}
      whileTap={{ scale: 0.97 }}
      transition={MOLA}
      onPointerMove={(e) => {
        if (reduz || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width / 2)) * forca);
        my.set((e.clientY - (r.top + r.height / 2)) * forca);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/** Cartão com brilho que segue o cursor e inclinação 3D contida. */
export function CartaoVivo({
  children,
  className = "",
  inclina = 6,
}: {
  children: ReactNode;
  className?: string;
  inclina?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduz = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [inclina, -inclina]), MOLA);
  const ry = useSpring(useTransform(px, [0, 1], [-inclina, inclina]), MOLA);

  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const brilho = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(63,199,127,0.14), transparent 62%)`;

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        if (reduz || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      style={
        reduz ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1000 }
      }
      className={`relative ${className}`}
    >
      {!reduz && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: brilho }}
        />
      )}
      {children}
    </motion.div>
  );
}

/* ---------------- barra de leitura ---------------- */

export function BarraProgresso({ progresso }: { progresso: MotionValue<number> }) {
  const escala = useSpring(progresso, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX: escala }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-[--acento]"
    />
  );
}

/* ---------------- utilidades ---------------- */

export function useMontado() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
