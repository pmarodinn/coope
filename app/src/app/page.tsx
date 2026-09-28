"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Atalho, Barra, Botao, Chip, Divisor, Icone, Linha, Tile, Titulo } from "@/components/ui";
import { brl } from "@/lib/engine";
import type { Compromissos, MesProjetado } from "@/lib/projecao";
import type { Movimento } from "@/lib/store";
import { PRODUTOR } from "@/lib/seed";

interface Resumo {
  conta: { saldo: number; aberta: boolean; agencia: string; numero: string };
  credito: Compromissos;
  projecao: MesProjetado[];
  imposto: { economia: number; aPagar: number; semOrganizar: number };
  movimentos: Movimento[];
}

const compacto = (v: number) =>
  Math.abs(v) >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`
    : `${Math.round(v / 1000)} mil`;

export default function Inicio() {
  const [r, setR] = useState<Resumo | null>(null);

  useEffect(() => {
    fetch("/api/resumo")
      .then((x) => x.json())
      .then(setR);
  }, []);

  if (!r) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-36 animate-pulse rounded-card bg-surface" />
        <div className="h-44 animate-pulse rounded-card bg-surface" />
        <div className="h-40 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  const primeiroNome = PRODUTOR.nome.split(" ")[0];
  const { conta, credito, projecao, imposto } = r;
  const temCredito = credito.financiado > 0;

  const picoGasto = Math.max(...projecao.map((p) => Math.max(p.gasto, p.entrada)), 1);
  const gastoPrevisto = projecao.filter((p) => p.previsto).reduce((s, p) => s + p.gasto, 0);
  const entradaPrevista = projecao.filter((p) => p.previsto).reduce((s, p) => s + p.entrada, 0);

  return (
    <div className="space-y-5 pt-1">
      <p className="px-1 text-[15px] text-muted">
        Olá, <span className="font-semibold text-ink">{primeiroNome}</span>
      </p>

      {/* 1. Saldo */}
      <Tile className="rise p-5">
        <p className="text-[13px] font-medium text-muted">Saldo na conta</p>
        <p className="figure mt-1.5 text-ink">{brl(conta.saldo)}</p>
        {conta.aberta ? (
          <div className="mt-3 flex items-center gap-2">
            <Chip tom="bom">Pix ativo</Chip>
            <span className="text-[12px] text-faint">
              {conta.agencia} · {conta.numero}
            </span>
          </div>
        ) : (
          <div className="mt-4">
            <Link href="/abrir-conta">
              <Botao largura="cheia">Abrir minha conta</Botao>
            </Link>
          </div>
        )}
      </Tile>

      {conta.aberta && (
        <div className="no-bar flex gap-2 overflow-x-auto px-1 pb-1">
          <Atalho icone="enviar" rotulo="Enviar Pix" href="/conta" />
          <Atalho icone="credito" rotulo="Crédito" href="/credito" />
          <Atalho icone="nota" rotulo="Extrato" href="/conta" />
          <Atalho icone="chat" rotulo="Conversar" href="/conversa" />
        </div>
      )}

      {/* 2. Financiado */}
      <section>
        <Titulo
          acao={
            <Link href="/credito" className="text-[13px] font-semibold text-brand">
              {temCredito ? "Detalhes" : "Ver ofertas"}
            </Link>
          }
        >
          Seu financiamento
        </Titulo>

        {temCredito ? (
          <Tile className="overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-muted">Você pegou</p>
                  <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-tight text-ink">
                    {brl(credito.financiado)}
                  </p>
                </div>
                <Chip>{credito.cetAnual.toFixed(1).replace(".", ",")}% a.a.</Chip>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-snug text-muted">{credito.financiador}</p>
            </div>

            {/* 3. Quanto dá por mês */}
            <div className="grid grid-cols-2 gap-px bg-line">
              <div className="bg-surface px-5 py-4">
                <p className="text-[11.5px] font-medium text-muted">Custa por mês</p>
                <p className="tnum mt-1 text-[19px] font-bold tracking-tight text-ink">
                  {brl(credito.custoMensal)}
                </p>
              </div>
              <div className="bg-surface px-5 py-4">
                <p className="text-[11.5px] font-medium text-muted">Você devolve</p>
                <p className="tnum mt-1 text-[19px] font-bold tracking-tight text-ink">
                  {brl(credito.devolver)}
                </p>
              </div>
            </div>

            <div className="border-t border-line px-5 py-4">
              <div className="mb-1.5 flex justify-between text-[12.5px]">
                <span className="text-muted">Já repassado aos fornecedores</span>
                <span className="tnum font-medium">
                  {brl(credito.pagoFornecedores)} de {brl(credito.financiado)}
                </span>
              </div>
              <Barra
                valor={credito.financiado ? credito.pagoFornecedores / credito.financiado : 0}
                altura={6}
              />
              <p className="mt-3 text-[12px] leading-relaxed text-faint">
                Você não paga parcela todo mês: quita tudo de uma vez na colheita. O valor acima é
                quanto o crédito custa por mês enquanto ele corre.
              </p>
            </div>
          </Tile>
        ) : (
          <Tile className="p-5">
            <p className="text-[14.5px] font-semibold">Você ainda não pegou crédito</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Suas notas já provam que você paga. Dá para pegar sem hipotecar a fazenda.
            </p>
            <div className="mt-4">
              <Link href="/credito">
                <Botao largura="cheia" variante="suave">
                  Ver quem empresta
                </Botao>
              </Link>
            </div>
          </Tile>
        )}
      </section>

      {/* 4. Projeção de gastos */}
      <section>
        <Titulo>O que vem pela frente</Titulo>
        <Tile className="p-5">
          <div className="flex gap-6">
            <div>
              <p className="text-[11.5px] font-medium text-muted">Vai gastar</p>
              <p className="tnum mt-1 text-[19px] font-bold tracking-tight text-ink">
                R$ {compacto(gastoPrevisto)}
              </p>
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-muted">Vai receber</p>
              <p className="tnum mt-1 text-[19px] font-bold tracking-tight text-brand">
                R$ {compacto(entradaPrevista)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            {projecao.map((p) => {
              const hGasto = Math.max(3, (p.gasto / picoGasto) * 76);
              const hEntrada = Math.max(3, (p.entrada / picoGasto) * 76);
              return (
                <div key={p.chave} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[80px] w-full items-end justify-center gap-[3px]">
                    <div
                      className={`w-1/2 rounded-t-[3px] ${p.previsto ? "bg-line" : "bg-muted/35"}`}
                      style={{ height: hGasto }}
                      title={`Gasto ${brl(p.gasto)}`}
                    />
                    <div
                      className={`w-1/2 rounded-t-[3px] ${p.previsto ? "bg-brand/40" : "bg-brand"}`}
                      style={{ height: hEntrada }}
                      title={`Entrada ${brl(p.entrada)}`}
                    />
                  </div>
                  <span
                    className={`text-[9.5px] font-medium ${p.previsto ? "text-faint" : "text-muted"}`}
                  >
                    {p.rotulo}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3.5">
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-muted/35" /> gasto
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-brand" /> entrada
            </span>
            <span className="text-[11.5px] text-faint">barras claras = previsão</span>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-faint">
            A previsão repete o mesmo mês da safra passada. É o seu calendário, não uma estimativa
            de mercado.
          </p>
        </Tile>
      </section>

      {/* Movimentos */}
      {r.movimentos.length > 0 && (
        <section>
          <Titulo
            acao={
              <Link href="/conta" className="text-[13px] font-semibold text-brand">
                Ver tudo
              </Link>
            }
          >
            Últimas movimentações
          </Titulo>
          <Tile className="overflow-hidden">
            {r.movimentos.map((m, i) => (
              <div key={m.id}>
                {i > 0 && <Divisor />}
                <Linha
                  icone={m.tipo === "entrada" ? "mais" : "enviar"}
                  titulo={m.contraparte}
                  sub={m.descricao}
                  valor={`${m.tipo === "entrada" ? "+" : "−"} ${brl(m.valor)}`}
                  tom={m.tipo === "entrada" ? "brand" : "ink"}
                />
              </div>
            ))}
          </Tile>
        </section>
      )}

      {/* 5. Imposto, por último */}
      <section>
        <Titulo
          acao={
            <Link href="/imposto" className="text-[13px] font-semibold text-brand">
              Detalhes
            </Link>
          }
        >
          Seu imposto
        </Titulo>
        <Tile className="overflow-hidden">
          <Linha titulo="Vai pagar este ano" valor={brl(imposto.aPagar)} />
          <Divisor />
          <Linha
            titulo="Pagaria sem organizar"
            sub="Se a Receita estimasse seu lucro"
            valor={brl(imposto.semOrganizar)}
            tom="bad"
          />
          <div className="bg-brand-soft px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-semibold text-brand">Você economiza</span>
              <span className="tnum text-[18px] font-bold text-brand">{brl(imposto.economia)}</span>
            </div>
          </div>
        </Tile>
      </section>

      <div className="flex gap-3 rounded-card bg-raised px-4 py-3.5">
        <span className="mt-px shrink-0 text-brand">
          <Icone nome="cadeado" tamanho={17} />
        </span>
        <p className="text-[13px] leading-relaxed text-muted">
          Seu dinheiro fica na sua conta, no seu CPF. A Coope organiza e avisa — nunca guarda.
        </p>
      </div>
    </div>
  );
}
