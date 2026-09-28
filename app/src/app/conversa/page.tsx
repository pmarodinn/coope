"use client";

import { useEffect, useRef, useState } from "react";
import { Botao, Chip, Icone, Tile } from "@/components/ui";
import type { Indicacao, Perfil, Recomendacao } from "@/lib/recomendacao";
import { ROTULO_INDICACAO } from "@/lib/recomendacao";

type Bolha =
  | { tipo: "texto"; de: "coope" | "eu"; texto: string }
  | { tipo: "analise" }
  | { tipo: "cartoes" };

const ROTEIRO: Bolha[] = [
  {
    tipo: "texto",
    de: "coope",
    texto: "Bom dia, seu José. Li suas notas e o caixa da safra. Três coisas me chamaram atenção.",
  },
  { tipo: "analise" },
  {
    tipo: "texto",
    de: "eu",
    texto: "E aí, o que você acha que eu devia fazer?",
  },
  {
    tipo: "texto",
    de: "coope",
    texto:
      "Separei o que combina com o seu caso e o que é melhor deixar pra depois. Toca em cada um pra ver a conta.",
  },
  { tipo: "cartoes" },
];

const ESTILO: Record<Indicacao, { tom: "bom" | "atencao" | "neutro" | "ruim"; icone: string }> = {
  combina: { tom: "bom", icone: "check" },
  talvez: { tom: "atencao", icone: "olho" },
  nao_agora: { tom: "ruim", icone: "voltar" },
  so_explico: { tom: "neutro", icone: "escudo" },
};

