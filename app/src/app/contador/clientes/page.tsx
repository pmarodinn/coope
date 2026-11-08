"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Chip, Icone } from "@/components/ui";
import { Cabecalho } from "@/components/contador/portal";
import { usePortal } from "@/components/contador/estado";
import {
  BotaoP,
  brl,
  Cartao,
  classeEntrada,
  Esqueleto,
  Gaveta,
  Iniciais,
  mi,
  PontoUrgencia,
  ROTULO_CERT,
  ROTULO_EXTRATO,
  SeloCertificado,
  SeloCnpj,
  SeloEnquadramento,
  SeloExtrato,
} from "@/components/contador/ui";
import {
  baixar,
  celularDe,
  csvCarteira,
  dataCurta,
  ROTULO_PENDENCIA,
  type ClientePortal,
  type Pendencia,
  type TipoPendencia,
} from "@/lib/portal";

const FILTROS: { k: string; rotulo: string; f: (c: ClientePortal) => boolean }[] = [
  { k: "todos", rotulo: "Todos", f: () => true },
  { k: "urgentes", rotulo: "Travam janeiro", f: (c) => c.urgencia === 1 },
  { k: "cnpj", rotulo: "Sem CNPJ", f: (c) => c.cnpj === "pendente" },
  { k: "notas", rotulo: "Notas sem IBS/CBS", f: (c) => c.notasSemCampos > 0 },
  { k: "decisao", rotulo: "Decisão pendente", f: (c) => c.decisao === "pendente" },
  { k: "extrato", rotulo: "Sem Open Finance", f: (c) => c.extratos !== "open_finance" },
  { k: "prontos", rotulo: "Prontos", f: (c) => c.urgencia === 3 },
  { k: "novos", rotulo: "Novos", f: (c) => c.novo },
];

type Ordem = "urgencia" | "nome" | "receita" | "notas";

export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Clientes />
    </Suspense>
  );
}

