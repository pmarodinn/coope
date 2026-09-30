"use client";

import { useEffect, useRef, useState } from "react";
import { Icone, Logo } from "@/components/ui";
import { PESQUISA, linkIndicar, linkWhatsapp } from "@/lib/pesquisa-config";
import {
  PERGUNTAS,
  VERSAO,
  codificar,
  dicaDe,
  filtrarEscrito,
  montarMensagem,
  novoNonce,
  respostaValida,
  type Pergunta,
  type Respostas,
} from "@/lib/pesquisa";

/**
 * Pesquisa com produtores, pensada para o polegar.
 *
 * Uma pergunta por tela, só escolhas fechadas, e toque único avança. O que pede
 * mais de um toque (múltipla escolha) ganha um botão fixo embaixo, onde o
 * polegar já está. Onde a ordem importa (estados, culturas), o número do toque
 * aparece dentro da opção. O único campo de texto é o de "Outras" culturas, e só
 * aceita letras, até 24 caracteres: sem dígitos não há como digitar telefone ou CPF.
 */

const VERDE = "#0b7a4a"; // 5,4:1 sobre branco; o verde da marca (3,8:1) não passa em texto
const TOTAL = PERGUNTAS.length;
const K_RASCUNHO = "coope:pesquisa:rascunho";
const K_ENVIADO = "coope:pesquisa:enviado";
const ESCRITA = PERGUNTAS.find((p) => p.escreve);

type Envio = "manual" | "enviando" | "ok" | "falhou";

/* ---------------- armazenamento ---------------- */
// Safari com "bloquear todos os cookies" e navegadores em modo restrito lançam
// exceção só de tocar em localStorage. A pesquisa funciona sem ele.

const ler = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const gravar = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* segue sem guardar */
  }
};
const apagar = (k: string) => {
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* segue */
  }
};

interface Rascunho {
  passo: number;
  respostas: Respostas;
  escrito: string;
  nonce: number;
}

/** Só aceita do rascunho o que ainda é válido, e retoma na primeira pergunta em aberto. */
function lerRascunho(): Rascunho | null {
  const bruto = ler(K_RASCUNHO);
  if (!bruto) return null;
  try {
    const d = JSON.parse(bruto);
    if (d?.versao !== VERSAO) return null;

    const respostas: Respostas = {};
    for (const p of PERGUNTAS) if (respostaValida(p, d.respostas?.[p.id])) respostas[p.id] = d.respostas[p.id];
    if (Object.keys(respostas).length === 0) return null;

    const aberta = PERGUNTAS.findIndex((p) => respostas[p.id] === undefined);
    const escrito = typeof d.escrito === "string" && ESCRITA ? filtrarEscrito(d.escrito, ESCRITA.escreve!.max) : "";
    return {
      passo: aberta === -1 ? TOTAL - 1 : aberta,
      respostas,
      escrito,
      nonce: Number.isInteger(d.nonce) ? d.nonce : novoNonce(),
    };
  } catch {
    return null;
  }
}

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    /* cai no plano B */
  }
  try {
    const t = document.createElement("textarea");
    t.value = texto;
    t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(t);
    t.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(t);
    return ok;
  } catch {
    return false;
  }
}

const reduzMovimento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/* ---------------- peças ---------------- */

function Opcao({
  p,
  i,
  marcada,
  posicao,
  bloqueada,
  aoTocar,
}: {
  p: Pergunta;
  i: number;
  marcada: boolean;
  /** Nas perguntas ordenadas, o número do toque (1 é o maior). */
  posicao?: number;
  bloqueada: boolean;
  aoTocar: (i: number) => void;
}) {
  const multipla = p.tipo === "multipla";
  const grade = p.colunas === 3;

  const base =
    "flex w-full items-center rounded-2xl border text-left leading-snug transition-colors duration-100 [-webkit-tap-highlight-color:transparent] " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7a4a] ";

  const formato = grade
    ? "min-h-[56px] justify-center px-2 text-[17px] font-semibold "
    : p.colunas === 2
      ? "min-h-[64px] gap-3 px-3.5 py-3 text-[16px] "
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
      className={base + formato + cor + "relative " + (bloqueada ? "opacity-45" : "")}
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
      {grade && posicao && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-[12px] font-bold leading-none text-[#0b7a4a]"
        >
          {posicao}
        </span>
      )}
    </button>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-white text-[#111814]"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      <div className="mx-auto flex min-h-screen min-h-[100dvh] w-full max-w-[480px] flex-col">{children}</div>
    </div>
  );
}

