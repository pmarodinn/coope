"use client";

import { useEffect, useRef, useState } from "react";
import { Icone, Logo } from "@/components/ui";
import { PESQUISA, linkIndicar } from "@/lib/pesquisa-config";
import {
  PERGUNTAS,
  VERSAO,
  dicaDe,
  filtrarEscrito,
  novoNonce,
  respostaValida,
  type Pergunta,
  type Respostas,
} from "@/lib/pesquisa";
import {
  K_ENVIADO,
  K_RASCUNHO,
  MAX_NOME,
  apagar,
  calcularModo,
  celularLocal,
  celularValido,
  enviar,
  filtrarNome,
  formatarCelular,
  gravar,
  guardarPendente,
  guardarTeste,
  ler,
  lerPendente,
  limparPendente,
  nomeValido,
  type Modo,
  type Pacote,
} from "@/lib/pesquisa-envio";
import { montarRegistro } from "@/lib/pesquisa-registro";

/**
 * Pesquisa com produtores, pensada para o polegar.
 *
 * Primeiro o contato (nome e celular, para a equipe falar depois), depois uma
 * pergunta por tela, só escolhas fechadas, e toque único avança. O que pede mais
 * de um toque (múltipla escolha) ganha um botão fixo embaixo, onde o polegar já
 * está. Onde a ordem importa (estados, culturas), o número do toque aparece
 * dentro da opção. O único campo de texto livre das perguntas é o de "Outras"
 * culturas, e só aceita letras, até 24 caracteres.
 *
 * Ao terminar, o registro é gravado sozinho no banco. Se a rede falhar, ele fica
 * guardado no aparelho e é reenviado na próxima vez que a página abrir.
 */

const VERDE = "#0b7a4a"; // 5,4:1 sobre branco; o verde da marca (3,8:1) não passa em texto
const ERRO = "#b42318"; // 6,5:1 sobre branco
const TOTAL = PERGUNTAS.length;
const FIM = TOTAL + 1;
const ESCRITA = PERGUNTAS.find((p) => p.escreve);

// Passos: -1 abertura · 0 contato · 1..TOTAL perguntas · FIM fim

type Estado = "enviando" | "ok" | "falhou" | "teste";

/* ---------------- rascunho ---------------- */

interface Rascunho {
  passo: number;
  respostas: Respostas;
  escrito: string;
  nonce: number;
  nome: string;
  celular: string;
  aceite: boolean;
}

/** Só aceita do rascunho o que ainda é válido, e retoma no primeiro passo em aberto. */
function lerRascunho(): Rascunho | null {
  const bruto = ler(K_RASCUNHO);
  if (!bruto) return null;
  try {
    const d = JSON.parse(bruto);
    if (d?.versao !== VERSAO) return null;

    const respostas: Respostas = {};
    for (const p of PERGUNTAS) if (respostaValida(p, d.respostas?.[p.id])) respostas[p.id] = d.respostas[p.id];

    const nome = typeof d.nome === "string" ? filtrarNome(d.nome) : "";
    const celular = typeof d.celular === "string" ? celularLocal(d.celular) : "";
    const aceite = d.aceite === true;
    if (Object.keys(respostas).length === 0 && !nome && !celular) return null;

    const contatoPronto = nomeValido(nome) && celularValido(celular) && aceite;
    const aberta = PERGUNTAS.findIndex((p) => respostas[p.id] === undefined);
    const escrito = typeof d.escrito === "string" && ESCRITA ? filtrarEscrito(d.escrito, ESCRITA.escreve!.max) : "";

    return {
      passo: !contatoPronto ? 0 : aberta === -1 ? TOTAL : aberta + 1,
      respostas,
      escrito,
      nonce: Number.isInteger(d.nonce) ? d.nonce : novoNonce(),
      nome,
      celular,
      aceite,
    };
  } catch {
    return null;
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
      <div className="mx-auto flex min-h-screen min-h-[100dvh] w-full max-w-[480px] flex-col">{children}</div>
    </div>
  );
}

const CAMPO =
  "mt-2 h-14 w-full rounded-2xl border bg-white px-4 text-[17px] outline-none focus:border-[#0b7a4a] focus:ring-1 focus:ring-[#0b7a4a] ";

/** Quem o produtor procura para apagar os dados dele. */
const canalPrivacidade = () => PESQUISA.contatoPrivacidade || "fale com quem te enviou o link";

/* ---------------- página ---------------- */

