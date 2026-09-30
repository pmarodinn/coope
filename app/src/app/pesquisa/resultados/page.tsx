"use client";

import { useEffect, useMemo, useState } from "react";
import { PERGUNTAS } from "@/lib/pesquisa";
import {
  adicionar,
  contar,
  contarPrimeira,
  escritos,
  funil,
  indicadores,
  intervalo,
  paraCSV,
  perfilAlvo,
  restaurar,
  type Entrada,
} from "@/lib/pesquisa-analise";

/**
 * Leitura das respostas. Esta página não fala com o banco (ele não deixa ninguém
 * ler pelo site, porque guarda nome e celular). O arquivo `estatisticas.csv`, que
 * `npm run exportar` gera a partir do banco, é aberto aqui, e as contas ficam
 * neste navegador. Nome e celular, se vierem no arquivo, não são lidos: a página
 * só procura os códigos das respostas.
 */

const VERDE = "#0b7a4a";
const CHAVE = "coope:pesquisa:respostas";

const pct = (v: number) => `${Math.round(v * 100)}%`;

function guardar(lista: Entrada[]) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista.map((e) => e.codigo)));
  } catch {
    /* sem armazenamento: o CSV continua valendo */
  }
}

export default function Resultados() {
  const [lista, setLista] = useState<Entrada[]>([]);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [segmento, setSegmento] = useState<"todos" | "alvo">("todos");
  const [apagando, setApagando] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE);
      if (bruto) setLista(restaurar(JSON.parse(bruto)));
    } catch {
      /* começa vazio */
    }
    setPronto(true);
  }, []);

  function incluir(conteudo: string = texto, deArquivo = false) {
    const r = adicionar(lista, conteudo);
    setLista(r.lista);
    guardar(r.lista);

    const partes = [`${r.novas} ${r.novas === 1 ? "resposta nova" : "respostas novas"}`];
    if (r.repetidas) partes.push(`${r.repetidas} já estava${r.repetidas === 1 ? "" : "m"} aqui`);
    if (r.invalidas) partes.push(`${r.invalidas} ${r.invalidas === 1 ? "código inválido" : "códigos inválidos"}`);
    if (r.outraVersao) partes.push(`${r.outraVersao} de outra versão da pesquisa`);
    if (!r.novas && !r.repetidas && !r.invalidas && !r.outraVersao) partes.splice(0, 1, "Nenhum código encontrado no texto");
    setAviso(partes.join(" · "));
    if (!deArquivo && (r.novas || r.repetidas)) setTexto("");
  }

  async function abrirArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite abrir o mesmo arquivo de novo depois
    if (!arquivo) return;
    try {
      incluir(await arquivo.text(), true);
    } catch {
      setAviso("Não deu para ler esse arquivo.");
    }
  }

  function baixar() {
    const blob = new Blob([paraCSV(lista)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pesquisa-coope-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copiarCodigos() {
    try {
      await navigator.clipboard.writeText(lista.map((e) => e.codigo).join("\n"));
      setAviso("Códigos copiados. Colar de volta aqui restaura tudo.");
    } catch {
      setAviso("Não deu para copiar automaticamente.");
    }
  }

  function apagar() {
    if (!apagando) {
      setApagando(true);
      window.setTimeout(() => setApagando(false), 4000);
      return;
    }
    setLista([]);
    guardar([]);
    setApagando(false);
    setAviso("Tudo apagado deste navegador.");
  }

  const visiveis = useMemo(
    () => (segmento === "alvo" ? lista.filter((e) => perfilAlvo(e.respostas)) : lista),
    [lista, segmento],
  );
  const etapas = useMemo(() => funil(lista), [lista]);
  const indic = useMemo(() => indicadores(visiveis), [visiveis]);
  const nAlvo = etapas[1]?.n ?? 0;

  return (
    <div
      className="min-h-screen bg-white text-[#111814]"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      <main className="mx-auto w-full max-w-[920px] px-5 pb-24 pt-10 md:px-8 md:pt-14">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#4d5b53]">Coope</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight md:text-[40px]">Resultados da pesquisa</h1>
        <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-[#4d5b53]">
          Abra o arquivo <span className="font-mono text-[14px]">estatisticas.csv</span>, que o comando{" "}
          <span className="font-mono text-[14px]">npm run exportar</span> gera a partir do banco, ou cole os códigos. A
          página acha os códigos, ignora o resto e faz as contas. Nada sai deste navegador, e nome e celular não são lidos.
        </p>

        {/* entrada */}
        <section className="mt-8 rounded-2xl border border-[#dde2db] p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="arquivo"
              className="inline-flex h-11 cursor-pointer items-center rounded-xl px-5 text-[15px] font-semibold text-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0b7a4a]"
              style={{ background: VERDE }}
            >
              Abrir arquivo
              <input id="arquivo" type="file" accept=".csv,.txt,text/csv,text/plain" onChange={abrirArquivo} className="sr-only" />
            </label>
            <span className="text-[14px] text-[#4d5b53]">ou cole os códigos abaixo</span>
          </div>
          <label htmlFor="colar" className="mt-5 block text-[15px] font-semibold">
            Códigos
          </label>
          <textarea
            id="colar"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            spellCheck={false}
            placeholder="Cole aqui os códigos (COOPE3-…), um por linha ou misturados a outro texto."
            className="mt-2 w-full resize-y rounded-xl border border-[#dde2db] bg-[#fafbf9] p-3 font-mono text-[14px] leading-relaxed outline-none focus:border-[#0b7a4a]"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => incluir()}
              disabled={!texto.trim()}
              className="h-11 rounded-xl px-5 text-[15px] font-semibold text-white disabled:bg-[#cdd5cd]"
              style={texto.trim() ? { background: VERDE } : undefined}
            >
              Adicionar
            </button>
            {aviso && (
              <p role="status" className="text-[14px] text-[#4d5b53]">
                {aviso}
              </p>
            )}
          </div>
        </section>

        {pronto && lista.length === 0 && (
          <p className="mt-12 rounded-2xl bg-[#f3f5f1] px-5 py-8 text-center text-[16px] text-[#4d5b53]">
            Ainda não há respostas. Abra o arquivo exportado ou cole os primeiros códigos acima.
          </p>
        )}

        {lista.length > 0 && (
          <>
            {/* ações e segmento */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div role="radiogroup" aria-label="Quem entra nas contas" className="inline-flex rounded-xl bg-[#f0f2ee] p-1">
                {(
                  [
                    ["todos", `Todos (${lista.length})`],
                    ["alvo", `Só o perfil do produto (${nAlvo})`],
                  ] as const
                ).map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={segmento === valor}
                    onClick={() => setSegmento(valor)}
                    className={`rounded-lg px-3.5 py-2 text-[14px] font-medium ${
                      segmento === valor ? "bg-white shadow-sm" : "text-[#4d5b53]"
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 text-[14px]">
                <button type="button" onClick={baixar} className="rounded-xl border border-[#dde2db] px-3.5 py-2 font-medium">
                  Baixar CSV
                </button>
                <button type="button" onClick={copiarCodigos} className="rounded-xl border border-[#dde2db] px-3.5 py-2 font-medium">
                  Copiar códigos
                </button>
                <button
                  type="button"
                  onClick={apagar}
                  className={`rounded-xl border px-3.5 py-2 font-medium ${
                    apagando ? "border-[#c4392c] bg-[#c4392c] text-white" : "border-[#dde2db] text-[#4d5b53]"
                  }`}
                >
                  {apagando ? "Toque de novo para apagar" : "Apagar tudo"}
                </button>
              </div>
            </div>

            {visiveis.length < 30 && (
              <p className="mt-5 rounded-xl bg-[#fdf3e3] px-4 py-3 text-[14px] leading-snug text-[#7a4f06]">
                {visiveis.length === 0
                  ? "Ninguém neste recorte ainda."
                  : `Com ${visiveis.length} ${visiveis.length === 1 ? "resposta" : "respostas"}, leia como indício, não como conclusão. Os intervalos abaixo mostram o quanto o número ainda pode mexer.`}
              </p>
            )}

            {/* indicadores */}
            <h2 className="mt-12 text-[22px] font-bold tracking-tight">Os números que importam</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {indic.map((i) => {
                const p = i.n ? i.sucessos / i.n : 0;
                const [de, ate] = intervalo(i.sucessos, i.n);
                return (
                  <div key={i.rotulo} className="flex flex-col rounded-2xl border border-[#dde2db] p-4">
                    <p className="text-[34px] font-bold leading-none tracking-tight tabular-nums">{i.n ? pct(p) : "—"}</p>
                    <p className="mt-2.5 text-[14.5px] font-semibold leading-snug">{i.rotulo}</p>
                    <p className="mt-1 text-[13px] leading-snug text-[#4d5b53]">{i.nota}</p>
                    {i.n > 0 && (
                      <p className="mt-auto pt-3 text-[12.5px] tabular-nums text-[#4d5b53]">
                        {i.sucessos} de {i.n} · entre {pct(de)} e {pct(ate)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* funil */}
            <h2 className="mt-14 text-[22px] font-bold tracking-tight">Demanda qualificada</h2>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-[#4d5b53]">
              Cada etapa só conta quem passou pelas anteriores. O último número é gente que está no perfil, tem o
              problema, quer testar, deixaria ler os dados e consegue entrar.
            </p>
            <ol className="mt-5 space-y-2.5">
              {etapas.map((e, i) => {
                const topo = etapas[0].n || 1;
                const anterior = i === 0 ? e.n : etapas[i - 1].n;
                return (
                  <li key={e.rotulo}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[15px] font-semibold">{e.rotulo}</span>
                      <span className="text-[15px] tabular-nums">
                        <strong>{e.n}</strong>
                        <span className="text-[#4d5b53]">
                          {i > 0 && anterior > 0 ? ` · ${pct(e.n / anterior)} da etapa anterior` : ""}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#eceeea]">
                      <div className="h-full rounded-full" style={{ width: `${(e.n / topo) * 100}%`, background: VERDE }} />
                    </div>
                    <p className="mt-1 text-[12.5px] leading-snug text-[#4d5b53]">{e.regra}</p>
                  </li>
                );
              })}
            </ol>

            {/* pergunta a pergunta */}
            <h2 className="mt-14 text-[22px] font-bold tracking-tight">Pergunta a pergunta</h2>
            <div className="mt-5 grid gap-x-10 gap-y-9 md:grid-cols-2">
              {PERGUNTAS.map((p) => {
                const c = contar(visiveis, p.id);
                const primeira = p.ordenada ? contarPrimeira(visiveis, p.id) : null;
                const maior = Math.max(...c, 1);
                const livres = p.escreve ? escritos(visiveis) : [];
                return (
                  <section key={p.id}>
                    <h3 className="text-[16px] font-semibold leading-snug">{p.titulo}</h3>
                    {p.tipo === "multipla" && (
                      <p className="mt-0.5 text-[12.5px] text-[#4d5b53]">
                        {p.ordenada
                          ? "Cada pessoa podia marcar vários, do maior para o menor. “Principal” é o primeiro que tocou."
                          : "Cada pessoa podia marcar mais de uma."}
                      </p>
                    )}
                    <ul className="mt-3 space-y-2">
                      {p.opcoes.map((o, i) => (
                        <li key={i}>
                          <div className="flex items-baseline justify-between gap-3 text-[14px]">
                            <span className="leading-snug">{o.rotulo}</span>
                            <span className="shrink-0 tabular-nums text-[#4d5b53]">
                              {primeira ? `${primeira[i]} principal · ` : ""}
                              {c[i]}
                              {primeira ? " citados" : ""} · {visiveis.length ? pct(c[i] / visiveis.length) : "—"}
                            </span>
                          </div>
                          <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-[#eceeea]">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{ width: `${(c[i] / maior) * 100}%`, background: primeira ? "#9fd3b6" : VERDE }}
                            />
                            {primeira && (
                              <div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{ width: `${(primeira[i] / maior) * 100}%`, background: VERDE }}
                              />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {livres.length > 0 && (
                      <p className="mt-3 text-[13.5px] leading-relaxed text-[#4d5b53]">
                        <strong className="font-semibold text-[#111814]">Escreveram em “Outras”:</strong>{" "}
                        {livres.map((l) => `${l.texto}${l.n > 1 ? ` (${l.n})` : ""}`).join(", ")}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-16 max-w-[66ch] text-[13px] leading-relaxed text-[#4d5b53]">
          Como ler: a pesquisa circula por indicação no WhatsApp, então quem responde tende a ser mais digital e mais
          próximo de vocês do que o produtor médio. Ela mede o que o produtor já vive, paga e sofre, e não o que diria
          de um serviço que ainda não conhece. Serve para validar hipótese e achar o que perguntar a seguir, não para
          dizer o tamanho do mercado. Os intervalos são de confiança de 95% (método de Wilson).
        </p>
      </main>
    </div>
  );
}
