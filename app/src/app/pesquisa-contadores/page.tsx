"use client";

import { useEffect, useRef, useState } from "react";
import { Icone, Logo } from "@/components/ui";
import { asset } from "@/lib/asset";
import { UFS } from "@/lib/contador-lead";
import {
  apagar,
  calcularModo,
  celularLocal,
  celularValido,
  enviar,
  filtrarNome,
  formatarCelular,
  gravar,
  guardarTeste,
  ler,
  MAX_NOME,
  nomeValido,
  type Modo,
  type Pacote,
} from "@/lib/pesquisa-envio";
import {
  montarC,
  PERGUNTAS_C,
  PESQUISA_CONTADORES,
  respondidaC,
  type PerguntaC,
  type RespostasC,
} from "@/lib/pesquisa-contadores";

/**
 * Pesquisa com escritórios de contabilidade. Uma pergunta por tela, só toques.
 * Ao terminar, grava sozinha no Firestore e leva ao pré-cadastro (/contadores)
 * com o que já se sabe preenchido.
 */

const VERDE = "#0b7a4a";
const ERRO = "#b42318";
const TOTAL = PERGUNTAS_C.length;
const FIM = TOTAL + 1;
const ESPERA_REDIRECIONAR = 4;

const K_RASCUNHO = "coope:pesquisa-contadores:rascunho";
const K_RASCUNHO_CADASTRO = "coope:contadores:rascunho";

interface Rascunho {
  versao: number;
  passo: number;
  respostas: RespostasC;
  nome: string;
  celular: string;
  aceite: boolean;
}

type Estado = "enviando" | "ok" | "teste" | "falhou";

const reduzMovimento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function lerRascunho(): Rascunho | null {
  try {
    const d = JSON.parse(ler(K_RASCUNHO) ?? "null") as Rascunho | null;
    if (!d || d.versao !== PESQUISA_CONTADORES.versao) return null;
    const respostas: RespostasC = {};
    for (const p of PERGUNTAS_C) if (respondidaC(p, d.respostas?.[p.id])) respostas[p.id] = d.respostas[p.id];
    return { ...d, respostas };
  } catch {
    return null;
  }
}

/**
 * Leva para o pré-cadastro o que a pesquisa já respondeu, nas opções que
 * existem lá também. O que não tem par fica para a pessoa escolher.
 */
function preencherCadastro(nome: string, celular: string, r: RespostasC) {
  let atual: Record<string, unknown> = {};
  try {
    atual = JSON.parse(ler(K_RASCUNHO_CADASTRO) ?? "{}");
  } catch {
    /* começa vazio */
  }
  const uf = String(r.uf ?? "").toUpperCase();
  const produtores = { ate10: "ate10", "11a30": "11a30" }[String(r.produtores)];
  const contribuintes = { nenhum: "nenhum", "1a5": "1a5", "6a15": "6a15", nao_sabe: "nao_sei" }[String(r.acima36)];
  const pre: Record<string, unknown> = {
    nome,
    celular: formatarCelular(celular),
    equipe: r.equipe,
    software: r.sistema,
    ...(UFS.includes(uf) ? { uf } : {}),
    ...(produtores ? { produtores } : {}),
    ...(contribuintes ? { contribuintes } : {}),
  };
  gravar(K_RASCUNHO_CADASTRO, JSON.stringify({ ...atual, ...pre }));
}

/* ---------------- peças ---------------- */