export default function Pesquisa() {
  const [passo, setPasso] = useState(-1);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [escrito, setEscrito] = useState("");
  const [nonce, setNonce] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState(""); // só dígitos; a máscara é feita na exibição
  const [aceite, setAceite] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [visto, setVisto] = useState({ nome: false, celular: false });

  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [jaRespondeu, setJaRespondeu] = useState(false);
  const [modo, setModo] = useState<Modo | null>(null);

  const [estado, setEstado] = useState<Estado>("enviando");
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [linhas, setLinhas] = useState<string[]>([]);
  const [urlPesquisa, setUrlPesquisa] = useState("");

  const titulo = useRef<HTMLHeadingElement>(null);
  const blocoEscrito = useRef<HTMLDivElement>(null);
  const campoNome = useRef<HTMLInputElement>(null);
  const campoCelular = useRef<HTMLInputElement>(null);
  const botaoAceite = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const primeiraVez = useRef(true);
  const enviando = useRef(false);

  // Só lê o armazenamento depois de montar: o HTML do servidor precisa bater com o primeiro render.
  useEffect(() => {
    const m = calcularModo();
    setModo(m);
    setRascunho(lerRascunho());
    setJaRespondeu(ler(K_ENVIADO) !== null);
    setUrlPesquisa(window.location.href.split(/[?#]/)[0]);

    // Uma resposta que ficou sem enviar (rede ruim, aba fechada) é reenviada agora e sempre que a rede voltar.
    const reenviar = async () => {
      const pendente = lerPendente();
      if (!pendente || enviando.current || !m.configurado || m.teste) return;
      enviando.current = true;
      if ((await enviar(pendente)) === "ok") limparPendente();
      enviando.current = false;
    };
    void reenviar();
    window.addEventListener("online", reenviar);

    return () => {
      window.removeEventListener("online", reenviar);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!modo || passo < 0 || passo >= FIM) return;
    if (Object.keys(respostas).length === 0 && !nome && !celular) return;
    gravar(K_RASCUNHO, JSON.stringify({ versao: VERSAO, passo, respostas, escrito, nonce, nome, celular, aceite }));
  }, [modo, passo, respostas, escrito, nonce, nome, celular, aceite]);

  // Quando "Outras" é marcada o campo de texto aparece logo abaixo; garante que ele apareça na tela.
  const atual = passo >= 1 && passo <= TOTAL ? PERGUNTAS[passo - 1] : null;
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
    apagar(K_RASCUNHO);
    setRascunho(null);
    setRespostas({});
    setEscrito("");
    setNome("");
    setCelular("");
    setAceite(false);
    setTentou(false);
    setVisto({ nome: false, celular: false });
    setNonce(novoNonce());
    setPasso(0);
  }

  function retomar() {
    if (!rascunho) return;
    setRespostas(rascunho.respostas);
    setEscrito(rascunho.escrito);
    setNonce(rascunho.nonce);
    setNome(rascunho.nome);
    setCelular(rascunho.celular);
    setAceite(rascunho.aceite);
    setPasso(rascunho.passo);
  }

  function voltar() {
    limparTimer();
    setPasso((p) => Math.max(-1, p - 1));
  }

  /** Confere o contato; se algo falta, mostra o erro e leva o foco ao primeiro campo com problema. */
  function seguirDoContato() {
    const falta = !nomeValido(nome) ? "nome" : !celularValido(celular) ? "celular" : !aceite ? "aceite" : null;
    if (falta) {
      setTentou(true);
      (falta === "nome" ? campoNome : falta === "celular" ? campoCelular : botaoAceite).current?.focus();
      return;
    }
    setPasso(1);
  }

  async function tentarEnviar(p: Pacote) {
    enviando.current = true;
    setEstado("enviando");
    const r = await enviar(p);
    if (r === "ok") {
      limparPendente();
      gravar(K_ENVIADO, JSON.stringify({ codigo: p.registro.envio_codigo, quando: new Date().toISOString().slice(0, 10) }));
      setJaRespondeu(true);
      setEstado("ok");
    } else {
      setEstado("falhou");
    }
    enviando.current = false;
  }

  async function finalizar() {
    if (enviando.current || !modo) return;
    const m = montarRegistro({ nome, celular }, respostas, escrito, nonce ?? novoNonce(), new Date());
    const p: Pacote = { id: m.id, registro: m.registro };

    setPacote(p);
    setLinhas(m.linhas);
    apagar(K_RASCUNHO);
    setPasso(FIM);

    if (modo.teste) {
      guardarTeste(p);
      setEstado("teste");
      return;
    }

    // Guarda antes de enviar: se a aba fechar no meio do caminho, a resposta não se perde.
    guardarPendente(p);
    await tentarEnviar(p);
  }

  function tocar(p: Pergunta, indice: number) {
    const atual = respostas[p.id];

    if (p.tipo === "unica") {
      setRespostas((r) => ({ ...r, [p.id]: indice }));

      // O toque já é a resposta: avança sozinho. A última pergunta espera o botão,
      // para um toque sem querer não enviar a pesquisa.
      if (passo < TOTAL) {
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

  const teste = modo?.teste ?? false;

  /* ---------- abertura ---------- */
  if (passo === -1) {
    const fechada = modo !== null && !modo.configurado && !modo.teste;
    return (
      <Moldura teste={teste}>
        <main className="flex flex-1 flex-col px-6 pb-10 pt-10">
          <Logo size={44} />

          <h1 className="mt-10 text-[34px] font-bold leading-[1.08] tracking-tight">Pesquisa rápida para quem produz</h1>
          <p className="mt-4 text-[18px] leading-snug text-[#4d5b53]">
            {TOTAL} perguntas sobre como você toca a fazenda hoje. Cerca de 3 minutos.
          </p>

          <ul className="mt-9 space-y-4">
            {["É só escolher, quase sem digitar.", "Dá para parar e continuar depois.", "Não pedimos CPF nem dados da conta."].map(
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

          {jaRespondeu && modo && !rascunho && (
            <p className="mt-8 rounded-2xl bg-[#f3f5f1] px-4 py-3.5 text-[15px] leading-snug text-[#4d5b53]">
              Você já respondeu neste aparelho. Obrigado! Se quiser, pode responder de novo.
            </p>
          )}

          {fechada && (
            <p role="status" className="mt-8 rounded-2xl bg-[#f3f5f1] px-4 py-3.5 text-[15px] leading-snug text-[#4d5b53]">
              Esta pesquisa ainda não está aberta. Volte a abrir o link mais tarde.
            </p>
          )}

          <div className="mt-auto pt-10">
            {rascunho && !fechada ? (
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
                disabled={fechada || modo === null}
                className="h-14 w-full rounded-2xl text-[17px] font-semibold text-white disabled:bg-[#cdd5cd]"
                style={!fechada && modo ? { background: VERDE } : undefined}
              >
                Começar
              </button>
            )}

            <details className="mt-6 text-[14px] leading-relaxed text-[#4d5b53]">
              <summary className="cursor-pointer py-1 font-medium">Como usamos as respostas</summary>
              <p className="mt-2">
                Pedimos seu nome e celular para a equipe da Coope poder falar com você depois. Somamos as respostas de
                vários produtores para entender o que o campo precisa em imposto, crédito e seguro. Não pedimos CPF nem
                dados da conta. Para apagar seus dados, {canalPrivacidade()}.
              </p>
            </details>
          </div>
        </main>
      </Moldura>
    );
  }

  /* ---------- contato ---------- */
  if (passo === 0) {
    const erroNome = (tentou || visto.nome) && !nomeValido(nome);
    const erroCelular = (tentou || visto.celular) && !celularValido(celular);
    const erroAceite = tentou && !aceite;

    return (
      <Moldura teste={teste}>
        <header className="sticky top-0 z-10 bg-white">
          <div className="flex h-14 items-center px-2">
            <button
              type="button"
              onClick={voltar}
              aria-label="Voltar"
              className="grid h-11 w-11 place-items-center rounded-full text-[#111814] [-webkit-tap-highlight-color:transparent] active:bg-[#f0f2ee]"
            >
              <Icone nome="voltar" tamanho={22} />
            </button>
          </div>
        </header>

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
            <div>
              <label htmlFor="nome" className="text-[17px] font-semibold">
                Seu nome
              </label>
              <input
                ref={campoNome}
                id="nome"
                type="text"
                value={nome}
                maxLength={MAX_NOME}
                onChange={(e) => setNome(filtrarNome(e.target.value))}
                onBlur={() => setVisto((v) => ({ ...v, nome: true }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    campoCelular.current?.focus();
                  }
                }}
                placeholder="Como você se chama"
                autoComplete="name"
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                aria-invalid={erroNome || undefined}
                aria-describedby={erroNome ? "nome-erro" : undefined}
                className={CAMPO + (erroNome ? "border-[#b42318]" : "border-[#dde2db]")}
              />
              {erroNome && (
                <p id="nome-erro" role="alert" className="mt-1.5 text-[14px] font-medium" style={{ color: ERRO }}>
                  Escreva seu nome.
                </p>
              )}
            </div>

            <div className="mt-6">
              <label htmlFor="celular" className="text-[17px] font-semibold">
                Seu celular
              </label>
              <input
                ref={campoCelular}
                id="celular"
                type="tel"
                inputMode="numeric"
                value={formatarCelular(celular)}
                onChange={(e) => setCelular(celularLocal(e.target.value))}
                onBlur={() => setVisto((v) => ({ ...v, celular: true }))}
                placeholder="(65) 99999-9999"
                autoComplete="tel-national"
                enterKeyHint="done"
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
            </div>

            <button
              ref={botaoAceite}
              type="button"
              role="checkbox"
              aria-checked={aceite}
              aria-describedby="aceite-texto"
              onClick={() => setAceite((a) => !a)}
              className={`mt-7 flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7a4a] ${
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
              <span id="aceite-texto" className="text-[15px] leading-snug">
                Autorizo a Coope a guardar meu nome, celular e respostas para estudar o que quem produz precisa e entrar em
                contato comigo. Para apagar meus dados, {canalPrivacidade()}.
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
          <button
            type="button"
            onClick={seguirDoContato}
            className="h-14 w-full rounded-2xl text-[17px] font-semibold text-white"
            style={{ background: VERDE }}
          >
            Continuar
          </button>
        </div>
      </Moldura>
    );
  }

  /* ---------- fim ---------- */
  if (passo >= FIM) {
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
            {estado === "ok"
              ? "Recebemos. Obrigado!"
              : estado === "teste"
                ? "Teste concluído"
                : estado === "falhou"
                  ? "Ainda não salvamos"
                  : "Salvando…"}
          </h1>

          <div aria-live="polite" className="mt-4 text-[18px] leading-snug text-[#4d5b53]">
            {estado === "enviando" && <p>Guardando suas respostas. Só um instante.</p>}
            {estado === "ok" && <p>Suas respostas foram salvas. A equipe da Coope pode falar com você pelo celular que informou.</p>}
            {estado === "teste" && <p>Nada foi enviado: no modo de teste as respostas ficam só neste aparelho.</p>}
            {estado === "falhou" && (
              <p>
                Parece que a internet falhou. Suas respostas estão guardadas neste aparelho. Toque para tentar de novo; se
                fechar a página, tentamos sozinhos na próxima vez que você abrir o link.
              </p>
            )}
          </div>

          {estado === "falhou" && pacote && (
            <button
              type="button"
              onClick={() => void tentarEnviar(pacote)}
              className="mt-6 h-14 w-full rounded-2xl text-[17px] font-semibold text-white"
              style={{ background: VERDE }}
            >
              Tentar de novo
            </button>
          )}

          <section className="mt-10 rounded-3xl border-2 border-[#0b7a4a] bg-[#eef7f1] p-6" aria-labelledby="indicar">
            <h2 id="indicar" className="text-[26px] font-bold leading-[1.1] tracking-tight">
              Conhece outro produtor?
            </h2>
            <p className="mt-2 text-[17px] leading-snug text-[#33413a]">Mande a pesquisa para ele. Leva 3 minutos.</p>
            <a
              href={linkIndicar(urlPesquisa)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 grid h-16 w-full place-items-center rounded-2xl px-4 text-[19px] font-bold text-white [-webkit-tap-highlight-color:transparent]"
              style={{ background: VERDE }}
            >
              Mandar pelo WhatsApp
            </a>
          </section>

          {linhas.length > 0 && (
            <details className="mt-8 text-[14px] text-[#4d5b53]">
              <summary className="cursor-pointer py-1 font-medium">Ver o que enviamos</summary>
              <pre className="mt-2 select-all whitespace-pre-wrap break-words rounded-2xl bg-[#f3f5f1] p-4 text-[13px] leading-relaxed text-[#111814]">
                {linhas.join("\n")}
              </pre>
            </details>
          )}
        </main>
      </Moldura>
    );
  }

  /* ---------- pergunta ---------- */
  const p = PERGUNTAS[passo - 1];
  const dica = dicaDe(p, respostas);
  const valor = respostas[p.id];
  const marcadas = Array.isArray(valor) ? valor : typeof valor === "number" ? [valor] : [];
  const multipla = p.tipo === "multipla";
  const cheio = multipla && p.max !== undefined && marcadas.length >= p.max;
  const ultima = passo === TOTAL;
  const precisaBotao = multipla || ultima;
  const respondida = respostaValida(p, valor);

  return (
    <Moldura teste={teste}>
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
            {passo} de {TOTAL}
          </span>
        </div>
        <div className="h-[3px] bg-[#e9ece7]" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={passo}>
          <div className="h-full transition-[width] duration-300" style={{ width: `${(passo / TOTAL) * 100}%`, background: VERDE }} />
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
              className={CAMPO + "border-[#dde2db]"}
            />
            <p className="mt-1.5 text-[14px] text-[#4d5b53]">Só letras, até {p.escreve.max} caracteres. Se preferir, deixe em branco.</p>
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          Pergunta {passo} de {TOTAL}
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
