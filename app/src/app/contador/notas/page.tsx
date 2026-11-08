"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Chip, Icone } from "@/components/ui";
import { Cabecalho } from "@/components/contador/portal";
import { usePortal } from "@/components/contador/estado";
import { BotaoP, brl, Cartao, classeEntrada, Esqueleto, Kpi, Modal, Vazio } from "@/components/contador/ui";
import { dataCurta, type NotaPendente } from "@/lib/portal";

export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Notas />
    </Suspense>
  );
}

function Notas() {
  const p = usePortal();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const cliente = params.get("c") ?? "";
  const [aba, setAba] = useState<"pendentes" | "corrigidas">("pendentes");
  const [sel, setSel] = useState<string[]>([]);
  const [detalhe, setDetalhe] = useState<NotaPendente | null>(null);

  const lista = useMemo(
    () =>
      p.notas
        .filter((n) => (aba === "pendentes" ? !n.corrigida : n.corrigida))
        .filter((n) => !cliente || n.clienteId === cliente),
    [p.notas, aba, cliente],
  );

  if (!p.carregado) return <Esqueleto />;

  const pendentes = p.notas.filter((n) => !n.corrigida);
  const valorPendente = pendentes.reduce((s, n) => s + n.valor, 0);
  const clientesComNota = p.clientes.filter((c) => c.notasTotal > 0);
  const todasMarcadas = lista.length > 0 && lista.every((n) => sel.includes(n.id));

  const corrigir = (ids: string[]) => {
    p.corrigirNotas(ids);
    setSel((s) => s.filter((x) => !ids.includes(x)));
    setDetalhe(null);
  };

  return (
    <div className="rise space-y-6">
      <Cabecalho
        titulo="Notas fiscais"
        sub="Notas de venda baixadas da SEFAZ que saíram sem o grupo IBS/CBS. Desde 01/08/2026 a falta desses campos é autuável; corrija no emissor e marque aqui."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi rotulo="Notas pendentes" valor={String(pendentes.length)} tom="warn" icone="nota" />
        <Kpi rotulo="Valor dessas notas" valor={`R$ ${(valorPendente / 1_000_000).toFixed(1).replace(".", ",")} mi`} icone="credito" />
        <Kpi
          rotulo="Clientes afetados"
          valor={String(new Set(pendentes.map((n) => n.clienteId)).size)}
          icone="pessoas"
        />
        <Kpi
          rotulo="Corrigidas"
          valor={String(p.notas.length - pendentes.length)}
          nota={`de ${p.notas.length} encontradas`}
          tom="brand"
          icone="check"
        />
      </div>

      <Cartao semPadding>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <div className="flex rounded-full bg-raised p-1">
            {(["pendentes", "corrigidas"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAba(a);
                  setSel([]);
                }}
                className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold capitalize transition-colors ${
                  aba === a ? "bg-surface text-ink shadow-card" : "text-muted"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <select
            value={cliente}
            onChange={(e) => {
              const v = e.target.value;
              router.replace(v ? `${path}?c=${v}` : path, { scroll: false });
            }}
            className={`${classeEntrada} h-9 w-auto min-w-[240px]`}
          >
            <option value="">Todos os clientes</option>
            {clientesComNota.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.notasSemCampos})
              </option>
            ))}
          </select>
          {aba === "pendentes" && sel.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12.5px] text-muted">{sel.length} selecionadas</span>
              <BotaoP tamanho="p" icone="check" onClick={() => corrigir(sel)}>
                Marcar como corrigidas
              </BotaoP>
            </div>
          )}
        </div>

        {lista.length === 0 ? (
          <Vazio titulo={aba === "pendentes" ? "Nenhuma nota pendente" : "Nenhuma nota corrigida ainda"}>
            {aba === "pendentes"
              ? "Todas as notas de venda deste filtro têm o grupo IBS/CBS preenchido."
              : "Quando você marcar uma nota como corrigida, ela aparece aqui."}
          </Vazio>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse whitespace-nowrap text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11.5px] text-faint">
                  {aba === "pendentes" && (
                    <th className="w-10 py-3 pl-5">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todas"
                        checked={todasMarcadas}
                        onChange={() => setSel(todasMarcadas ? [] : lista.map((n) => n.id))}
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                    </th>
                  )}
                  <th className={`py-3 pr-3 font-semibold ${aba === "pendentes" ? "" : "pl-5"}`}>NF-e</th>
                  <th className="px-3 py-3 font-semibold">Emissão</th>
                  <th className="px-3 py-3 font-semibold">Emitente</th>
                  <th className="px-3 py-3 font-semibold">Destinatário</th>
                  <th className="px-3 py-3 font-semibold">Produto</th>
                  <th className="px-3 py-3 text-right font-semibold">Valor</th>
                  <th className="px-3 py-3 font-semibold">O que falta</th>
                  <th className="pr-5" />
                </tr>
              </thead>
              <tbody>
                {lista.map((n) => (
                  <tr key={n.id} className="border-b border-line last:border-b-0 hover:bg-raised">
                    {aba === "pendentes" && (
                      <td className="py-3 pl-5">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar nota ${n.numero}`}
                          checked={sel.includes(n.id)}
                          onChange={() =>
                            setSel((s) => (s.includes(n.id) ? s.filter((x) => x !== n.id) : [...s, n.id]))
                          }
                          className="h-4 w-4 accent-[var(--brand)]"
                        />
                      </td>
                    )}
                    <td className={`mono py-3 pr-3 text-[12.5px] ${aba === "pendentes" ? "" : "pl-5"}`}>
                      {n.numero}/{n.serie}
                    </td>
                    <td className="tnum px-3 py-3 text-muted">{dataCurta(n.emissao)}</td>
                    <td className="px-3 py-3 font-medium">{n.cliente}</td>
                    <td className="px-3 py-3 text-muted">{n.destinatario}</td>
                    <td className="px-3 py-3 text-muted">{n.produto}</td>
                    <td className="tnum px-3 py-3 text-right font-semibold">{brl(n.valor)}</td>
                    <td className="whitespace-normal px-3 py-3">
                      {n.corrigida ? (
                        <Chip tom="bom">Corrigida</Chip>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {n.falta.map((f) => (
                            <Chip key={f} tom="atencao">
                              {f}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="pr-5 text-right">
                      <BotaoP tamanho="p" variante="texto" onClick={() => setDetalhe(n)}>
                        Detalhes
                      </BotaoP>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      <Modal aberto={!!detalhe} fechar={() => setDetalhe(null)} titulo={`NF-e ${detalhe?.numero ?? ""}`} largura={560}>
        {detalhe && (
          <div className="space-y-4 text-[13px]">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Emitente", detalhe.cliente],
                ["Destinatário", detalhe.destinatario],
                ["Emissão", dataCurta(detalhe.emissao)],
                ["Valor", brl(detalhe.valor)],
                ["Produto", detalhe.produto],
                ["Série", detalhe.serie],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-raised px-3.5 py-2.5">
                  <dt className="text-[11.5px] text-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="mb-1.5 font-semibold">Campos ausentes no XML</p>
              <div className="flex flex-wrap gap-1.5">
                {detalhe.falta.map((f) => (
                  <Chip key={f} tom="atencao">
                    {f}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-raised px-4 py-3.5">
              <p className="flex items-center gap-2 font-semibold">
                <Icone nome="olho" tamanho={15} /> Como corrigir
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed text-muted">
                <li>Atualize o emissor do produtor para o leiaute com o grupo IBS/CBS.</li>
                <li>Informe CST e cClassTrib do produto agropecuário in natura (redução de 60%).</li>
                <li>Emita a nota complementar ou cancele e reemita dentro do prazo.</li>
              </ol>
            </div>
            {!detalhe.corrigida && (
              <div className="flex justify-end gap-2 pt-1">
                <BotaoP variante="suave" onClick={() => setDetalhe(null)}>
                  Fechar
                </BotaoP>
                <BotaoP icone="check" onClick={() => corrigir([detalhe.id])}>
                  Marcar como corrigida
                </BotaoP>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