function Achados({ perfil }: { perfil: Perfil }) {
  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const itens = [
    {
      icone: "raio",
      titulo: `Falta caixa em ${perfil.valeDeCaixa.mes}`,
      texto: `Você paga insumo ${perfil.mesesDescasados} meses antes de receber. No pior mês faltam ${brl(perfil.valeDeCaixa.valor)}.`,
    },
    {
      icone: "escudo",
      titulo: "Nenhum seguro na lavoura",
      texto: `${perfil.hectares.toLocaleString("pt-BR")} hectares sem cobertura. Uma seca vira dívida sem receita.`,
    },
    {
      icone: "conta",
      titulo: "Você já investiu pesado este ano",
      texto: `${brl(perfil.jaInvestiuEmMaquina)} em máquina. Isso pesa na hora de assumir outra parcela.`,
    },
  ];

  return (
    <div className="space-y-2">
      {itens.map((i) => (
        <Tile key={i.titulo} className="p-3.5">
          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-brand">
              <Icone nome={i.icone} tamanho={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold leading-snug">{i.titulo}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{i.texto}</p>
            </div>
          </div>
        </Tile>
      ))}
    </div>
  );
}

function Cartao({ r }: { r: Recomendacao }) {
  const [aberto, setAberto] = useState(r.indicacao === "combina");
  const e = ESTILO[r.indicacao];

  return (
    <Tile className="overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            e.tom === "bom"
              ? "bg-brand-soft text-brand"
              : e.tom === "atencao"
                ? "bg-warn-soft text-warn"
                : e.tom === "ruim"
                  ? "bg-bad-soft text-bad"
                  : "bg-raised text-muted"
          }`}
        >
          <Icone nome={e.icone} tamanho={16} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[14.5px] font-semibold leading-snug">{r.nome}</span>
            <Chip tom={e.tom}>{ROTULO_INDICACAO[r.indicacao]}</Chip>
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">{r.chamada}</span>
        </span>

        <span
          className={`mt-1 shrink-0 text-faint transition-transform ${aberto ? "rotate-90" : ""}`}
        >
          <Icone nome="seta" tamanho={15} />
        </span>
      </button>

      {aberto && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              Como funciona
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{r.comoFunciona}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {r.indicacao === "nao_agora" ? "Por que esperar" : "Por que no seu caso"}
            </p>
            <ul className="mt-2 space-y-2">
              {r.porQue.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="text-[13px] leading-relaxed text-ink">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {r.numeros.length > 0 && (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line">
              {r.numeros.map((n) => (
                <div key={n.rotulo} className="bg-surface px-3.5 py-2.5">
                  <p className="text-[11px] text-faint">{n.rotulo}</p>
                  <p className="tnum mt-0.5 text-[13.5px] font-semibold">{n.valor}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-warn-soft px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warn">Atenção</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{r.atencao}</p>
          </div>

          <div className="border-t border-line pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] text-faint">Quem oferece</span>
              <span className="text-right text-[12px] font-medium text-muted">{r.quemOferece}</span>
            </div>
            {!r.podeIndicar && (
              <p className="mt-2.5 flex gap-2 rounded-lg bg-raised px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                <span className="mt-px shrink-0 text-muted">
                  <Icone nome="cadeado" tamanho={14} />
                </span>
                Aqui a Coope só explica. Quem pode indicar e contratar é uma empresa registrada.
              </p>
            )}
          </div>
        </div>
      )}
    </Tile>
  );
}

export default function Conversa() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [recs, setRecs] = useState<Recomendacao[]>([]);
  const [bolhas, setBolhas] = useState<Bolha[]>([]);
  const [i, setI] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [digitando, setDigitando] = useState(false);
  const [pediu, setPediu] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/recomendacoes")
      .then((r) => r.json())
      .then((r) => {
        setPerfil(r.perfil);
        setRecs(r.recomendacoes);
      });
  }, []);

  useEffect(() => {
    if (!tocando || i >= ROTEIRO.length || !perfil) {
      if (i >= ROTEIRO.length) setTocando(false);
      return;
    }
    const prox = ROTEIRO[i];
    const daCoope = prox.tipo !== "texto" || prox.de === "coope";
    setDigitando(daCoope);

    const t = setTimeout(
      () => {
        setDigitando(false);
        setBolhas((b) => [...b, prox]);
        setI((x) => x + 1);
      },
      prox.tipo === "texto" ? (prox.de === "coope" ? 1300 : 800) : 1600,
    );
    return () => clearTimeout(t);
  }, [i, tocando, perfil]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [bolhas, digitando]);

  const acabou = i >= ROTEIRO.length;
  const indicados = recs.filter((r) => r.podeIndicar).length;

  return (
    <div className="flex h-full flex-col gap-4 pt-1">
      <div className="px-1">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold tracking-tight">Conversa</h1>
          <Chip tom="bom">assistente</Chip>
        </div>
        <p className="mt-1 text-[13.5px] text-muted">
          No WhatsApp que você já usa. Ele lê suas notas e sugere o que faz sentido.
        </p>
      </div>

      <div className="flex min-h-[380px] flex-1 flex-col gap-2.5 rounded-card bg-surface p-4">
        {bolhas.length === 0 && !digitando && (
          <p className="m-auto max-w-[240px] text-center text-[13px] leading-relaxed text-faint">
            {perfil ? "Toque em reproduzir para ver a conversa." : "Analisando o perfil…"}
          </p>
        )}

        {bolhas.map((b, k) => {
          if (b.tipo === "texto") {
            return (
              <div key={k} className={`pop flex ${b.de === "eu" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[84%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    b.de === "eu"
                      ? "rounded-[16px] rounded-br-[5px] bg-brand text-brand-ink"
                      : "rounded-[16px] rounded-bl-[5px] bg-raised text-ink"
                  }`}
                >
                  {b.texto}
                </div>
              </div>
            );
          }
          if (b.tipo === "analise") {
            return (
              <div key={k} className="pop">
                {perfil && <Achados perfil={perfil} />}
              </div>
            );
          }
          return (
            <div key={k} className="pop space-y-2">
              {recs.map((r) => (
                <Cartao key={r.id} r={r} />
              ))}
            </div>
          );
        })}

        {digitando && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-[16px] rounded-bl-[5px] bg-raised px-4 py-3.5">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint"
                  style={{ animationDelay: `${d * 130}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Resposta rápida ao final */}
        {acabou && !pediu && (
          <div className="pop flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setPediu(true)}
              className="rounded-full border border-brand px-4 py-2 text-[13px] font-semibold text-brand transition-transform active:scale-95"
            >
              Quero o custeio
            </button>
          </div>
        )}
        {pediu && (
          <>
            <div className="pop flex justify-end">
              <div className="max-w-[84%] rounded-[16px] rounded-br-[5px] bg-brand px-3.5 py-2.5 text-[13.5px] leading-relaxed text-brand-ink">
                Quero o custeio
              </div>
            </div>
            <div className="pop flex justify-start">
              <div className="max-w-[84%] rounded-[16px] rounded-bl-[5px] bg-raised px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink">
                Já pedi proposta pros parceiros. Quando responderem, elas aparecem na aba Crédito pra
                você comparar e escolher.
              </div>
            </div>
          </>
        )}

        <div ref={fim} />
      </div>

      <Botao
        largura="cheia"
        variante={tocando ? "suave" : "primario"}
        disabled={!perfil}
        onClick={() => {
          if (acabou) {
            setBolhas([]);
            setI(0);
            setPediu(false);
          }
          setTocando((t) => !t);
        }}
      >
        {tocando ? "Pausar" : acabou ? "Ver de novo" : "Reproduzir"}
      </Botao>

      <div className="flex gap-3 rounded-card bg-raised px-4 py-3.5">
        <span className="mt-px shrink-0 text-brand">
          <Icone nome="cadeado" tamanho={17} />
        </span>
        <p className="text-[13px] leading-relaxed text-muted">
          O assistente sugere {indicados} produtos de crédito porque é obrigado a oferecer o que serve
          ao seu perfil. Sobre seguro e trava de preço, ele só explica — quem indica esses tem que ser
          registrado.
        </p>
      </div>
    </div>
  );
}
