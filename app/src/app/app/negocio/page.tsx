"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Barra, Chip, Icone, Tile, Titulo } from "@/components/ui";
import { brl } from "@/lib/engine";
import type { FonteReceita, Metrica } from "@/lib/negocio";

interface Meta {
  prazo: string;
  meta: string;
  criterio: string;
}

const NAO_E_FOSSO = [
  {
    t: "Estar conforme a Res. Conjunta 16/2025",
    d: "Todo mundo que opera conta terá de estar até 31/12/2026. É custo de entrada, não vantagem.",
  },
  {
    t: "Dado do Open Finance",
    d: "Portável por desenho: o produtor leva para quem quiser. E desde 22/10/2026 cada empresa parceira precisa de consentimento próprio.",
  },
  {
    t: "Um app bonito",
    d: "A Aegro já emite nota, baixa da SEFAZ e gera o livro caixa. Tela não segura cliente.",
  },
];

const PODE_VIRAR = [
  {
    t: "Estar no fluxo mensal do contador",
    d: "Trocar de ferramenta significa migrar a carteira inteira, não um produtor.",
  },
  {
    t: "Série mensal verificada por fazenda",
    d: "Doze retratos por ano, conferidos com nota e extrato. É o que um dia torna o crédito melhor.",
  },
  {
    t: "Regras rurais testadas em casos reais",
    d: "Diferimento, crédito presumido, Funrural, livro caixa. Cada caso resolvido vira regra.",
  },
];

export default function Negocio() {
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [receita, setReceita] = useState<FonteReceita[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);

  useEffect(() => {
    fetch("/api/negocio")
      .then((r) => r.json())
      .then((r) => {
        setMetricas(r.metricas);
        setReceita(r.receita);
        setMetas(r.metas);
      });
  }, []);

  const totalMes = receita.reduce((s, r) => s + r.valorMes, 0);

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center gap-2 px-1">
        <Link href="/app" className="-ml-1 text-muted" aria-label="Voltar">
          <Icone nome="voltar" tamanho={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight">Números do negócio</h1>
          <p className="text-[12.5px] text-muted">Hipóteses de novembro de 2026</p>
        </div>
      </div>

      {/* Quem paga */}
      <Tile className="rise p-5">
        <p className="text-[13px] font-medium text-muted">Um escritório típico paga</p>
        <p className="figure mt-1.5 text-brand">{brl(totalMes)}</p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          Quem paga é o escritório de contabilidade, por produtor atendido. Uma venda traz 30 fazendas de
          uma vez, sem pedir a nenhum produtor que instale nada.
        </p>
      </Tile>

      {/* Métricas */}
      <section>
        <Titulo>Onde estamos</Titulo>
        <div className="grid grid-cols-2 gap-3">
          {metricas.map((m) => (
            <Tile key={m.chave} className="p-4">
              <p className="text-[11.5px] font-medium leading-snug text-muted">{m.rotulo}</p>
              <p className="tnum mt-1.5 text-[20px] font-bold leading-none tracking-tight text-ink">
                {m.valor}
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-faint">{m.nota}</p>
            </Tile>
          ))}
        </div>
      </section>

      {/* Metas */}
      <section>
        <Titulo>O que precisa acontecer</Titulo>
        <Tile className="p-5">
          <ol className="space-y-4">
            {metas.map((m, i) => (
              <li key={m.prazo} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12.5px] font-bold text-brand">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                    {m.prazo}
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold leading-snug">{m.meta}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">Passa se: {m.criterio}</p>
                </div>
              </li>
            ))}
          </ol>
        </Tile>
      </section>

      {/* Fontes de receita */}
      <section>
        <Titulo>De onde vem o dinheiro</Titulo>
        <div className="space-y-3">
          {receita.map((r) => (
            <Tile key={r.nome} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold leading-snug">{r.nome}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{r.comoGanha}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`tnum text-[15px] font-bold ${r.valorMes > 0 ? "text-ink" : "text-faint"}`}
                  >
                    {r.valorMes > 0 ? brl(r.valorMes) : "—"}
                  </p>
                  {r.valorMes > 0 && (
                    <p className="tnum mt-0.5 text-[11px] text-faint">
                      {Math.round(r.fatia * 100)}%
                    </p>
                  )}
                </div>
              </div>

              {r.valorMes > 0 && (
                <div className="mt-3">
                  <Barra valor={r.fatia} altura={5} />
                </div>
              )}

              {r.ressalva && (
                <p className="mt-3 flex gap-2 rounded-xl bg-warn-soft px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                  <span className="mt-px shrink-0 text-warn">
                    <Icone nome="olho" tamanho={14} />
                  </span>
                  {r.ressalva}
                </p>
              )}
            </Tile>
          ))}
        </div>
      </section>

      {/* Fossos, sem enfeite */}
      <section>
        <Titulo>O que ainda não é fosso</Titulo>
        <Tile className="p-5">
          <ul className="space-y-3.5">
            {NAO_E_FOSSO.map((f) => (
              <li key={f.t} className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-bad">
                  <Icone nome="voltar" tamanho={16} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold leading-snug">{f.t}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Tile>
      </section>

      <section>
        <Titulo>O que pode virar fosso</Titulo>
        <Tile className="p-5">
          <ul className="space-y-3.5">
            {PODE_VIRAR.map((f) => (
              <li key={f.t} className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-brand">
                  <Icone nome="check" tamanho={16} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold leading-snug">{f.t}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Tile>
      </section>

      {/* Custo */}
      <section>
        <Titulo>O que custa chegar à primeira receita</Titulo>
        <Tile className="p-5">
          <div className="space-y-2.5">
            {[
              ["Validação", "2 semanas, sem código novo"],
              ["Até a primeira receita", "R$ 50 a 150 mil (hipótese)"],
              ["Fora do MVP", "Conta, crédito, seguro e hedge"],
              ["Plano anterior", "9 a 14 meses e até R$ 1,5 mi"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-[13px]">
                <span className="text-muted">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-line pt-3.5 text-[12px] leading-relaxed text-faint">
            O módulo fiscal não precisa de licença do Banco Central. Conta e crédito só voltam ao plano
            depois de 12 meses de apuração mensal e com parceiro regulado.
          </p>
        </Tile>
      </section>

      <div className="flex gap-3 rounded-card bg-raised px-4 py-3.5">
        <Chip tom="atencao">hipótese</Chip>
        <p className="text-[12.5px] leading-relaxed text-muted">
          Preços e metas a testar nas conversas com contadores. Nenhum número aqui é resultado: a Coope
          ainda não tem cliente pagante.
        </p>
      </div>
    </div>
  );
}
