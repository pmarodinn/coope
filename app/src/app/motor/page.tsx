"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Caso, Casamento, Eixo, Risco, Semelhanca, Sinal } from "@/lib/inteligencia";

interface Analise {
  casos: Omit<Caso, "extrato">[];
  caso: Omit<Caso, "extrato">;
  assinatura: Eixo[];
  arquetipos: Semelhanca[];
  sinais: Sinal[];
  casamentos: Casamento[];
  risco: Risco;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const pct = (v: number, casas = 0) => `${(v * 100).toFixed(casas).replace(".", ",")}%`;

const COR_ORIGEM: Record<string, string> = {
  "Open Finance": "text-[--acento]",
  "Nota fiscal": "text-[--tinta]",
  Cruzamento: "text-[--tinta-2]",
  Cadastro: "text-[--tinta-3]",
  Mercado: "text-[--tinta-3]",
};

function Bloco({
  titulo,
  legenda,
  children,
}: {
  titulo: string;
  legenda?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[--linha] bg-[--fundo-2] p-6">
      <h2 className="text-[15px] font-semibold tracking-tight">{titulo}</h2>
      {legenda && <p className="mt-1.5 text-[12.5px] leading-relaxed text-[--tinta-2]">{legenda}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Motor() {
  const [caso, setCaso] = useState("menegat");
  const [a, setA] = useState<Analise | null>(null);

  useEffect(() => {
    fetch(`/api/motor?caso=${caso}`)
      .then((r) => r.json())
      .then(setA);
  }, [caso]);

  if (!a) {
    return (
      <main className="mx-auto max-w-[1180px] space-y-4 px-6 py-16">
        <div className="h-24 animate-pulse rounded-2xl bg-[--fundo-2]" />
        <div className="h-72 animate-pulse rounded-2xl bg-[--fundo-2]" />
      </main>
    );
  }

  const r = a.risco;
  const delta = r.pd - r.pdSemOpenFinance;
  const maxContrib = Math.max(...r.fatores.map((f) => Math.abs(f.contribuicao)));

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-12 md:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="rotulo">Visão interna · motor de decisão</p>
          <h1 className="display-2 mt-3 max-w-[18ch]">O que a Coope enxerga por trás da tela.</h1>
          <p className="mt-4 max-w-[62ch] text-[14.5px] leading-relaxed text-[--tinta-2]">
            O produtor vê uma nota e um limite. Aqui está como eles são montados: a operação vira
            uma assinatura, a assinatura acha os vizinhos mais próximos, e o risco é a soma de
            parcelas que dá para explicar uma a uma.
          </p>
        </div>
        <Link
          href="/app"
          className="rounded-full border border-[--linha] px-4 py-2 text-[13px] font-medium transition-colors hover:border-[--acento] hover:text-[--acento]"
        >
          Ver o app do produtor
        </Link>
      </header>

      {/* Seleção de caso */}
      <div className="mb-8 flex flex-wrap gap-2">
        {a.casos.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCaso(c.id)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              c.id === caso
                ? "border-[--acento] bg-[--acento-fundo]"
                : "border-[--linha] hover:border-[--tinta-3]"
            }`}
          >
            <span className="block text-[14px] font-semibold">{c.nome}</span>
            <span className="mt-0.5 block text-[12px] text-[--tinta-2]">{c.resumo}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Assinatura */}
        <Bloco
          titulo="Assinatura da operação"
          legenda="Oito eixos entre 0 e 1, cada um derivado de um dado que já existe. É o equivalente ao trecho curto que um reconhecedor de música usa no lugar da gravação inteira."
        >
          <div className="space-y-3.5">
            {a.assinatura.map((e) => (
              <div key={e.chave}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px] font-medium">{e.nome}</span>
                  <span className="tnum text-[12.5px] text-[--tinta-2]">{pct(e.valor)}</span>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-[--linha]">
                  <div
                    className="h-full rounded-full bg-[--acento] transition-[width] duration-700"
                    style={{ width: `${e.valor * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[--tinta-3]">
                  <span className={`mono ${COR_ORIGEM[e.origem]}`}>{e.origem}</span> · {e.leitura}
                </p>
              </div>
            ))}
          </div>
        </Bloco>

        <div className="space-y-5">
          {/* Arquétipo */}
          <Bloco
            titulo="Vizinhos mais próximos"
            legenda="Similaridade de cosseno entre a assinatura e perfis de referência. Não classifica em caixas: mede distância."
          >
            <div className="space-y-2.5">
              {a.arquetipos.slice(0, 4).map((s, i) => (
                <div
                  key={s.arquetipo.chave}
                  className={`rounded-xl px-4 py-3 ${i === 0 ? "bg-[--acento-fundo]" : "bg-[--fundo-3]"}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={`text-[13.5px] font-semibold ${i === 0 ? "text-[--acento]" : ""}`}
                    >
                      {s.arquetipo.nome}
                    </span>
                    <span className="tnum text-[13px] font-semibold">{pct(s.similaridade, 1)}</span>
                  </div>
                  {i === 0 && (
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[--tinta-2]">
                      {s.arquetipo.descricao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Bloco>

          {/* Sinais */}
          <Bloco
            titulo="Sinais de conduta nos extratos"
            legenda="Lidos nas três instituições sob consentimento. O banco que vai emprestar só enxerga a própria conta."
          >
            {a.sinais.length === 0 ? (
              <p className="rounded-xl bg-[--fundo-3] px-4 py-6 text-center text-[13px] text-[--tinta-2]">
                Nenhum sinal detectado neste extrato.
              </p>
            ) : (
              <div className="space-y-2.5">
                {a.sinais.map((s) => (
                  <div key={s.chave} className="rounded-xl bg-[--fundo-3] px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13.5px] font-semibold">{s.titulo}</span>
                      <span className="tnum shrink-0 text-[13px] font-semibold text-[#ef7361]">
                        {brl(s.valor)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[--tinta-2]">
                      {s.evidencia}
                    </p>
                    <p className="mono mt-2 text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">
                      {s.ocorrencias}× · {s.instituicao}
                      {s.soComOpenFinance && " · só visível com Open Finance"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Bloco>
        </div>
      </div>

      {/* Casamento de produto */}
      <div className="mt-5">
        <Bloco
          titulo="Casamento de produto"
          legenda="Ordenado por adequação ao perfil, não por taxa. É o que a norma do correspondente exige e o que evita empurrar o produto errado."
        >
          <div className="space-y-2.5">
            {a.casamentos.map((c) => (
              <div key={c.produto.id} className="rounded-xl bg-[--fundo-3] px-4 py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[14px] font-semibold">{c.produto.nome}</span>
                  <span className="tnum text-[13.5px] font-semibold text-[--acento]">
                    {pct(c.aderencia)}
                  </span>
                </div>
                <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-[--linha]">
                  <div
                    className="h-full rounded-full bg-[--acento]"
                    style={{ width: `${c.aderencia * 100}%` }}
                  />
                </div>
                {c.motivos.length > 0 && (
                  <ul className="mt-2.5 space-y-1">
                    {c.motivos.map((m) => (
                      <li key={m} className="flex gap-2 text-[12px] leading-relaxed text-[--tinta-2]">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[--tinta-3]" />
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Bloco>
      </div>

      {/* Risco */}
      <div className="mt-5">
        <Bloco
          titulo="Risco de inadimplência"
          legenda="Probabilidade em 12 meses, montada por soma de parcelas sobre a média do setor. Cada parcela é reversível, então dá para dizer ao produtor o que pesou e o que mudaria."
        >
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <div>
              <p className="text-[12.5px] text-[--tinta-2]">Probabilidade em 12 meses</p>
              <p
                className={`tnum mt-1 text-[52px] font-semibold leading-none tracking-tight ${
                  r.pd > 12 ? "text-[#ef7361]" : r.pd > 8 ? "text-[#e3a83f]" : "text-[--acento]"
                }`}
              >
                {r.pd.toFixed(1).replace(".", ",")}%
              </p>
              <p className="mt-3 text-[12.5px] text-[--tinta-2]">
                Faixa <span className="font-semibold text-[--tinta]">{r.faixa}</span> · média do
                setor {r.referenciaSetor.toFixed(1).replace(".", ",")}%
              </p>

              <div className="mt-5 rounded-xl border border-[--linha] p-4">
                <p className="mono text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">
                  Sem Open Finance
                </p>
                <p className="tnum mt-1.5 text-[24px] font-semibold tracking-tight">
                  {r.pdSemOpenFinance.toFixed(1).replace(".", ",")}%
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[--tinta-2]">
                  {delta > 0.5 ? (
                    <>
                      Olhando só a conta de um banco, este produtor pareceria{" "}
                      <strong className="text-[--tinta]">
                        {delta.toFixed(1).replace(".", ",")} pontos
                      </strong>{" "}
                      menos arriscado do que é.
                    </>
                  ) : (
                    "Neste caso a leitura multi-instituição confirmou o que o dado fiscal já dizia."
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {r.fatores.map((f) => {
                const largura = (Math.abs(f.contribuicao) / maxContrib) * 100;
                const ruim = f.contribuicao > 0;
                return (
                  <div key={f.nome} className="rounded-xl bg-[--fundo-3] px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-medium">{f.nome}</span>
                      <span
                        className={`tnum shrink-0 text-[13px] font-semibold ${
                          ruim ? "text-[#ef7361]" : "text-[--acento]"
                        }`}
                      >
                        {ruim ? "+" : ""}
                        {f.contribuicao.toFixed(2).replace(".", ",")} pp
                      </span>
                    </div>
                    <div className="mt-2 flex h-[4px] overflow-hidden rounded-full bg-[--linha]">
                      <div
                        className={`h-full rounded-full ${ruim ? "bg-[#ef7361]" : "bg-[--acento]"}`}
                        style={{ width: `${largura}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-[--tinta-3]">
                      <span className={`mono ${COR_ORIGEM[f.origem]}`}>{f.origem}</span> · {f.detalhe}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Bloco>
      </div>

      <p className="mt-8 rounded-2xl border border-[--linha] px-6 py-5 text-[12.5px] leading-relaxed text-[--tinta-3]">
        Este é um scorecard determinístico calibrado à mão, não um modelo treinado em inadimplência
        observada — sem carteira não existe rótulo para treinar. A escolha por parcelas explicáveis é
        deliberada: crédito regulado exige poder justificar a recusa ao tomador, e a LGPD dá a ele
        direito a revisão de decisão automatizada. Dados sintéticos, para demonstração.
      </p>
    </main>
  );
}