function Opcao({
  p,
  i,
  marcada,
  posicao,
  bloqueada,
  aoTocar,
}: {
  p: PerguntaC;
  i: number;
  marcada: boolean;
  posicao?: number;
  bloqueada: boolean;
  aoTocar: (i: number) => void;
}) {
  const multipla = p.tipo === "multipla";
  const grade = p.colunas === 3;
  const base =
    "relative flex w-full items-center rounded-2xl border text-left leading-snug transition-colors duration-100 [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7a4a] ";
  const formato = grade
    ? "min-h-[56px] justify-center px-2 text-[17px] font-semibold "
    : p.colunas === 2
      ? "min-h-[60px] gap-3 px-3.5 py-3 text-[16px] "
      : "min-h-[60px] gap-3.5 px-4 py-3 text-[17px] ";
  const cor = marcada
    ? grade
      ? "border-[#0b7a4a] bg-[#0b7a4a] text-white "
      : "border-[#0b7a4a] bg-[#eef7f1] "
    : "border-[#dde2db] bg-white active:bg-[#f3f5f1] ";

  return (
    <button
      type="button"
      role={multipla ? "checkbox" : "radio"}
      aria-checked={marcada}
      aria-disabled={bloqueada || undefined}
      aria-label={posicao ? `${p.opcoes[i].rotulo}, ${posicao}º escolhido` : undefined}
      onClick={() => !bloqueada && aoTocar(i)}
      className={base + formato + cor + (bloqueada ? "opacity-45" : "")}
    >
      {!grade && (
        <span
          aria-hidden
          className={`grid h-[22px] w-[22px] shrink-0 place-items-center border-2 text-[13px] font-bold leading-none text-white ${
            multipla ? "rounded-md" : "rounded-full"
          } ${marcada ? "border-[#0b7a4a] bg-[#0b7a4a]" : "border-[#b9c2b8] bg-white"}`}
        >
          {marcada && (posicao ? posicao : <Icone nome="check" tamanho={13} />)}
        </span>
      )}
      <span>{p.opcoes[i].rotulo}</span>
    </button>
  );
}

function Moldura({ children, teste }: { children: React.ReactNode; teste?: boolean }) {
  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-white text-[#111814]"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      {teste && (
        <p role="status" className="bg-[#fff4d6] px-4 py-2 text-center text-[14px] font-medium text-[#6b4a00]">
          Modo de teste: nada é enviado, fica só neste aparelho.
        </p>
      )}
      <div className="mx-auto flex min-h-screen min-h-[100dvh] w-full max-w-[520px] flex-col">{children}</div>
    </div>
  );
}

function Topo({ voltar, passo }: { voltar: () => void; passo?: number }) {
  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="flex h-14 items-center justify-between px-2">
        <button
          type="button"
          onClick={voltar}
          aria-label="Voltar"
          className="grid h-11 w-11 place-items-center rounded-full [-webkit-tap-highlight-color:transparent] active:bg-[#f0f2ee]"
        >
          <Icone nome="voltar" tamanho={22} />
        </button>
        {passo !== undefined && (
          <span className="pr-4 text-[15px] tabular-nums text-[#4d5b53]">
            {passo} de {TOTAL}
          </span>
        )}
      </div>
      {passo !== undefined && (
        <div className="h-[3px] bg-[#e9ece7]" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={passo}>
          <div className="h-full transition-[width] duration-300" style={{ width: `${(passo / TOTAL) * 100}%`, background: VERDE }} />
        </div>
      )}
    </header>
  );
}

const CAMPO =
  "mt-2 h-14 w-full rounded-2xl border bg-white px-4 text-[17px] outline-none focus:border-[#0b7a4a] focus:ring-1 focus:ring-[#0b7a4a] ";

const BOTAO = "h-14 w-full rounded-2xl text-[17px] font-semibold text-white disabled:bg-[#cdd5cd]";

/* ---------------- página ---------------- */

