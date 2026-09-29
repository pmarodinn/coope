"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Barra, Chip, Divisor, Icone, Linha, Tile, Titulo } from "@/components/ui";
import { brl } from "@/lib/engine";
import type { Cooperativa } from "@/lib/negocio";

const STATUS: Record<
  Cooperativa["carteira"][number]["status"],
  { rotulo: string; tom: "bom" | "atencao" | "neutro" }
> = {
  pago: { rotulo: "Recebido", tom: "bom" },
  aprovado: { rotulo: "Aprovado", tom: "atencao" },
  analise: { rotulo: "Em análise", tom: "neutro" },
};

export default function VisaoCooperativa() {
  const [c, setC] = useState<Cooperativa | null>(null);

  useEffect(() => {
    fetch("/api/negocio")
      .then((r) => r.json())
      .then((r) => setC(r.cooperativa));
  }, []);

  if (!c) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-36 animate-pulse rounded-card bg-surface" />
        <div className="h-52 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  const pendente = c.sellOut - c.recebidoAVista;

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center gap-2 px-1">
        <Link href="/app" className="-ml-1 text-muted" aria-label="Voltar">
          <Icone nome="voltar" tamanho={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight">Visão da cooperativa</h1>
          <p className="truncate text-[12.5px] text-muted">{c.nome}</p>
        </div>
      </div>

      {/* O número da cooperativa */}
      <Tile className="rise p-5">
        <p className="text-[13px] font-medium text-muted">Vendeu insumo e recebeu à vista</p>
        <p className="figure mt-1.5 text-brand">{brl(c.recebidoAVista)}</p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          Sem financiar o produtor e sem colocar esse risco no próprio balanço.
        </p>
      </Tile>

      {/* Antes e depois */}
      <section>
        <Titulo>O que mudou</Titulo>
        <div className="grid grid-cols-2 gap-3">
          <Tile className="p-4">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-bad">Antes</p>
            <p className="tnum mt-2 text-[24px] font-bold leading-none tracking-tight text-bad">
              {(c.inadimplenciaAntes * 100).toFixed(1).replace(".", ",")}%
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              de calote no barter. A cooperativa vendia no fio do bigode e esperava a colheita para
              receber.
            </p>
          </Tile>
          <Tile className="p-4">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-brand">Agora</p>
            <p className="tnum mt-2 text-[24px] font-bold leading-none tracking-tight text-brand">
              {c.inadimplenciaAgora}%
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Quem financia é o fundo. A cooperativa entrega o insumo e recebe o Pix no mesmo dia.
            </p>
          </Tile>
        </div>
      </section>

      {/* Sell-out */}
      <section>
        <Titulo>Vendas do ciclo</Titulo>
        <Tile className="p-5">
          <div className="mb-1.5 flex justify-between text-[12.5px]">
            <span className="text-muted">Recebido</span>
            <span className="tnum font-medium">
              {brl(c.recebidoAVista)} de {brl(c.sellOut)}
            </span>
          </div>
          <Barra valor={c.sellOut ? c.recebidoAVista / c.sellOut : 0} />
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div>
              <p className="text-[11.5px] font-medium text-muted">Em andamento</p>
              <p className="tnum mt-1 text-[17px] font-bold tracking-tight">{brl(pendente)}</p>
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-muted">Produtores na base</p>
              <p className="tnum mt-1 text-[17px] font-bold tracking-tight">{c.produtores}</p>
            </div>
          </div>
        </Tile>
      </section>

      {/* Carteira */}
      <section>
        <Titulo>Pedidos dos produtores</Titulo>
        <Tile className="overflow-hidden">
          {c.carteira.map((p, i) => (
            <div key={p.nome}>
              {i > 0 && <Divisor />}
              <Linha
                icone="conta"
                titulo={p.nome}
                sub={`${p.municipio} · ${p.hectares.toLocaleString("pt-BR")} ha · nota ${p.faixa}`}
                valor={brl(p.pedido)}
                acao={<Chip tom={STATUS[p.status].tom}>{STATUS[p.status].rotulo}</Chip>}
              />
            </div>
          ))}
        </Tile>
        <p className="mt-2.5 px-1 text-[12.5px] leading-relaxed text-faint">
          A cooperativa vê a nota de crédito de cada produtor, mas não vê as notas fiscais nem os
          extratos dele. Esse dado é do produtor.
        </p>
      </section>

      <div className="flex gap-3 rounded-card bg-raised px-4 py-3.5">
        <span className="mt-px shrink-0 text-brand">
          <Icone nome="raio" tamanho={17} />
        </span>
        <p className="text-[13px] leading-relaxed text-muted">
          Para a cooperativa, isso é sell-out sem risco de crédito. Para a plataforma, é o canal que
          traz produtor sem custo de aquisição.
        </p>
      </div>
    </div>
  );
}
