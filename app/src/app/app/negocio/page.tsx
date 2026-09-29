"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Barra, Chip, Icone, Tile, Titulo } from "@/components/ui";
import { brl } from "@/lib/engine";
import type { FonteReceita, Metrica } from "@/lib/negocio";

export default function Negocio() {
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [receita, setReceita] = useState<FonteReceita[]>([]);

  useEffect(() => {
    fetch("/api/negocio")
      .then((r) => r.json())
      .then((r) => {
        setMetricas(r.metricas);
        setReceita(r.receita);
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
          <p className="text-[12.5px] text-muted">Piloto em 1 cooperativa</p>
        </div>
      </div>

      {/* Receita */}
      <Tile className="rise p-5">
        <p className="text-[13px] font-medium text-muted">Receita da plataforma no mês</p>
        <p className="figure mt-1.5 text-brand">{brl(totalMes)}</p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          A Coope não empresta e não corre risco de balanço. Ganha por originar, por comprovar
          economia e por corretagem repassada.
        </p>
      </Tile>

      {/* Métricas */}
      <section>
        <Titulo>Como está indo</Titulo>
        <div className="grid grid-cols-2 gap-3">
          {metricas.map((m) => (
            <Tile key={m.chave} className="p-4">
              <p className="text-[11.5px] font-medium leading-snug text-muted">{m.rotulo}</p>
              <p className="tnum mt-1.5 text-[21px] font-bold leading-none tracking-tight text-ink">
                {m.valor}
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-faint">{m.nota}</p>
            </Tile>
          ))}
        </div>
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

      {/* Fossos */}
      <section>
        <Titulo>Por que é difícil copiar</Titulo>
        <Tile className="p-5">
          <ul className="space-y-3.5">
            {[
              {
                t: "Dado fiscal em tempo real",
                d: "O concorrente precisa do certificado digital de cada produtor e de meses de histórico. Não se compra atalho.",
              },
              {
                t: "Posição entre produtor e fundo",
                d: "Quem controla a originação decide quem vê qual operação primeiro.",
              },
              {
                t: "Canal com aprisionamento mútuo",
                d: "A cooperativa traz o produtor; o produtor mantém a cooperativa no fluxo.",
              },
              {
                t: "Arquitetura já conforme",
                d: "A Res. Conjunta 16/2025 vira barreira: quem desenhou conta-bolsão terá que refazer até 31/12/2026.",
              },
            ].map((f) => (
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
        <Titulo>O que custa manter</Titulo>
        <Tile className="p-5">
          <div className="space-y-2.5">
            {[
              ["Engenharia do MVP", "R$ 800 mil a R$ 1,5 mi"],
              ["Queima anual", "R$ 600 mil a R$ 1,8 mi"],
              ["Compliance recorrente", "20% a 35% da queima"],
              ["Até o MVP operacional", "9 a 14 meses"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-[13px]">
                <span className="text-muted">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-line pt-3.5 text-[12px] leading-relaxed text-faint">
            O gargalo do cronograma não é software: é o credenciamento junto a provedores de BaaS e
            financiadores, 60 a 120 dias por parceiro.
          </p>
        </Tile>
      </section>

      <div className="flex gap-3 rounded-card bg-raised px-4 py-3.5">
        <Chip tom="atencao">estimativa</Chip>
        <p className="text-[12.5px] leading-relaxed text-muted">
          Números de um piloto simulado, para dimensionar ordem de grandeza. Não são resultado
          auditado nem projeção financeira.
        </p>
      </div>
    </div>
  );
}
