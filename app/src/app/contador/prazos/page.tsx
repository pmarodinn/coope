"use client";

import Link from "next/link";
import { Icone } from "@/components/ui";
import { Cabecalho } from "@/components/contador/portal";
import { usePortal } from "@/components/contador/estado";
import { Cartao, Esqueleto } from "@/components/contador/ui";
import { AGENDA, dataCurta } from "@/lib/portal";
import { diasAte, FONTES_REFORMA } from "@/lib/reforma";

export default function Prazos() {
  const p = usePortal();
  if (!p.carregado) return <Esqueleto />;

  const r = p.resumo;
  const janeiro = [
    { n: r.cnpjPendente, t: "CNPJ por fazer", href: "/contador/clientes?f=cnpj" },
    { n: r.notasSemCampos, t: "notas de venda sem IBS/CBS", href: "/contador/notas" },
    { n: r.decisoesPendentes, t: "decisões de regime até dezembro", href: "/contador/clientes?f=decisao" },
    { n: r.certificadosProblema, t: "certificados vencidos ou vencendo", href: "/contador/documentos" },
    { n: r.semExtrato, t: "clientes sem extrato", href: "/contador/documentos" },
  ];

  return (
    <div className="rise space-y-6">
      <Cabecalho
        titulo="Prazos da reforma"
        sub="O calendário que vale para toda a carteira rural, com a fonte de cada data. O que ainda depende de ato do governo aparece como premissa."
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Cartao titulo="Linha do tempo">
          <ol className="relative ml-3 border-l border-line">
            {AGENDA.map((a) => {
              const d = diasAte(a.data);
              const passou = d === 0;
              return (
                <li key={a.data} className="relative pb-7 pl-7 last:pb-1">
                  <span
                    className={`absolute -left-[9px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-4 ring-surface ${
                      passou ? "bg-brand text-brand-ink" : d <= 60 ? "bg-warn text-white" : "bg-raised text-muted"
                    }`}
                  >
                    {passou && <Icone nome="check" tamanho={11} />}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="tnum text-[12.5px] font-semibold text-muted">{dataCurta(a.data)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        passou ? "bg-brand-soft text-brand" : d <= 60 ? "bg-warn-soft text-warn" : "bg-raised text-muted"
                      }`}
                    >
                      {passou ? "Em vigor" : `em ${d} dias`}
                    </span>
                  </div>
                  <p className="mt-1 text-[15px] font-semibold leading-snug">{a.titulo}</p>
                  <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-muted">{a.detalhe}</p>
                  <p className="mt-1.5 text-[11.5px] text-faint">{a.fonte}</p>
                </li>
              );
            })}
          </ol>
        </Cartao>

        <div className="space-y-6">
          <Cartao titulo="Para chegar em janeiro" legenda={`Faltam ${p.diasParaCbs} dias. O que a carteira ainda deve:`}>
            <ul className="space-y-1">
              {janeiro.map((j) => (
                <li key={j.t}>
                  <Link
                    href={j.href}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-raised"
                  >
                    <span
                      className={`tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold ${
                        j.n ? "bg-warn-soft text-warn" : "bg-brand-soft text-brand"
                      }`}
                    >
                      {j.n}
                    </span>
                    <span className="flex-1 text-[13.5px]">{j.t}</span>
                    <span className="text-faint">
                      <Icone nome="seta" tamanho={15} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Cartao>

          <Cartao titulo="Fontes">
            <ul className="space-y-2.5">
              {FONTES_REFORMA.map((f) => (
                <li key={f} className="flex gap-2.5 text-[12.5px] leading-relaxed text-muted">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                  {f}
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      </div>
    </div>
  );
}