function Clientes() {
  const p = usePortal();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("urgencia");

  const f = params.get("f") ?? "todos";
  const aberto = params.get("c");

  const ir = (mudar: Record<string, string | null>) => {
    const u = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudar)) (v === null ? u.delete(k) : u.set(k, v));
    const s = u.toString();
    router.replace(s ? `${path}?${s}` : path, { scroll: false });
  };

  const filtroTipo = (Object.keys(ROTULO_PENDENCIA) as TipoPendencia[]).includes(f as TipoPendencia)
    ? (f as TipoPendencia)
    : null;

  const lista = useMemo(() => {
    const regra = filtroTipo
      ? (c: ClientePortal) => c.pendencias.some((x) => x.tipo === filtroTipo)
      : (FILTROS.find((x) => x.k === f)?.f ?? (() => true));
    const t = q.trim().toLowerCase();
    const l = p.clientes.filter(regra).filter((c) => !t || `${c.nome} ${c.municipio} ${c.cultura}`.toLowerCase().includes(t));
    if (ordem === "nome") l.sort((a, b) => a.nome.localeCompare(b.nome));
    if (ordem === "receita") l.sort((a, b) => b.receita - a.receita);
    if (ordem === "notas") l.sort((a, b) => b.notasSemCampos - a.notasSemCampos);
    return l;
  }, [p.clientes, f, filtroTipo, q, ordem]);

  if (!p.carregado) return <Esqueleto />;
  const atual = aberto ? p.cliente(aberto) : undefined;

  const Cab = ({ k, children, className = "" }: { k?: Ordem; children: React.ReactNode; className?: string }) => (
    <th className={`whitespace-nowrap px-3 py-3 font-semibold ${className}`}>
      {k ? (
        <button
          type="button"
          onClick={() => setOrdem(k)}
          className={`inline-flex items-center gap-1 ${ordem === k ? "text-ink" : "hover:text-ink"}`}
        >
          {children}
          {ordem === k && <span aria-hidden>↓</span>}
        </button>
      ) : (
        children
      )}
    </th>
  );

  return (
    <div className="rise">
      <Cabecalho
        titulo="Clientes"
        sub={`${p.resumo.produtores} produtores rurais na carteira · ${p.cidade}. Clique em um cliente para ver a ficha e resolver as pendências.`}
        acoes={
          <>
            <BotaoP
              variante="contorno"
              icone="baixar"
              onClick={() => {
                baixar(`carteira-rural-${new Date().toISOString().slice(0, 10)}.csv`, csvCarteira(lista));
                p.avisar(`Planilha com ${lista.length} clientes baixada`);
              }}
            >
              Exportar planilha
            </BotaoP>
            <Link href="/contador/convites?novo=1">
              <BotaoP icone="mais">Novo cliente</BotaoP>
            </Link>
          </>
        }
      />

      <Cartao semPadding>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <div className="relative w-full max-w-[280px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              <Icone nome="busca" tamanho={15} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrar por nome ou município"
              className={`${classeEntrada} h-9 pl-9`}
            />
          </div>
          <div className="no-bar flex gap-1.5 overflow-x-auto">
            {FILTROS.map((x) => {
              const n = p.clientes.filter(x.f).length;
              const ativo = f === x.k;
              return (
                <button
                  key={x.k}
                  type="button"
                  onClick={() => ir({ f: x.k === "todos" ? null : x.k })}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    ativo ? "bg-ink text-canvas" : "bg-raised text-muted hover:text-ink"
                  }`}
                >
                  {x.rotulo} <span className="tnum opacity-60">{n}</span>
                </button>
              );
            })}
            {filtroTipo && (
              <button
                type="button"
                onClick={() => ir({ f: null })}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-canvas"
              >
                {ROTULO_PENDENCIA[filtroTipo]} <Icone nome="fechar" tamanho={12} />
              </button>
            )}
          </div>
        </div>

        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse whitespace-nowrap text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11.5px] text-faint">
                <Cab k="nome" className="pl-5">
                  Produtor
                </Cab>
                <Cab k="receita">Receita 2026</Cab>
                <Cab>Em 2027</Cab>
                <Cab>CNPJ</Cab>
                <Cab k="notas">Notas</Cab>
                <Cab>Certificado</Cab>
                <Cab>Extrato</Cab>
                <Cab>IR: melhor forma</Cab>
                <Cab k="urgencia">Próxima ação</Cab>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => ir({ c: c.id })}
                  className={`cursor-pointer border-b border-line align-middle transition-colors last:border-b-0 hover:bg-raised ${
                    aberto === c.id ? "bg-brand-soft" : ""
                  }`}
                >
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <Iniciais nome={c.nome} tamanho={34} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold leading-snug">
                          <PontoUrgencia u={c.urgencia} />
                          <span className="truncate">{c.nome}</span>
                          {c.novo && <Chip tom="bom">novo</Chip>}
                        </p>
                        <p className="mt-0.5 truncate text-[11.5px] text-muted">
                          {c.municipio} · {c.cultura}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="tnum whitespace-nowrap px-3 py-3 text-muted">
                    {mi(c.receita)}
                    {c.novo && <span className="block text-[11px] text-faint">estimada</span>}
                  </td>
                  <td className="px-3 py-3">
                    <SeloEnquadramento c={c} />
                  </td>
                  <td className="px-3 py-3">
                    <SeloCnpj v={c.cnpj} />
                  </td>
                  <td className="tnum px-3 py-3">
                    {c.notasSemCampos > 0 ? (
                      <span className={`font-bold ${c.notasSemCampos >= 3 ? "text-bad" : "text-warn"}`}>
                        {c.notasSemCampos}
                      </span>
                    ) : (
                      <span className="text-faint">0</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <SeloCertificado v={c.certificado} />
                  </td>
                  <td className="px-3 py-3">
                    <SeloExtrato v={c.extratos} />
                  </td>
                  <td className="px-3 py-3">
                    {c.irConhecido ? (
                      <>
                        <p className="font-medium">{c.ir.melhor === "resultado" ? "Resultado" : "Presunção 20%"}</p>
                        <p className="tnum text-[11.5px] text-faint">vale {brl(c.ir.diferenca)}</p>
                      </>
                    ) : (
                      <span className="text-[12px] text-faint">Sem livro caixa</span>
                    )}
                  </td>
                  <td className="min-w-[200px] max-w-[260px] whitespace-normal px-3 py-3 text-muted">{c.proxima}</td>
                  <td className="pr-4 text-faint">
                    <Icone nome="seta" tamanho={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && (
            <p className="px-5 py-12 text-center text-[13px] text-muted">Nenhum cliente neste filtro.</p>
          )}
        </div>
      </Cartao>

      <Gaveta aberta={!!atual} fechar={() => ir({ c: null })}>
        {atual && <Ficha c={atual} fechar={() => ir({ c: null })} />}
      </Gaveta>
    </div>
  );
}

/* ---------------- ficha do cliente ---------------- */

const mascaraCnpj = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

function umAnoDepois() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function Ficha({ c, fechar }: { c: ClientePortal; fechar: () => void }) {
  const p = usePortal();
  const convites = p.estado.convites.filter((x) => x.clienteId === c.id || `novo-${x.codigo}` === c.id);

  return (
    <>
      <header className="flex items-start gap-4 border-b border-line bg-surface px-6 py-5">
        <Iniciais nome={c.nome} tamanho={46} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold leading-snug tracking-tight">{c.nome}</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {c.municipio} · {c.cultura}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <SeloEnquadramento c={c} />
            {c.novo && <Chip tom="bom">Entrou pelo pré-cadastro</Chip>}
            {c.urgencia === 3 && <Chip tom="bom">Pronto para janeiro</Chip>}
          </div>
        </div>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-raised"
        >
          <Icone nome="fechar" tamanho={17} />
        </button>
      </header>

      <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { r: c.novo ? "Receita 2026 (estimada)" : "Receita 2026", v: mi(c.receita) },
            { r: "Movimentos sem nota", v: String(c.movSemNota) },
            {
              r: "IR: melhor forma",
              v: c.irConhecido ? (c.ir.melhor === "resultado" ? "Resultado" : "Presunção 20%") : "—",
            },
            { r: "Diferença entre as formas", v: c.irConhecido ? brl(c.ir.diferenca) : "Sem livro caixa" },
          ].map((x) => (
            <div key={x.r} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
              <p className="text-[11.5px] font-medium text-muted">{x.r}</p>
              <p className="tnum mt-1 text-[18px] font-bold tracking-tight">{x.v}</p>
            </div>
          ))}
        </div>

        <section>
          <h3 className="mb-2 px-1 text-[14px] font-semibold">
            Pendências{" "}
            <span className="tnum font-normal text-faint">
              {c.pendencias.length ? `(${c.pendencias.length})` : ""}
            </span>
          </h3>
          {c.pendencias.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl bg-brand-soft px-4 py-4">
              <span className="text-brand">
                <Icone nome="check" tamanho={20} />
              </span>
              <p className="text-[13px] font-medium">Nada pendente. {c.proxima}.</p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
              {c.pendencias.map((x) => (
                <ItemPendencia key={x.tipo + x.titulo} c={c} x={x} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 px-1 text-[14px] font-semibold">Cadastro</h3>
          <dl className="divide-y divide-line overflow-hidden rounded-2xl bg-surface text-[13px] ring-1 ring-line">
            {[
              { k: "CNPJ", v: c.cnpj === "feito" ? (c.cnpjNumero ?? "Feito") : "Pendente" },
              {
                k: "Certificado digital",
                v: `${ROTULO_CERT[c.certificado]}${c.certificadoValidade ? ` · até ${dataCurta(c.certificadoValidade)}` : ""}`,
              },
              { k: "Extratos", v: ROTULO_EXTRATO[c.extratos] },
              {
                k: "Regime em 2027",
                v:
                  c.decisao === "nao_se_aplica"
                    ? c.enquadramento === "obrigatorio"
                      ? "Contribuinte (obrigatório)"
                      : "—"
                    : c.decisao === "pendente"
                      ? "Decidir até dezembro"
                      : c.decisao === "entrar"
                        ? "Entra no regime regular"
                        : "Fica fora do IBS/CBS",
              },
              { k: "Notas corrigidas", v: `${c.notasTotal - c.notasSemCampos} de ${c.notasTotal}` },
            ].map((l) => (
              <div key={l.k} className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-muted">{l.k}</dt>
                <dd className="text-right font-medium">{l.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {c.irConhecido && (
          <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
            <h3 className="text-[14px] font-semibold">Imposto de renda da atividade rural</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Pelo livro caixa, a forma mais barata é{" "}
              <span className="font-semibold text-ink">
                {c.ir.melhor === "resultado" ? "o resultado" : "a presunção de 20% da receita"}
              </span>
              , com diferença de <span className="tnum font-semibold text-brand">{brl(c.ir.diferenca)}</span> sobre a
              outra (Lei 8.023/1990, art. 5º). A escolha e a assinatura são do escritório.
            </p>
          </section>
        )}

        {convites.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-[14px] font-semibold">Convites e pedidos</h3>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
              {convites.map((x) => (
                <li key={x.codigo} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                  <span>
                    {x.tipo === "open_finance" ? "Pedido de Open Finance" : "Pré-cadastro"}
                    <span className="block text-[11.5px] text-faint">criado em {dataCurta(x.criadoEm)}</span>
                  </span>
                  <Chip tom={x.status === "concluido" ? "bom" : x.status === "aberto" ? "atencao" : "neutro"}>
                    {x.status === "concluido" ? "Concluído" : x.status === "aberto" ? "Aberto" : x.status === "cancelado" ? "Cancelado" : "Enviado"}
                  </Chip>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-line bg-surface px-6 py-4">
        {c.notasTotal > 0 && (
          <Link href={`/contador/notas?c=${c.id}`}>
            <BotaoP variante="contorno" icone="nota">
              Notas do cliente
            </BotaoP>
          </Link>
        )}
        {c.id === "menegat" && (
          <Link href="/app">
            <BotaoP variante="texto" icone="externo">
              Ver como o produtor vê
            </BotaoP>
          </Link>
        )}
      </footer>
    </>
  );
}

function ItemPendencia({ c, x }: { c: ClientePortal; x: Pendencia }) {
  const p = usePortal();
  const [editando, setEditando] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [validade, setValidade] = useState(umAnoDepois());
  const tom = x.gravidade === 1 ? "bg-bad" : x.gravidade === 2 ? "bg-warn" : "bg-faint";

  const pedirOpenFinance = () => {
    const aberto = p.estado.convites.find(
      (x) => x.tipo === "open_finance" && x.clienteId === c.id && (x.status === "enviado" || x.status === "aberto"),
    );
    if (aberto) return p.mostrarLink(aberto);
    const conv = p.convidar({
      tipo: "open_finance",
      nome: c.nome,
      celular: celularDe(c.id),
      clienteId: c.id,
    });
    p.mostrarLink(conv);
  };

  let acoes: React.ReactNode = null;
  if (x.tipo === "cnpj" || x.tipo === "cnpj_obrigatorio")
    acoes = editando ? null : (
      <BotaoP tamanho="p" variante="contorno" onClick={() => setEditando(true)}>
        Registrar CNPJ
      </BotaoP>
    );
  if (x.tipo === "certificado_vencido" || x.tipo === "certificado_vence")
    acoes = editando ? null : (
      <BotaoP tamanho="p" variante="contorno" onClick={() => setEditando(true)}>
        Registrar renovação
      </BotaoP>
    );
  if (x.tipo === "notas")
    acoes = (
      <Link href={`/contador/notas?c=${c.id}`}>
        <BotaoP tamanho="p" variante="contorno">
          Ver notas
        </BotaoP>
      </Link>
    );
  if (x.tipo === "extrato_faltando")
    acoes = (
      <div className="flex gap-1.5">
        <BotaoP tamanho="p" variante="suave" onClick={() => p.marcarExtratoArquivo(c.id)}>
          Recebi o arquivo
        </BotaoP>
        <BotaoP tamanho="p" icone="banco" onClick={pedirOpenFinance}>
          Pedir Open Finance
        </BotaoP>
      </div>
    );
  if (x.tipo === "extrato_arquivo")
    acoes = (
      <BotaoP tamanho="p" variante="contorno" icone="banco" onClick={pedirOpenFinance}>
        Pedir Open Finance
      </BotaoP>
    );
  if (x.tipo === "decisao")
    acoes = (
      <div className="flex gap-1.5">
        <BotaoP tamanho="p" variante="suave" onClick={() => p.decidir(c.id, "ficar_fora")}>
          Ficar fora
        </BotaoP>
        <BotaoP tamanho="p" variante="contorno" onClick={() => p.decidir(c.id, "entrar")}>
          Entrar
        </BotaoP>
      </div>
    );

  return (
    <li className="border-b border-line px-4 py-3.5 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tom}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug">{x.titulo}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{x.detalhe}</p>
          {acoes && <div className="mt-2.5">{acoes}</div>}
        </div>
      </div>

      {editando && (x.tipo === "cnpj" || x.tipo === "cnpj_obrigatorio") && (
        <form
          className="ml-5 mt-2.5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            p.registrarCnpj(c.id, cnpj);
          }}
        >
          <input
            autoFocus
            value={cnpj}
            onChange={(e) => setCnpj(mascaraCnpj(e.target.value))}
            placeholder="00.000.000/0001-00 (fictício)"
            className={`${classeEntrada} h-9`}
          />
          <BotaoP tamanho="p" type="submit">
            Salvar
          </BotaoP>
          <BotaoP tamanho="p" variante="texto" onClick={() => setEditando(false)}>
            Cancelar
          </BotaoP>
        </form>
      )}

      {editando && (x.tipo === "certificado_vencido" || x.tipo === "certificado_vence") && (
        <form
          className="ml-5 mt-2.5 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            p.renovarCertificado(c.id, validade);
          }}
        >
          <span className="whitespace-nowrap text-[12px] text-muted">Novo e-CPF A1 válido até</span>
          <input
            type="date"
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            className={`${classeEntrada} h-9 w-[160px]`}
          />
          <BotaoP tamanho="p" type="submit">
            Salvar
          </BotaoP>
          <BotaoP tamanho="p" variante="texto" onClick={() => setEditando(false)}>
            Cancelar
          </BotaoP>
        </form>
      )}
    </li>
  );
}