export default function PesquisaContadores() {
  const [passo, setPasso] = useState(-1);
  const [respostas, setRespostas] = useState<RespostasC>({});
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [aceite, setAceite] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [modo, setModo] = useState<Modo | null>(null);
  const [estado, setEstado] = useState<Estado>("enviando");
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [contagem, setContagem] = useState(ESPERA_REDIRECIONAR);
  const [utm, setUtm] = useState({ utm_source: "", utm_content: "" });
  const titulo = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | null>(null);
  const primeiraVez = useRef(true);

  useEffect(() => {
    setModo(calcularModo());
    setRascunho(lerRascunho());
    const q = new URLSearchParams(window.location.search);
    const limpo = (k: string) => (q.get(k) ?? "").replace(/[^A-Za-z0-9 _.:/+-]/g, "").slice(0, 80);
    setUtm({ utm_source: limpo("utm_source"), utm_content: limpo("utm_content") });
  }, []);

  useEffect(() => {
    if (passo >= 0 && passo < FIM)
      gravar(K_RASCUNHO, JSON.stringify({ versao: PESQUISA_CONTADORES.versao, passo, respostas, nome, celular, aceite }));
  }, [passo, respostas, nome, celular, aceite]);

  // Foco no título a cada tela: leitor de tela anuncia a pergunta nova.
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    titulo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [passo]);

  useEffect(() => () => limparTimer(), []);

  // Salvou: conta alguns segundos e leva ao pré-cadastro.
  useEffect(() => {
    if (estado !== "ok" && estado !== "teste") return;
    if (contagem <= 0) {
      window.location.assign(asset("/contadores/") + "?utm_source=pesquisa&utm_content=pesquisa-contadores#cadastro");
      return;
    }
    const t = window.setTimeout(() => setContagem((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [estado, contagem]);

  function limparTimer() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }

  const teste = modo?.teste ?? false;

  function comecar() {
    apagar(K_RASCUNHO);
    setRespostas({});
    setPasso(0);
  }

  function retomar() {
    if (!rascunho) return;
    setRespostas(rascunho.respostas);
    setNome(rascunho.nome);
    setCelular(rascunho.celular);
    setAceite(rascunho.aceite);
    const aberta = PERGUNTAS_C.findIndex((p) => !respondidaC(p, rascunho.respostas[p.id]));
    setPasso(!nomeValido(rascunho.nome) || !celularValido(rascunho.celular) || !rascunho.aceite ? 0 : aberta === -1 ? TOTAL : aberta + 1);
  }

  function voltar() {
    limparTimer();
    setPasso((x) => Math.max(-1, x - 1));
  }

  function seguirDoContato() {
    setTentou(true);
    if (nomeValido(nome) && celularValido(celular) && aceite) setPasso(1);
  }

  async function tentarEnviar(p: Pacote) {
    setEstado("enviando");
    if (teste || !modo?.configurado) {
      guardarTeste(p);
      setEstado("teste");
      return;
    }
    const r = await enviar(p, PESQUISA_CONTADORES.colecao);
    setEstado(r === "ok" ? "ok" : "falhou");
  }

  async function finalizar() {
    const m = montarC({ nome, celular }, respostas, utm);
    setPacote(m);
    preencherCadastro(nome, celular, respostas);
    apagar(K_RASCUNHO);
    setContagem(ESPERA_REDIRECIONAR);
    setPasso(FIM);
    await tentarEnviar(m);
  }

  function tocar(p: PerguntaC, i: number) {
    const v = p.opcoes[i].v;
    if (p.tipo === "unica") {
      setRespostas((r) => ({ ...r, [p.id]: v }));
      // O toque já é a resposta. A última espera o botão, para um toque sem querer não enviar.
      if (passo < TOTAL) {
        limparTimer();
        const daqui = passo;
        timer.current = window.setTimeout(() => setPasso((x) => (x === daqui ? x + 1 : x)), reduzMovimento() ? 0 : 280);
      }
      return;
    }
    const atual = Array.isArray(respostas[p.id]) ? (respostas[p.id] as string[]) : [];
    let novas: string[];
    if (atual.includes(v)) novas = atual.filter((x) => x !== v);
    else if (p.opcoes[i].exclusiva) novas = [v];
    else {
      const sem = atual.filter((x) => !p.opcoes.find((op) => op.v === x)?.exclusiva);
      if (p.max !== undefined && sem.length >= p.max) return;
      novas = [...sem, v];
    }
    // Nas não ordenadas a ordem não diz nada: guarda na ordem das opções.
    if (!p.ordenada) novas.sort((a, b) => p.opcoes.findIndex((x) => x.v === a) - p.opcoes.findIndex((x) => x.v === b));
    setRespostas((r) => ({ ...r, [p.id]: novas }));
  }

  /* ---------- abertura ---------- */
  if (passo === -1) {
    const fechada = modo !== null && !modo.configurado && !modo.teste;
    return (
      <Moldura teste={teste}>
        <main className="flex flex-1 flex-col px-6 pb-10 pt-10">
          <Logo size={44} />
          <h1 className="mt-10 text-[34px] font-bold leading-[1.08] tracking-tight">
            Pesquisa com escritórios de contabilidade
          </h1>
          <p className="mt-4 text-[18px] leading-snug text-[#4d5b53]">
            {TOTAL} perguntas sobre como o seu escritório trabalha hoje. Cerca de 4 minutos.
          </p>
          <p className="mt-2 text-[16px] font-medium text-[#33413a]">Pesquisa organizada pela Coope.</p>

          <ul className="mt-9 space-y-4">
            {["É só escolher, quase sem digitar.", "Dá para parar e continuar depois.", "Não pedimos CNPJ nem dados de clientes."].map(
              (t) => (
                <li key={t} className="flex items-center gap-3.5 text-[17px]">
                  <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white" style={{ background: VERDE }}>
                    <Icone nome="check" tamanho={14} />
                  </span>
                  {t}
                </li>
              ),
            )}
          </ul>

          {fechada && (
            <p role="status" className="mt-8 rounded-2xl bg-[#f3f5f1] px-4 py-3.5 text-[15px] leading-snug text-[#4d5b53]">
              Esta pesquisa ainda não está aberta. Volte a abrir o link mais tarde.
            </p>
          )}

          <div className="mt-auto pt-10">
            {rascunho && !fechada ? (
              <>
                <button type="button" onClick={retomar} className={BOTAO} style={{ background: VERDE }}>
                  Continuar de onde parei
                </button>
                <button type="button" onClick={comecar} className="mt-2 h-12 w-full rounded-2xl text-[16px] font-medium text-[#4d5b53]">
                  Começar de novo
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={comecar}
                disabled={fechada || modo === null}
                className={BOTAO}
                style={!fechada && modo ? { background: VERDE } : undefined}
              >
                Começar
              </button>
            )}
            <details className="mt-6 text-[14px] leading-relaxed text-[#4d5b53]">
              <summary className="cursor-pointer py-1 font-medium">Como usamos as respostas</summary>
              <p className="mt-2">
                Esta pesquisa é organizada pela Coope. Pedimos seu nome e celular para a equipe da Coope poder falar com
                você depois. Somamos as respostas de vários escritórios para entender como a contabilidade trabalha e o
                que pesa na rotina.
              </p>
            </details>
          </div>
        </main>
      </Moldura>
    );
  }

  /* ---------- contato ---------- */
  if (passo === 0) {
    const erroNome = tentou && !nomeValido(nome);
    const erroCelular = tentou && !celularValido(celular);
    const erroAceite = tentou && !aceite;
    return (
      <Moldura teste={teste}>
        <Topo voltar={voltar} />
        <main key="contato" className="flex-1 px-5 pb-8 pt-4 [animation:rise_.3s_ease-out_both]">
          <h1 ref={titulo} tabIndex={-1} className="text-[26px] font-bold leading-[1.15] tracking-tight outline-none">
            Antes de começar
          </h1>
          <p className="mt-2.5 text-[16px] leading-snug text-[#4d5b53]">Para a equipe da Coope poder falar com você depois.</p>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              seguirDoContato();
            }}
            className="mt-7"
          >
            <label htmlFor="nome" className="text-[17px] font-semibold">
              Seu nome
            </label>
            <input
              id="nome"
              value={nome}
              maxLength={MAX_NOME}
              onChange={(e) => setNome(filtrarNome(e.target.value))}
              placeholder="Como você se chama"
              autoComplete="name"
              autoCapitalize="words"
              aria-invalid={erroNome || undefined}
              aria-describedby={erroNome ? "nome-erro" : undefined}
              className={CAMPO + (erroNome ? "border-[#b42318]" : "border-[#dde2db]")}
            />
            {erroNome && (
              <p id="nome-erro" role="alert" className="mt-1.5 text-[14px] font-medium" style={{ color: ERRO }}>
                Escreva seu nome.
              </p>
            )}

            <label htmlFor="celular" className="mt-6 block text-[17px] font-semibold">
              Seu celular
            </label>
            <input
              id="celular"
              type="tel"
              inputMode="numeric"
              value={formatarCelular(celular)}
              onChange={(e) => setCelular(celularLocal(e.target.value))}
              placeholder="(65) 99999-9999"
              autoComplete="tel-national"
              aria-invalid={erroCelular || undefined}
              aria-describedby={erroCelular ? "celular-erro" : "celular-dica"}
              className={CAMPO + (erroCelular ? "border-[#b42318]" : "border-[#dde2db]")}
            />
            {erroCelular ? (
              <p id="celular-erro" role="alert" className="mt-1.5 text-[14px] font-medium" style={{ color: ERRO }}>
                Confira o número: DDD e 9 dígitos, como (65) 99999-9999.
              </p>
            ) : (
              <p id="celular-dica" className="mt-1.5 text-[14px] text-[#4d5b53]">
                Com DDD. De preferência o que tem WhatsApp.
              </p>
            )}

            <button
              type="button"
              role="checkbox"
              aria-checked={aceite}
              onClick={() => setAceite((a) => !a)}
              className={`mt-7 flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left [-webkit-tap-highlight-color:transparent] ${
                aceite ? "border-[#0b7a4a] bg-[#eef7f1]" : erroAceite ? "border-[#b42318] bg-white" : "border-[#dde2db] bg-white"
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border-2 text-white ${
                  aceite ? "border-[#0b7a4a] bg-[#0b7a4a]" : "border-[#b9c2b8] bg-white"
                }`}
              >
                {aceite && <Icone nome="check" tamanho={13} />}
              </span>
              <span className="text-[15px] leading-snug">
                Autorizo a Coope, que organiza esta pesquisa, a guardar meu nome, celular e respostas para estudar como os
                escritórios trabalham e entrar em contato comigo.
              </span>
            </button>
            {erroAceite && (
              <p role="alert" className="mt-1.5 text-[14px] font-medium" style={{ color: ERRO }}>
                Marque a caixa para continuar.
              </p>
            )}
            <button type="submit" className="sr-only" tabIndex={-1}>
              Continuar
            </button>
          </form>
        </main>
        <div className="sticky bottom-0 border-t border-[#eceeea] bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={seguirDoContato} className={BOTAO} style={{ background: VERDE }}>
            Continuar
          </button>
        </div>
      </Moldura>
    );
  }

  /* ---------- fim ---------- */
  if (passo >= FIM) {
    const salvo = estado === "ok" || estado === "teste";
    const destino = asset("/contadores/") + "?utm_source=pesquisa&utm_content=pesquisa-contadores#cadastro";
    return (
      <Moldura teste={teste}>
        <main className="flex flex-1 flex-col px-6 pb-10 pt-14">
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-full text-white"
            style={{ background: estado === "falhou" ? "#8a6d1a" : VERDE }}
          >
            {estado === "falhou" ? <span className="text-[34px] font-bold leading-none">!</span> : <Icone nome="check" tamanho={30} />}
          </span>
          <h1 ref={titulo} tabIndex={-1} className="mt-8 text-[32px] font-bold leading-[1.1] tracking-tight outline-none">
            {salvo ? "Obrigado pelas respostas!" : estado === "falhou" ? "Ainda não salvamos" : "Salvando…"}
          </h1>
          <div aria-live="polite" className="mt-4 text-[18px] leading-snug text-[#4d5b53]">
            {estado === "enviando" && <p>Guardando suas respostas. Só um instante.</p>}
            {salvo && (
              <p>
                {teste ? "Modo de teste: nada foi enviado. " : ""}Em {contagem} {contagem === 1 ? "segundo" : "segundos"} você vai
                para o pré-cadastro do escritório, já com seus dados preenchidos.
              </p>
            )}
            {estado === "falhou" && <p>Parece que a internet falhou. Suas respostas estão guardadas aqui. Toque para tentar de novo.</p>}
          </div>
          {estado === "falhou" && pacote && (
            <button type="button" onClick={() => void tentarEnviar(pacote)} className={`mt-6 ${BOTAO}`} style={{ background: VERDE }}>
              Tentar de novo
            </button>
          )}
          {salvo && (
            <a href={destino} className={`mt-8 grid place-items-center ${BOTAO}`} style={{ background: VERDE }}>
              Ir agora
            </a>
          )}
        </main>
      </Moldura>
    );
  }

  /* ---------- pergunta ---------- */
  const p = PERGUNTAS_C[passo - 1];
  const valor = respostas[p.id];
  const marcadas = Array.isArray(valor) ? valor : typeof valor === "string" ? [valor] : [];
  const multipla = p.tipo === "multipla";
  const cheio = multipla && p.max !== undefined && marcadas.length >= p.max;
  const ultima = passo === TOTAL;
  const respondida = respondidaC(p, valor);

  return (
    <Moldura teste={teste}>
      <Topo voltar={voltar} passo={passo} />
      <main key={passo} className="flex-1 px-5 pb-8 pt-7 [animation:rise_.3s_ease-out_both]">
        <h1 ref={titulo} tabIndex={-1} className="text-[26px] font-bold leading-[1.15] tracking-tight outline-none">
          {p.titulo}
        </h1>
        {p.dica && <p className="mt-2.5 text-[16px] leading-snug text-[#4d5b53]">{p.dica}</p>}
        <div
          role={multipla ? "group" : "radiogroup"}
          aria-label={p.titulo}
          className={`mt-6 grid gap-2.5 ${p.colunas === 3 ? "grid-cols-3" : p.colunas === 2 ? "grid-cols-2" : ""}`}
        >
          {p.opcoes.map((op, i) => {
            const marcada = marcadas.includes(op.v);
            return (
              <Opcao
                key={op.v}
                p={p}
                i={i}
                marcada={marcada}
                posicao={p.ordenada && marcada ? marcadas.indexOf(op.v) + 1 : undefined}
                bloqueada={cheio && !marcada && !op.exclusiva}
                aoTocar={(x) => tocar(p, x)}
              />
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          Pergunta {passo} de {TOTAL}
        </p>
      </main>

      {(multipla || ultima) && (
        <div className="sticky bottom-0 border-t border-[#eceeea] bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          {p.max !== undefined && (
            <p className="mb-2 text-center text-[14px] tabular-nums text-[#4d5b53]">
              {cheio ? `Você já escolheu ${p.max}. Desmarque uma para trocar.` : `${marcadas.length} de ${p.max} escolhidas`}
            </p>
          )}
          <button
            type="button"
            disabled={!respondida}
            onClick={ultima ? finalizar : () => setPasso(passo + 1)}
            className={BOTAO}
            style={respondida ? { background: VERDE } : undefined}
          >
            {ultima ? "Finalizar" : "Continuar"}
          </button>
        </div>
      )}
    </Moldura>
  );
}
