"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chip, Dica, Divisor, Icone, Tile, Titulo } from "@/components/ui";
import { brl, dataBR } from "@/lib/engine";
import type { ItemChecklist, Reforma } from "@/lib/reforma";
import { milhoes, ROTULO_ENQUADRAMENTO } from "@/lib/reforma";

const ESTADO: Record<ItemChecklist["estado"], { rotulo: string; tom: "bom" | "atencao" | "ruim" | "neutro" }> = {
  ok: { rotulo: "pronto", tom: "bom" },
  atencao: { rotulo: "atenção", tom: "atencao" },
  pendente: { rotulo: "falta", tom: "ruim" },
  nao_se_aplica: { rotulo: "não se aplica", tom: "neutro" },
};

const pct = (v: number) => `${(v * 100).toFixed(2).replace(".", ",").replace(/,?0+$/, "")}%`;

export default function ReformaTributaria() {
  const [r, setR] = useState<Reforma | null>(null);
  const [verPremissas, setVerPremissas] = useState(false);

  useEffect(() => {
    fetch("/api/reforma")
      .then((x) => x.json())
      .then(setR);
  }, []);

  if (!r) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-40 animate-pulse rounded-card bg-surface" />
        <div className="h-56 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  const pico = Math.max(...r.meses.map((m) => Math.max(m.debito, m.credito)), 1);

  return (
    <div className="space-y-5 pt-1">
      <h1 className="px-1 text-[22px] font-bold tracking-tight">Seu imposto</h1>

      <div className="grid grid-cols-2 gap-1 rounded-full bg-raised p-1">
        <Link
          href="/app/imposto"
          className="rounded-full py-2 text-center text-[13px] font-semibold text-muted transition-colors active:bg-line"
        >
          Imposto de renda
        </Link>
        <span className="rounded-full bg-surface py-2 text-center text-[13px] font-semibold text-ink shadow-card">
          Reforma 2027
        </span>
      </div>

      {/* Contagem */}
      <Tile className="rise p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-muted">Faltam</p>
            <p className="figure mt-1 text-ink">
              {r.diasParaCbs} <span className="text-[20px] font-semibold text-muted">dias</span>
            </p>
          </div>
          <Chip tom={r.enquadramento === "obrigatorio" ? "atencao" : "bom"}>
            {ROTULO_ENQUADRAMENTO[r.enquadramento]}
          </Chip>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
          Em 1º de janeiro de 2027 a CBS começa a ser cobrada e o produtor pessoa física passa a precisar
          de CNPJ. Sua receita deste ano, {milhoes(r.receitaAnual)}, passa do limite de R$ 3,6 milhões: a
          partir de janeiro, o imposto da venda é apurado todo mês.
        </p>
      </Tile>

      {/* Checklist */}
      <section>
        <Titulo>O que precisa estar pronto</Titulo>
        <Tile className="overflow-hidden">
          {r.checklist.map((c, i) => (
            <div key={c.chave}>
              {i > 0 && <Divisor />}
              <div className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-semibold leading-snug">{c.titulo}</p>
                  <Chip tom={ESTADO[c.estado].tom}>{ESTADO[c.estado].rotulo}</Chip>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{c.detalhe}</p>
                {c.prazo && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-faint">
                    <Icone nome="calendario" tamanho={13} />
                    até {dataBR(c.prazo)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </Tile>
      </section>

      {/* Simulação */}
      <section>
        <Titulo>2027, mês a mês</Titulo>
        <Tile className="overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-line">
            {[
              { rotulo: "Imposto nas vendas", valor: r.anual.debito, tom: "text-ink" },
              { rotulo: "Crédito nas compras", valor: r.anual.credito, tom: "text-brand" },
              { rotulo: "A recolher no ano", valor: r.anual.saldo, tom: "text-ink" },
            ].map((k) => (
              <div key={k.rotulo} className="bg-surface px-3.5 py-3.5">
                <p className="text-[11px] font-medium leading-snug text-muted">{k.rotulo}</p>
                <p className={`tnum mt-1 text-[15px] font-bold tracking-tight ${k.tom}`}>
                  {brl(k.valor)}
                </p>
              </div>
            ))}
          </div>

          <div className="p-5">
            <div className="flex h-[92px] items-end gap-[5px]">
              {r.meses.map((m) => (
                <div key={m.mes} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[76px] w-full items-end justify-center gap-[2px]">
                    <div
                      className="w-1/2 rounded-t-[2px] bg-muted/40"
                      style={{ height: Math.max(2, (m.debito / pico) * 74) }}
                      title={`Imposto nas vendas ${brl(m.debito)}`}
                    />
                    <div
                      className="w-1/2 rounded-t-[2px] bg-brand"
                      style={{ height: Math.max(2, (m.credito / pico) * 74) }}
                      title={`Crédito nas compras ${brl(m.credito)}`}
                    />
                  </div>
                  <span className="text-[9px] font-medium text-faint">{m.mes}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3">
              <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <span className="h-2.5 w-2.5 rounded-[2px] bg-muted/40" /> imposto nas vendas
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <span className="h-2.5 w-2.5 rounded-[2px] bg-brand" /> crédito nas compras
              </span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
              Quem paga o imposto da venda, no fim, é o comprador: ele vem destacado na nota e o comprador
              usa como crédito. O que muda para você é o caixa e o trabalho, todo mês. Nos meses de plantio,
              com compra e sem venda, sobra crédito; o saldo pode ser compensado ou pedido de volta, com
              análise em até 180 dias.
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-faint">
              Adubo, defensivo e semente chegam sem imposto (diferido para a venda):{" "}
              <span className="tnum">{brl(r.anual.diferido)}</span> que não saem do seu caixa na compra.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setVerPremissas((v) => !v)}
            className="flex w-full items-center justify-between border-t border-line px-5 py-3.5 text-left"
          >
            <span className="text-[13px] font-semibold text-brand">
              {verPremissas ? "Esconder as premissas" : "Ver as premissas da conta"}
            </span>
            <span className={`text-faint transition-transform ${verPremissas ? "rotate-90" : ""}`}>
              <Icone nome="seta" tamanho={15} />
            </span>
          </button>
          {verPremissas && (
            <div className="space-y-2.5 border-t border-line px-5 py-4">
              <p className="text-[12px] text-muted">
                CBS {pct(r.aliquotas.cbs)} + IBS {pct(r.aliquotas.ibs)} = {pct(r.aliquotas.cheia)}; com a
                redução de 60% do agro, {pct(r.aliquotas.agro)}.
              </p>
              {r.premissas.map((p) => (
                <p key={p} className="flex gap-2.5 text-[12px] leading-relaxed text-muted">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                  {p}
                </p>
              ))}
            </div>
          )}
        </Tile>
      </section>

      {/* Como a apuração mensal vai funcionar */}
      <section>
        <Titulo>Quem faz o quê, todo mês</Titulo>
        <Tile className="p-5">
          <ol className="space-y-3.5">
            {[
              {
                n: "1",
                t: "O Fisco pré-preenche",
                d: "Até o dia 15, a Receita e o Comitê Gestor montam a apuração com as notas eletrônicas do mês.",
              },
              {
                n: "2",
                t: "A Coope confere",
                d: "Compara a pré-apuração com as suas notas e o seu extrato: crédito que ficou de fora, nota sem os campos, compra classificada errado.",
              },
              {
                n: "3",
                t: "Seu contador ajusta e confirma",
                d: "Até o último dia útil do mês seguinte. A decisão e a assinatura continuam com ele.",
              },
            ].map((p) => (
              <li key={p.n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12.5px] font-bold text-brand">
                  {p.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold">{p.t}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Tile>
      </section>

      {/* Abaixo do limite */}
      <section>
        <Titulo>Se a receita fosse até R$ 3,6 milhões</Titulo>
        <Tile className="p-5">
          <p className="text-[13.5px] leading-relaxed text-muted">
            Aí haveria escolha. <span className="font-semibold text-ink">Ficar fora:</span> você não recolhe,
            e quem compra de você aproveita um crédito presumido, cujo percentual o governo divulga todo ano.{" "}
            <span className="font-semibold text-ink">Entrar:</span> você recolhe todo mês e aproveita o
            crédito das compras. Costuma valer para quem vende a empresas e compra muito com imposto; quase
            nunca para quem vende direto ao consumidor.
          </p>
          <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-warn">
            A opção vale do mês seguinte ao pedido e não pode ser desfeita no mesmo ano.
          </p>
        </Tile>
      </section>

      <Dica icone="olho">
        A conta usa as suas notas reais, não uma média. Antes de qualquer decisão, seu contador revisa: a
        regra muda conforme o produto, o comprador e o estado.
      </Dica>

      <div className="space-y-1.5 px-1 pb-2">
        {r.fontes.map((f) => (
          <p key={f} className="text-[11px] leading-relaxed text-faint">
            {f}
          </p>
        ))}
      </div>
    </div>
  );
}
