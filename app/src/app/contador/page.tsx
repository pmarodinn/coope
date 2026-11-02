"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Carteira, ClienteCarteira, Extrato } from "@/lib/reforma";
import { ROTULO_ENQUADRAMENTO } from "@/lib/reforma";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const mi = (v: number) => `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`;

const ALERTA = "#e3a83f";
const PERIGO = "#ef7361";

function Pilula({ cor, children }: { cor: "ok" | "alerta" | "perigo" | "neutro"; children: React.ReactNode }) {
  const estilo =
    cor === "ok"
      ? "bg-[--acento-fundo] text-[--acento]"
      : cor === "neutro"
        ? "bg-[--fundo-3] text-[--tinta-2]"
        : "";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${estilo}`}
      style={
        cor === "alerta"
          ? { background: "rgba(227,168,63,0.14)", color: ALERTA }
          : cor === "perigo"
            ? { background: "rgba(239,115,97,0.14)", color: PERIGO }
            : undefined
      }
    >
      {children}
    </span>
  );
}

const EXTRATO: Record<Extrato, { rotulo: string; cor: "ok" | "alerta" | "perigo" }> = {
  open_finance: { rotulo: "Open Finance", cor: "ok" },
  ofx: { rotulo: "Arquivo enviado", cor: "alerta" },
  faltando: { rotulo: "Faltando", cor: "perigo" },
};

const DECISAO: Record<ClienteCarteira["decisao"], string> = {
  nao_se_aplica: "—",
  pendente: "Decidir até dezembro",
  ficar_fora: "Ficar fora",
  entrar: "Entrar",
};

function Kpi({ rotulo, valor, nota, cor }: { rotulo: string; valor: string; nota: string; cor?: string }) {
  return (
    <div className="rounded-2xl border border-[--linha] bg-[--fundo-2] p-5">
      <p className="text-[12px] leading-snug text-[--tinta-2]">{rotulo}</p>
      <p className="tnum mt-2 text-[30px] font-semibold leading-none tracking-tight" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[--tinta-3]">{nota}</p>
    </div>
  );
}

export default function PainelContador() {
  const [c, setC] = useState<Carteira | null>(null);

  useEffect(() => {
    fetch("/api/contador")
      .then((r) => r.json())
      .then(setC);
  }, []);

  if (!c) {
    return (
      <main className="mx-auto max-w-[1240px] space-y-4 px-6 py-16">
        <div className="h-24 animate-pulse rounded-2xl bg-[--fundo-2]" />
        <div className="h-72 animate-pulse rounded-2xl bg-[--fundo-2]" />
      </main>
    );
  }

  const r = c.resumo;

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="rotulo">Painel do contador · {c.escritorio}</p>
          <h1 className="display-2 mt-3 max-w-[22ch]">
            Faltam {c.diasParaCbs} dias. A carteira rural, conferida.
          </h1>
          <p className="mt-4 max-w-[64ch] text-[14.5px] leading-relaxed text-[--tinta-2]">
            Cada produtor do escritório com o que vence primeiro: CNPJ, notas de venda sem IBS e CBS,
            certificado, extrato e a decisão de quem está abaixo de R$ 3,6 milhões. As notas vêm da SEFAZ e
            os extratos do Open Finance; quem decide e assina é o contador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app"
            className="rounded-full border border-[--linha] px-4 py-2 text-[13px] font-medium transition-colors hover:border-[--acento] hover:text-[--acento]"
          >
            Ver o app do produtor
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[--linha] px-4 py-2 text-[13px] font-medium transition-colors hover:border-[--acento] hover:text-[--acento]"
          >
            Apresentação
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi rotulo="Produtores na carteira" valor={String(r.produtores)} nota={c.cidade} />
        <Kpi
          rotulo="Contribuintes em 2027"
          valor={String(r.obrigatorios)}
          nota="Receita de 2026 acima de R$ 3,6 mi"
        />
        <Kpi rotulo="Sem CNPJ" valor={String(r.cnpjPendente)} nota="Obrigatório em 01/01/2027" cor={PERIGO} />
        <Kpi
          rotulo="Notas sem IBS/CBS"
          valor={String(r.notasSemCampos)}
          nota="Autuáveis desde 01/08/2026"
          cor={ALERTA}
        />
        <Kpi
          rotulo="Decisões pendentes"
          valor={String(r.decisoesPendentes)}
          nota="Entrar ou não no regime regular"
          cor={ALERTA}
        />
        <Kpi
          rotulo="Extratos pelo Open Finance"
          valor={`${r.openFinance}/${r.produtores}`}
          nota={`${r.semExtrato} sem extrato nenhum`}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-[--linha] bg-[--fundo-2]">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pb-4 pt-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Fila de trabalho</h2>
          <p className="text-[12px] text-[--tinta-3]">Ordenada pelo que vence primeiro</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-[--linha] text-[11px] uppercase tracking-[0.12em] text-[--tinta-3]">
                <th className="px-6 py-3 font-medium">Produtor</th>
                <th className="px-3 py-3 font-medium">Receita 2026</th>
                <th className="px-3 py-3 font-medium">Em 2027</th>
                <th className="px-3 py-3 font-medium">CNPJ</th>
                <th className="px-3 py-3 font-medium">Notas sem IBS/CBS</th>
                <th className="px-3 py-3 font-medium">Certificado</th>
                <th className="px-3 py-3 font-medium">Extrato</th>
                <th className="px-3 py-3 font-medium">IR: melhor forma</th>
                <th className="px-6 py-3 font-medium">Próxima ação</th>
              </tr>
            </thead>
            <tbody>
              {c.clientes.map((p) => (
                <tr key={p.id} className="border-b border-[--linha] align-top last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: p.urgencia === 1 ? PERIGO : p.urgencia === 2 ? ALERTA : "var(--acento)",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{p.nome}</p>
                        <p className="mt-0.5 text-[11.5px] text-[--tinta-3]">
                          {p.municipio} · {p.cultura}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="tnum px-3 py-4 text-[--tinta-2]">{mi(p.receita)}</td>
                  <td className="px-3 py-4">
                    <Pilula
                      cor={p.enquadramento === "obrigatorio" ? "alerta" : p.enquadramento === "perto" ? "perigo" : "neutro"}
                    >
                      {ROTULO_ENQUADRAMENTO[p.enquadramento]}
                    </Pilula>
                    {p.decisao !== "nao_se_aplica" && (
                      <p className="mt-1.5 text-[11.5px] text-[--tinta-3]">{DECISAO[p.decisao]}</p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <Pilula cor={p.cnpj === "feito" ? "ok" : "perigo"}>{p.cnpj === "feito" ? "Feito" : "Falta"}</Pilula>
                  </td>
                  <td className="tnum px-3 py-4">
                    {p.notasSemCampos > 0 ? (
                      <span style={{ color: p.notasSemCampos >= 3 ? PERIGO : ALERTA }} className="font-semibold">
                        {p.notasSemCampos}
                      </span>
                    ) : (
                      <span className="text-[--tinta-3]">0</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <Pilula cor={p.certificado === "valido" ? "ok" : p.certificado === "vence" ? "alerta" : "perigo"}>
                      {p.certificado === "valido" ? "Válido" : p.certificado === "vence" ? "Vence logo" : "Vencido"}
                    </Pilula>
                  </td>
                  <td className="px-3 py-4">
                    <Pilula cor={EXTRATO[p.extratos].cor}>{EXTRATO[p.extratos].rotulo}</Pilula>
                    {p.movSemNota > 0 && (
                      <p className="mt-1.5 text-[11.5px] text-[--tinta-3]">{p.movSemNota} sem nota</p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium">{p.ir.melhor === "resultado" ? "Resultado" : "Presunção 20%"}</p>
                    <p className="tnum mt-0.5 text-[11.5px] text-[--tinta-3]">vale {brl(p.ir.diferenca)}</p>
                  </td>
                  <td className="px-6 py-4 text-[--tinta-2]">{p.proxima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {[
          {
            titulo: "Nota fiscal: o documento",
            corpo:
              "Baixada da SEFAZ pelo serviço de distribuição de documentos fiscais, com o certificado do produtor ou com o CNPJ do escritório autorizado na própria nota. Diz o que foi vendido e comprado, de quem e por quanto.",
          },
          {
            titulo: "Open Finance: o caixa",
            corpo:
              "Extrato de todos os bancos do produtor, com a autorização dele, por uma instituição integradora regulada. Diz em que dia o dinheiro entrou ou saiu e por qual conta, que é o que o livro caixa exige, e mostra o que se move sem nota. Sem consentimento, o escritório envia o arquivo do banco.",
          },
          {
            titulo: "Contador: a decisão",
            corpo:
              "O painel aponta, compara e simula. Escriturar, apurar e assinar continuam com o contador responsável: é atividade privativa da profissão, e a Coope vende software, não serviço contábil.",
          },
        ].map((b) => (
          <div key={b.titulo} className="rounded-2xl border border-[--linha] bg-[--fundo-2] p-6">
            <h3 className="text-[15px] font-semibold tracking-tight">{b.titulo}</h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[--tinta-2]">{b.corpo}</p>
          </div>
        ))}
      </section>

      <p className="mono mt-8 text-[11px] leading-relaxed text-[--tinta-3]">
        Demonstração com escritório e produtores fictícios. Situação de 2027 pela receita de 2026 (LC nº
        214/2025, art. 164). CNPJ do produtor pessoa física obrigatório a partir de 01/01/2027.
      </p>
    </main>
  );
}
