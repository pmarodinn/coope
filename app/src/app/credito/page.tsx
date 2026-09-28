"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Anel, Botao, Chip, Dica, Divisor, Icone, Linha, Tile, Titulo } from "@/components/ui";
import type { DossieCredito, OfertaFunding } from "@/lib/domain";
import { brl } from "@/lib/engine";
import { DIVIDA_ATUAL } from "@/lib/seed";

function prazo(h: number) {
  if (h < 24) return `${h} horas`;
  const d = Math.round(h / 24);
  if (d < 30) return d === 1 ? "1 dia" : `${d} dias`;
  const m = Math.round(d / 30);
  return m === 1 ? "1 mês" : `${m} meses`;
}

export default function Credito() {
  const router = useRouter();
  const [d, setD] = useState<DossieCredito | null>(null);
  const [ofertas, setOfertas] = useState<OfertaFunding[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [escolhendo, setEscolhendo] = useState<string | null>(null);
  const [pediuPortabilidade, setPediuPortabilidade] = useState(false);

  useEffect(() => {
    fetch("/api/credito/dossie")
      .then((r) => r.json())
      .then(setD);
    fetch("/api/baas/conta")
      .then((r) => r.json())
      .then((r) => setEscolhida(r.ofertaContratada));
  }, []);

  async function buscar() {
    setBuscando(true);
    const r = await fetch("/api/originacao").then((x) => x.json());
    setOfertas(r.ofertas.filter((o: OfertaFunding) => o.status === "aprovada"));
    setEscolhida(r.contratada);
    setBuscando(false);
  }

  async function escolher(id: string) {
    setEscolhendo(id);
    await fetch("/api/originacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ofertaId: id }),
    });
    setEscolhida(id);
    setEscolhendo(null);
    router.push("/conta");
  }

  if (!d) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-52 animate-pulse rounded-card bg-surface" />
        <div className="h-32 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  const melhor = ofertas.length
    ? ofertas.reduce((a, b) => (a.cetAnual <= b.cetAnual ? a : b)).id
    : null;

  // Quanto a troca de credor economiza no prazo que ainda falta correr.
  const melhorTaxa = ofertas.length
    ? Math.min(...ofertas.map((o) => o.cetAnual))
    : d.faixa === "AA" || d.faixa === "A"
      ? 15.2
      : 18.9;
  const economiaPortabilidade =
    DIVIDA_ATUAL.saldo *
    ((DIVIDA_ATUAL.cetAnual - melhorTaxa) / 100) *
    (DIVIDA_ATUAL.parcelasRestantes / 12);

  return (
    <div className="space-y-5 pt-1">
      <h1 className="px-1 text-[22px] font-bold tracking-tight">Seu crédito</h1>

      {/* Limite + nota */}
      <Tile className="rise p-5">
        <div className="flex items-center gap-5">
          <Anel valor={d.score / 1000} centro={d.faixa} sub={`${d.score} pontos`} />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted">Você pode pegar até</p>
            <p className="tnum mt-1.5 text-[26px] font-bold leading-none tracking-tight text-ink">
              {brl(d.limiteSugerido)}
            </p>
            <p className="mt-2.5 text-[12.5px] leading-snug text-muted">
              Sem hipotecar a fazenda.
            </p>
          </div>
        </div>
      </Tile>

      {/* Portabilidade — dívida cara em outro banco */}
      <section>
        <Titulo>Dívida em outro banco</Titulo>
        <Tile className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold">{DIVIDA_ATUAL.instituicao}</p>
              <p className="mt-0.5 text-[12.5px] text-muted">
                {DIVIDA_ATUAL.parcelasRestantes} parcelas para terminar
              </p>
            </div>
            <Chip tom="ruim">{DIVIDA_ATUAL.cetAnual.toFixed(1).replace(".", ",")}% a.a.</Chip>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line">
            <div className="bg-raised px-3.5 py-3">
              <p className="text-[11.5px] text-muted">Você deve</p>
              <p className="tnum mt-1 text-[17px] font-bold tracking-tight">
                {brl(DIVIDA_ATUAL.saldo)}
              </p>
            </div>
            <div className="bg-raised px-3.5 py-3">
              <p className="text-[11.5px] text-muted">Passando pra cá, economiza</p>
              <p className="tnum mt-1 text-[17px] font-bold tracking-tight text-brand">
                {brl(economiaPortabilidade)}
              </p>
            </div>
          </div>

          <p className="mt-3.5 text-[13px] leading-relaxed text-muted">
            Com a sua nota {d.faixa}, dá para trocar essa dívida por uma de{" "}
            {melhorTaxa.toFixed(1).replace(".", ",")}% ao ano. A troca é digital e leva poucos dias
            úteis — você não precisa ir ao banco antigo.
          </p>

          <div className="mt-4">
            <Botao
              variante="suave"
              largura="cheia"
              onClick={() => setPediuPortabilidade(true)}
              disabled={pediuPortabilidade}
            >
              {pediuPortabilidade ? "Portabilidade pedida" : "Trazer essa dívida pra cá"}
            </Botao>
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            Portabilidade de crédito pelo Open Finance, disponível desde fevereiro de 2026.
          </p>
        </Tile>
      </section>

      {/* Por que */}
      <section>
        <Titulo>Por que você conseguiu essa nota</Titulo>
        <Tile className="overflow-hidden">
          {d.fatores.slice(0, 4).map((f, i) => (
            <div key={f.chave}>
              {i > 0 && <Divisor />}
              <Linha
                icone="check"
                titulo={
                  {
                    cobertura: "Suas notas batem com o banco",
                    margem: "Sua lavoura dá lucro",
                    produtividade: "Você produz bem por hectare",
                    crescimento: "Você vendeu mais que ano passado",
                    diversificacao: "Você vende para vários compradores",
                    conformidade: "Suas contas estão em dia",
                  }[f.chave] ?? f.rotulo
                }
                valor={`${Math.round((f.pontos / f.pontosMaximos) * 100)}%`}
                tom="brand"
              />
            </div>
          ))}
        </Tile>
        <p className="mt-2.5 px-1 text-[12.5px] leading-relaxed text-faint">
          Quem empresta consegue conferir cada item. Não é uma nota fechada.
        </p>
      </section>

      {/* Ofertas */}
      {ofertas.length === 0 ? (
        <Tile className="p-5">
          <p className="text-[14.5px] font-semibold">Buscar quem empresta</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Enviamos seus números para vários bancos e fundos ao mesmo tempo. Eles respondem, você
            escolhe.
          </p>
          <div className="mt-4">
            <Botao onClick={buscar} carregando={buscando} largura="cheia">
              Ver quem empresta
            </Botao>
          </div>
        </Tile>
      ) : (
        <section>
          <Titulo>{ofertas.length} ofertas para você</Titulo>
          <div className="space-y-3">
            {ofertas.map((o) => {
              const eu = escolhida === o.id;
              return (
                <Tile key={o.id} className={`rise overflow-hidden ${eu ? "ring-2 ring-brand" : ""}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[14.5px] font-semibold leading-snug">
                        {o.financiador}
                      </p>
                      {o.id === melhor && !escolhida && <Chip tom="bom">Mais barata</Chip>}
                      {eu && <Chip tom="bom">Escolhida</Chip>}
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[12.5px] font-medium text-muted">Custo total por ano</p>
                        <p className="tnum mt-1 text-[28px] font-bold leading-none tracking-tight text-ink">
                          {o.cetAnual.toFixed(1).replace(".", ",")}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12.5px] font-medium text-muted">Dinheiro em</p>
                        <p
                          className={`tnum mt-1 text-[17px] font-bold leading-none ${o.timeToMoneyHoras <= 24 ? "text-brand" : "text-ink"}`}
                        >
                          {prazo(o.timeToMoneyHoras)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 border-t border-line pt-3.5">
                      <div className="flex justify-between gap-3 text-[13px]">
                        <span className="text-muted">Até</span>
                        <span className="tnum font-medium">{brl(o.limite)}</span>
                      </div>
                      <div className="flex justify-between gap-3 text-[13px]">
                        <span className="text-muted">Para pagar em</span>
                        <span className="tnum font-medium">{o.prazoMeses} meses</span>
                      </div>
                      <div className="flex justify-between gap-3 text-[13px]">
                        <span className="text-muted">Garantia</span>
                        <span className="max-w-[58%] text-right font-medium leading-snug">
                          {o.garantia.includes("Hipoteca") ? "Hipoteca da fazenda" : "Sua produção"}
                        </span>
                      </div>
                    </div>

                    {o.cetAnual - o.taxaAnual > 4 && (
                      <p className="mt-3.5 rounded-xl bg-warn-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-warn">
                        Anunciam {o.taxaAnual.toFixed(1).replace(".", ",")}% ao ano, mas com as taxas o
                        custo real fica em {o.cetAnual.toFixed(1).replace(".", ",")}%.
                      </p>
                    )}
                  </div>

                  {!escolhida && (
                    <div className="px-5 pb-5">
                      <Botao
                        onClick={() => escolher(o.id)}
                        carregando={escolhendo === o.id}
                        largura="cheia"
                      >
                        Quero essa
                      </Botao>
                    </div>
                  )}
                </Tile>
              );
            })}
          </div>
        </section>
      )}

      <Dica icone="olho">
        A gente mostra o custo total, não só a taxa da propaganda. A escolha é sua — a Coope não indica
        nenhuma.
      </Dica>
    </div>
  );
}
