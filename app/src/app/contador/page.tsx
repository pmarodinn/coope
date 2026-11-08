"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Anel, Barra, Icone } from "@/components/ui";
import { Cabecalho } from "@/components/contador/portal";
import { usePortal } from "@/components/contador/estado";
import { BotaoP, Cartao, Esqueleto, Iniciais, Kpi, mi, PontoUrgencia, SeloConvite } from "@/components/contador/ui";
import { AGENDA, dataCurta, quando, ROTULO_PENDENCIA, type TipoPendencia } from "@/lib/portal";
import { diasAte } from "@/lib/reforma";

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default function VisaoGeral() {
  const p = usePortal();
  const router = useRouter();
  if (!p.carregado) return <Esqueleto />;

  const r = p.resumo;
  const fila = p.clientes.filter((c) => c.urgencia < 3).slice(0, 7);
  const proximos = AGENDA.filter((a) => diasAte(a.data) > 0).slice(0, 4);

  const porTipo = new Map<TipoPendencia, number>();
  for (const c of p.clientes) for (const x of c.pendencias) porTipo.set(x.tipo, (porTipo.get(x.tipo) ?? 0) + 1);
  const tipos = [...porTipo].sort((a, b) => b[1] - a[1]);
  const maxTipo = Math.max(1, ...tipos.map((t) => t[1]));

  const enq = {
    obrigatorio: p.clientes.filter((c) => c.enquadramento === "obrigatorio"),
    perto: p.clientes.filter((c) => c.enquadramento === "perto"),
    opcional: p.clientes.filter((c) => c.enquadramento === "opcional"),
  };
  const receitaTotal = p.clientes.reduce((s, c) => s + c.receita, 0);
  const convites = p.estado.convites.filter((c) => c.status !== "cancelado").slice(0, 4);

  return (
    <div className="rise space-y-6">
      <Cabecalho
        titulo={`${saudacao()}, Marta`}
        sub={
          <>
            Faltam <span className="font-semibold text-ink">{p.diasParaCbs} dias</span> para o IBS/CBS.{" "}
            {r.urgentes > 0 ? (
              <>
                {r.urgentes} {r.urgentes === 1 ? "cliente trava" : "clientes travam"} janeiro se nada for feito.
              </>
            ) : (
              <>Nenhum cliente trava janeiro.</>
            )}
          </>
        }
        acoes={
          <>
            <Link href="/contador/clientes">
              <BotaoP variante="contorno" icone="pessoas">
                Ver carteira
              </BotaoP>
            </Link>
          </>
        }
      />

      {/* Prontidão da carteira */}
      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="flex items-center gap-7 rounded-card bg-surface p-6 shadow-card ring-1 ring-line">
          <Anel
            valor={r.produtores ? r.prontos / r.produtores : 0}
            centro={`${r.prontos}/${r.produtores}`}
            sub="prontos"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-brand">Carteira para 2027</p>
            <p className="mt-1.5 text-[20px] font-bold leading-snug tracking-tight">
              {r.prontos === r.produtores
                ? "Toda a carteira está pronta para janeiro."
                : `${r.produtores - r.prontos} produtores ainda têm algo que trava ou atrasa janeiro.`}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Pronto é quem tem CNPJ, notas com IBS/CBS, certificado válido, extrato chegando e a decisão do regime
              tomada. As notas vêm da SEFAZ e os extratos do Open Finance; quem decide e assina é o escritório.
            </p>
            <div className="mt-4 max-w-[420px]">
              <div className="mb-1.5 flex justify-between text-[12px] text-muted">
                <span>Até 01/01/2027</span>
                <span className="tnum">{p.diasParaCbs} dias</span>
              </div>
              <Barra valor={1 - p.diasParaCbs / 365} tom="warn" altura={6} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Kpi
            rotulo="Travam janeiro"
            valor={String(r.urgentes)}
            nota="CNPJ de contribuinte, notas em série ou certificado"
            tom="bad"
            icone="alerta"
            onClick={() => router.push("/contador/clientes?f=urgentes")}
          />
          <Kpi
            rotulo="Notas sem IBS/CBS"
            valor={String(r.notasSemCampos)}
            nota="Autuáveis desde 01/08/2026"
            tom="warn"
            icone="nota"
            onClick={() => router.push("/contador/notas")}
          />
          <Kpi
            rotulo="Sem CNPJ"
            valor={String(r.cnpjPendente)}
            nota="Obrigatório em 01/01/2027"
            tom="warn"
            icone="pessoas"
            onClick={() => router.push("/contador/clientes?f=cnpj")}
          />
          <Kpi
            rotulo="Open Finance"
            valor={`${r.openFinance}/${r.produtores}`}
            nota={`${r.semExtrato} sem extrato nenhum`}
            tom="brand"
            icone="banco"
            onClick={() => router.push("/contador/documentos")}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Fila de trabalho */}
        <Cartao
          titulo="Fila de trabalho"
          legenda="O que vence primeiro, cliente por cliente"
          acao={
            <Link href="/contador/clientes" className="text-[13px] font-semibold text-brand">
              Ver todos
            </Link>
          }
          semPadding
        >
          {fila.length === 0 ? (
            <p className="px-5 pb-6 text-[13px] text-muted">Nada pendente. A carteira está pronta.</p>
          ) : (
            <ul>
              {fila.map((c) => (
                <li key={c.id} className="border-t border-line">
                  <Link
                    href={`/contador/clientes?c=${c.id}`}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-raised"
                  >
                    <Iniciais nome={c.nome} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <PontoUrgencia u={c.urgencia} />
                        <span className="truncate text-[14px] font-semibold">{c.nome}</span>
                        {c.novo && (
                          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-semibold text-brand">
                            novo
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-muted">{c.proxima}</span>
                    </span>
                    <span className="hidden shrink-0 text-right md:block">
                      <span className="tnum block text-[13px] font-medium">{mi(c.receita)}</span>
                      <span className="block text-[11.5px] text-faint">
                        {c.pendencias.length} {c.pendencias.length === 1 ? "pendência" : "pendências"}
                      </span>
                    </span>
                    <span className="text-faint">
                      <Icone nome="seta" tamanho={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <div className="space-y-6">
          <Cartao
            titulo="Próximos prazos"
            acao={
              <Link href="/contador/prazos" className="text-[13px] font-semibold text-brand">
                Agenda
              </Link>
            }
          >
            <ul className="space-y-3">
              {proximos.map((a) => {
                const d = diasAte(a.data);
                return (
                  <li key={a.data} className="flex items-start gap-3">
                    <span
                      className={`flex w-[52px] shrink-0 flex-col items-center rounded-xl py-1.5 ${
                        d <= 60 ? "bg-warn-soft text-warn" : "bg-raised text-muted"
                      }`}
                    >
                      <span className="tnum text-[17px] font-bold leading-none">{d}</span>
                      <span className="mt-0.5 text-[10px] font-semibold">dias</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold leading-snug">{a.titulo}</span>
                      <span className="text-[12px] text-muted">{dataCurta(a.data)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Cartao>

          <Cartao titulo="Atividade recente" semPadding>
            <ul className="pb-2">
              {p.estado.eventos.slice(0, 5).map((e) => (
                <li key={e.id} className="flex gap-3 px-5 py-2.5">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      e.tom === "bom" ? "bg-brand" : e.tom === "atencao" ? "bg-warn" : "bg-faint"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-snug">{e.texto}</span>
                    <span className="text-[11.5px] text-faint">{quando(e.em)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Cartao titulo="Pendências por tipo" legenda="Quantos clientes têm cada uma">
          {tipos.length === 0 ? (
            <p className="text-[13px] text-muted">Nenhuma pendência.</p>
          ) : (
            <ul className="space-y-3">
              {tipos.map(([t, n]) => (
                <li key={t}>
                  <Link href={`/contador/clientes?f=${t}`} className="group block">
                    <div className="mb-1 flex justify-between text-[12.5px]">
                      <span className="font-medium group-hover:text-brand">{ROTULO_PENDENCIA[t]}</span>
                      <span className="tnum text-muted">{n}</span>
                    </div>
                    <Barra
                      valor={n / maxTipo}
                      altura={6}
                      tom={
                        t === "certificado_vencido" || t === "cnpj_obrigatorio"
                          ? "bad"
                          : t === "certificado_vence" || t === "extrato_arquivo"
                            ? "brand"
                            : "warn"
                      }
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo="Situação em 2027" legenda={`Receita de 2026 da carteira: ${mi(receitaTotal)}`}>
          <div className="flex h-3 overflow-hidden rounded-full bg-raised">
            <div className="bg-warn" style={{ width: `${(enq.obrigatorio.length / r.produtores) * 100}%` }} />
            <div className="bg-bad" style={{ width: `${(enq.perto.length / r.produtores) * 100}%` }} />
            <div className="bg-line" style={{ width: `${(enq.opcional.length / r.produtores) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { k: "obrigatorio", rotulo: "Contribuintes obrigatórios", nota: "Receita acima de R$ 3,6 mi", cor: "bg-warn" },
              { k: "perto", rotulo: "Perto do limite", nota: "Acompanhar mês a mês", cor: "bg-bad" },
              { k: "opcional", rotulo: "Podem escolher", nota: "Ficar fora ou entrar", cor: "bg-line" },
            ].map((x) => (
              <li key={x.k} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-[3px] ${x.cor}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{x.rotulo}</span>
                  <span className="block text-[11.5px] text-faint">{x.nota}</span>
                </span>
                <span className="tnum text-[15px] font-bold">{enq[x.k as keyof typeof enq].length}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[12px] text-muted">
            {r.decisoesPendentes} {r.decisoesPendentes === 1 ? "decisão pendente" : "decisões pendentes"} de regime até
            dezembro.
          </p>
        </Cartao>

        <Cartao
          titulo="Convites em andamento"
          acao={
            <Link href="/contador/convites" className="text-[13px] font-semibold text-brand">
              Gerenciar
            </Link>
          }
          semPadding
        >
          {convites.length === 0 ? (
            <p className="px-5 pb-5 text-[13px] text-muted">Nenhum convite enviado.</p>
          ) : (
            <ul className="pb-2">
              {convites.map((c) => (
                <li key={c.codigo} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-muted">
                    <Icone nome={c.tipo === "open_finance" ? "banco" : "link"} tamanho={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{c.nome}</span>
                    <span className="block text-[11.5px] text-faint">
                      {c.tipo === "open_finance" ? "Open Finance" : "Pré-cadastro"} · {quando(c.criadoEm)}
                    </span>
                  </span>
                  <SeloConvite v={c.status} />
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line px-5 py-3">
            <Link href="/contador/convites?novo=1" className="text-[13px] font-semibold text-brand">
              + Convidar um produtor
            </Link>
          </div>
        </Cartao>
      </section>

      <p className="text-[11.5px] leading-relaxed text-faint">
        Demonstração com escritório e produtores fictícios. Situação de 2027 pela receita de 2026 (LC nº 214/2025, art.
        164). O que você muda aqui fica salvo só neste navegador.
      </p>
    </div>
  );
}