/* ---------------- página ---------------- */

export default function Pesquisa() {
  const [passo, setPasso] = useState(-1); // -1 abertura · 0..TOTAL-1 perguntas · TOTAL fim
  const [respostas, setRespostas] = useState<Respostas>({});
  const [escrito, setEscrito] = useState("");
  const [nonce, setNonce] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [jaRespondeu, setJaRespondeu] = useState(false);
  const [pronto, setPronto] = useState(false);

  const [envio, setEnvio] = useState<Envio>("manual");
  const [mensagem, setMensagem] = useState("");
  const [codigo, setCodigo] = useState("");
  const [copiou, setCopiou] = useState<"sim" | "nao" | null>(null);
  const [urlPesquisa, setUrlPesquisa] = useState("");

  const titulo = useRef<HTMLHeadingElement>(null);
  const blocoEscrito = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const primeiraVez = useRef(true);

  // Só lê o armazenamento depois de montar: o HTML do servidor precisa bater com o primeiro render.
  useEffect(() => {
    setRascunho(lerRascunho());
    setJaRespondeu(ler(K_ENVIADO) !== null);
    setUrlPesquisa(window.location.href.split(/[?#]/)[0]);
    setPronto(true);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!pronto || passo < 0 || passo >= TOTAL || Object.keys(respostas).length === 0) return;
    gravar(K_RASCUNHO, JSON.stringify({ versao: VERSAO, passo, respostas, escrito, nonce }));
  }, [pronto, passo, respostas, escrito, nonce]);

  // Quando "Outras" é marcada o campo de texto aparece logo abaixo; garante que ele apareça na tela.
  const atual = passo >= 0 && passo < TOTAL ? PERGUNTAS[passo] : null;
  const escritaAberta =
    !!atual?.escreve && Array.isArray(respostas[atual.id]) && (respostas[atual.id] as number[]).includes(atual.escreve.opcao);
  useEffect(() => {
    if (escritaAberta) blocoEscrito.current?.scrollIntoView({ block: "nearest", behavior: reduzMovimento() ? "auto" : "smooth" });
  }, [escritaAberta]);

  // A cada tela nova: volta ao topo e leva o foco ao título, para leitor de tela e teclado.
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    titulo.current?.focus({ preventScroll: true });
  }, [passo]);

  const limparTimer = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  function comecar() {
    limparTimer();
    setRespostas({});
    setEscrito("");
    setNonce(novoNonce());
    setPasso(0);
  }

  function retomar() {
    if (!rascunho) return;
    setRespostas(rascunho.respostas);
    setEscrito(rascunho.escrito);
    setNonce(rascunho.nonce);
    setPasso(rascunho.passo);
  }

  function voltar() {
    limparTimer();
    setPasso((p) => Math.max(-1, p - 1));
  }

  async function finalizar() {
    const n = nonce ?? novoNonce();
    const cod = codificar(respostas, n, escrito);
    const msg = montarMensagem(respostas, cod, escrito);
    const hoje = new Date().toISOString().slice(0, 10);

    setCodigo(cod);
    setMensagem(msg);
    apagar(K_RASCUNHO);
    gravar(K_ENVIADO, JSON.stringify({ codigo: cod, quando: hoje }));
    setJaRespondeu(true);
    setPasso(TOTAL);

    if (!PESQUISA.endpoint) {
      setEnvio("manual");
      return;
    }

    setEnvio("enviando");
    const ctl = new AbortController();
    const espera = window.setTimeout(() => ctl.abort(), 10_000);
    try {
      const r = await fetch(PESQUISA.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...PESQUISA.camposExtras, versao: VERSAO, data: hoje, codigo: cod, mensagem: msg }),
        signal: ctl.signal,
      });
      setEnvio(r.ok ? "ok" : "falhou");
    } catch {
      setEnvio("falhou");
    } finally {
      window.clearTimeout(espera);
    }
  }

  function tocar(p: Pergunta, indice: number) {
    const atual = respostas[p.id];

    if (p.tipo === "unica") {
      setRespostas((r) => ({ ...r, [p.id]: indice }));

      // O toque já é a resposta: avança sozinho. A última pergunta espera o botão,
      // para um toque sem querer não enviar a pesquisa.
      if (passo < TOTAL - 1) {
        limparTimer();
        const daqui = passo;
        timer.current = window.setTimeout(() => setPasso((x) => (x === daqui ? x + 1 : x)), reduzMovimento() ? 0 : 280);
      }
      return;
    }

    const marcadas = Array.isArray(atual) ? atual : [];
    let novas: number[];

    if (p.ordenada) {
      // A ordem dos toques é a resposta: desmarcar tira da fila e os de trás sobem.
      if (marcadas.includes(indice)) novas = marcadas.filter((x) => x !== indice);
      else if (p.max !== undefined && marcadas.length >= p.max) return;
      else novas = [...marcadas, indice];
    } else {
      if (marcadas.includes(indice)) novas = marcadas.filter((x) => x !== indice);
      else if (p.opcoes[indice].exclusiva) novas = [indice];
      else novas = [...marcadas.filter((x) => !p.opcoes[x].exclusiva), indice];
      novas.sort((a, b) => a - b);
    }

    setRespostas((r) => ({ ...r, [p.id]: novas }));
    // Desmarcou "Outras": o que tinha escrito deixa de valer.
    if (p.escreve && indice === p.escreve.opcao && !novas.includes(indice)) setEscrito("");
  }

  async function aoCopiar() {
    setCopiou((await copiar(mensagem)) ? "sim" : "nao");
    window.setTimeout(() => setCopiou(null), 2500);
  }

  /* ---------- abertura ---------- */
  if (passo === -1) {
    return (
      <Moldura>
        <main className="flex flex-1 flex-col px-6 pb-10 pt-10">
          <Logo size={44} />

          <h1 className="mt-10 text-[34px] font-bold leading-[1.08] tracking-tight">Pesquisa rápida para quem produz</h1>
          <p className="mt-4 text-[18px] leading-snug text-[#4d5b53]">
            {TOTAL} perguntas sobre como você toca a fazenda hoje. Cerca de 3 minutos.
          </p>

          <ul className="mt-9 space-y-4">
            {["Sem nome, CPF ou telefone.", "É só escolher, quase sem digitar.", "Dá para parar e continuar depois."].map(
              (t) => (
                <li key={t} className="flex items-center gap-3.5 text-[17px]">
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: VERDE }}
                  >
                    <Icone nome="check" tamanho={14} />
                  </span>
                  {t}
                </li>
              ),
            )}
          </ul>

          {jaRespondeu && pronto && !rascunho && (
            <p className="mt-8 rounded-2xl bg-[#f3f5f1] px-4 py-3.5 text-[15px] leading-snug text-[#4d5b53]">
              Você já respondeu neste aparelho. Obrigado! Se quiser, pode responder de novo.
            </p>
          )}

          <div className="mt-auto pt-10">
            {rascunho ? (
              <>
                <button
                  type="button"
                  onClick={retomar}
                  className="h-14 w-full rounded-2xl text-[17px] font-semibold text-white"
                  style={{ background: VERDE }}
                >
                  Continuar de onde parei
                </button>
                <button
                  type="button"
                  onClick={comecar}
                  className="mt-2 h-12 w-full rounded-2xl text-[16px] font-medium text-[#4d5b53]"
                >
                  Começar de novo
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={comecar}
                className="h-14 w-full rounded-2xl text-[17px] font-semibold text-white"
                style={{ background: VERDE }}
              >
                Começar
              </button>
            )}

            <details className="mt-6 text-[14px] leading-relaxed text-[#4d5b53]">
              <summary className="cursor-pointer py-1 font-medium">Como usamos as respostas</summary>
              <p className="mt-2">
                Somamos as respostas de vários produtores para entender o que o campo precisa em imposto, crédito e
                seguro. O formulário não coleta nome, CPF nem telefone. Se você enviar pelo WhatsApp, o seu número
                aparece para quem recebe a mensagem; o código das respostas, não.
              </p>
            </details>
          </div>
        </main>
      </Moldura>
    );
  }

  /* ---------- fim ---------- */
  if (passo >= TOTAL) {
    const enviado = envio === "ok";
    return (
      <Moldura>
        <main className="flex flex-1 flex-col px-6 pb-10 pt-14">
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-full text-white"
            style={{ background: VERDE }}
          >
            <Icone nome="check" tamanho={30} />
          </span>

          <h1 ref={titulo} tabIndex={-1} className="mt-8 text-[32px] font-bold leading-[1.1] tracking-tight outline-none">
            {enviado ? "Recebemos. Obrigado!" : "Pronto. Obrigado!"}
          </h1>

          {envio === "enviando" && <p className="mt-4 text-[18px] text-[#4d5b53]">Enviando suas respostas…</p>}

          {enviado && <p className="mt-4 text-[18px] leading-snug text-[#4d5b53]">Suas respostas chegaram até nós.</p>}

          {(envio === "manual" || envio === "falhou") && (
            <>
              <p className="mt-4 text-[18px] leading-snug text-[#4d5b53]">
                {envio === "falhou"
                  ? "Não conseguimos enviar pela internet. Mande pelo WhatsApp: toque no botão e depois em enviar."
                  : "Falta só um passo: toque no botão e depois em enviar no WhatsApp."}
              </p>

              <a
                href={linkWhatsapp(mensagem)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 grid h-14 w-full place-items-center rounded-2xl text-[17px] font-semibold text-white"
                style={{ background: VERDE }}
              >
                Enviar pelo WhatsApp
              </a>

              <button
                type="button"
                onClick={aoCopiar}
                className="mt-2 h-12 w-full rounded-2xl text-[16px] font-medium text-[#4d5b53]"
              >
                {copiou === "sim" ? "Copiado" : copiou === "nao" ? "Não deu para copiar" : "Copiar as respostas"}
              </button>

              <p className="mt-4 text-[14px] leading-relaxed text-[#4d5b53]">
                No WhatsApp, o seu número aparece para quem recebe. O código das respostas não tem nome nem telefone.
              </p>
            </>
          )}

          <details className="mt-8 text-[14px] text-[#4d5b53]">
            <summary className="cursor-pointer py-1 font-medium">Ver o que será enviado</summary>
            <pre className="mt-2 select-all whitespace-pre-wrap break-words rounded-2xl bg-[#f3f5f1] p-4 text-[13px] leading-relaxed text-[#111814]">
              {mensagem}
            </pre>
          </details>

          <div className="mt-auto pt-12">
            <p className="text-[16px] font-semibold">Conhece outro produtor?</p>
            <a
              href={linkIndicar(urlPesquisa)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block py-2 text-[16px] font-medium underline underline-offset-4"
              style={{ color: VERDE }}
            >
              Mandar a pesquisa pelo WhatsApp
            </a>
          </div>
        </main>
      </Moldura>
    );
  }

  /* ---------- pergunta ---------- */
  const p = PERGUNTAS[passo];
  const dica = dicaDe(p, respostas);
  const valor = respostas[p.id];
  const marcadas = Array.isArray(valor) ? valor : typeof valor === "number" ? [valor] : [];
  const multipla = p.tipo === "multipla";
  const cheio = multipla && p.max !== undefined && marcadas.length >= p.max;
  const ultima = passo === TOTAL - 1;
  const precisaBotao = multipla || ultima;
  const respondida = respostaValida(p, valor);

  return (
    <Moldura>
      <header className="sticky top-0 z-10 bg-white">
        <div className="flex h-14 items-center justify-between px-2">
          <button
            type="button"
            onClick={voltar}
            aria-label="Voltar"
            className="grid h-11 w-11 place-items-center rounded-full text-[#111814] [-webkit-tap-highlight-color:transparent] active:bg-[#f0f2ee]"
          >
            <Icone nome="voltar" tamanho={22} />
          </button>
          <span className="pr-4 text-[15px] tabular-nums text-[#4d5b53]">
            {passo + 1} de {TOTAL}
          </span>
        </div>
        <div className="h-[3px] bg-[#e9ece7]" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={passo + 1}>
          <div className="h-full transition-[width] duration-300" style={{ width: `${((passo + 1) / TOTAL) * 100}%`, background: VERDE }} />
        </div>
      </header>

      <main key={passo} className="flex-1 px-5 pb-8 pt-7 [animation:rise_.3s_ease-out_both]">
        <h1 ref={titulo} tabIndex={-1} className="text-[26px] font-bold leading-[1.15] tracking-tight outline-none">
          {p.titulo}
        </h1>
        {dica && <p className="mt-2.5 text-[16px] leading-snug text-[#4d5b53]">{dica}</p>}

        <div
          role={multipla ? "group" : "radiogroup"}
          aria-label={p.titulo}
          className={`mt-6 grid gap-2.5 ${p.colunas === 3 ? "grid-cols-3" : p.colunas === 2 ? "grid-cols-2" : ""}`}
        >
          {p.opcoes.map((_, i) => {
            const marcada = marcadas.includes(i);
            return (
              <Opcao
                key={i}
                p={p}
                i={i}
                marcada={marcada}
                posicao={p.ordenada && marcada ? marcadas.indexOf(i) + 1 : undefined}
                bloqueada={cheio && !marcada && !p.opcoes[i].exclusiva}
                aoTocar={(x) => tocar(p, x)}
              />
            );
          })}
        </div>

        {p.escreve && escritaAberta && (
          // scroll-mb: o botão fixo de baixo cobre ~180px; sem a margem, o rolar
          // automático deixava o campo escondido atrás dele.
          <div ref={blocoEscrito} className="mt-6 scroll-mb-48 [animation:rise_.25s_ease-out_both]">
            <label htmlFor="escrito" className="text-[17px] font-semibold">
              {p.escreve.rotulo}
            </label>
            <input
              id="escrito"
              type="text"
              value={escrito}
              maxLength={p.escreve.max}
              onChange={(e) => setEscrito(filtrarEscrito(e.target.value, p.escreve!.max))}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              placeholder={p.escreve.exemplo}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              className="mt-2 h-14 w-full rounded-2xl border border-[#dde2db] bg-white px-4 text-[17px] outline-none focus:border-[#0b7a4a] focus:ring-1 focus:ring-[#0b7a4a]"
            />
            <p className="mt-1.5 text-[14px] text-[#4d5b53]">Só letras, até {p.escreve.max} caracteres. Se preferir, deixe em branco.</p>
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          Pergunta {passo + 1} de {TOTAL}
        </p>
      </main>

      {precisaBotao && (
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
            className="h-14 w-full rounded-2xl text-[17px] font-semibold text-white disabled:bg-[#cdd5cd]"
            style={respondida ? { background: VERDE } : undefined}
          >
            {ultima ? "Finalizar" : "Continuar"}
          </button>
        </div>
      )}
    </Moldura>
  );
}
