/**
 * Pesquisa de mercado com produtores: perguntas, código de resposta e mensagem.
 *
 * O objetivo é descobrir dores, gastos e como o produtor trabalha hoje, e não
 * sondar interesse num serviço que ele ainda não conhece. Por isso as perguntas
 * falam do que ele já faz, já paga e já sofre.
 *
 * Não há servidor nem banco. Cada resposta vira um código curto e legível,
 * como COOPE2-K3M9P2-7QXH4T-..., que carrega todas as escolhas. O produtor manda
 * o código (dentro de uma mensagem legível) por WhatsApp, e a página de
 * resultados desmonta os códigos e faz as contas.
 *
 * Três escolhas de desenho:
 *
 * 1. Só perguntas fechadas, com uma única exceção curta: o campo de "Outras"
 *    culturas. Ele aceita só letras, espaço e hífen, até 24 caracteres. Sem
 *    dígitos não há como colocar telefone ou CPF, e sem mais espaço não há como
 *    escrever um recado. Um código só é aceito se cada valor cair dentro das
 *    opções e o selo de verificação fechar.
 *
 * 2. O código é bit-packing, não JSON em base64. Cada pergunta ocupa só os bits
 *    de que precisa, e o alfabeto Crockford evita I/L/O/U, que se confundem com
 *    1/0 quando alguém copia à mão.
 *
 * 3. A ordem importa onde o produtor a dá. Em estados e culturas, a ordem dos
 *    toques é a ordem de tamanho: o primeiro é o maior.
 *
 * Se o questionário mudar (opções ou ordem), suba VERSAO: códigos antigos passam
 * a ser recusados em vez de serem lidos errado.
 */

export const VERSAO = 2;

export interface Opcao {
  rotulo: string;
  /** Forma curta, usada na mensagem e no CSV. */
  curto?: string;
  /** Vale sozinha: marcá-la desmarca as outras ("Nada atrapalha"). */
  exclusiva?: boolean;
}

export interface Pergunta {
  id: string;
  titulo: string;
  dica?: string | ((r: Respostas) => string);
  tipo: "unica" | "multipla";
  /** Limite de marcações nas perguntas múltiplas. Obrigatório quando ordenada. */
  max?: number;
  /** A ordem dos toques importa: a primeira marcada é a maior. */
  ordenada?: boolean;
  /** Marcar esta opção abre um campo curto de escrita. */
  escreve?: { opcao: number; max: number; rotulo: string; exemplo: string };
  colunas?: 1 | 2 | 3;
  opcoes: Opcao[];
}

export const PERGUNTAS: Pergunta[] = [
  {
    id: "uf",
    titulo: "Em quais estados fica a sua produção?",
    dica: "Toque primeiro no estado onde você mais produz. A ordem dos toques vira a ordem.",
    tipo: "multipla",
    ordenada: true,
    max: 5,
    colunas: 3,
    opcoes: ["MT", "MS", "GO", "PR", "RS", "SP", "MG", "BA", "SC", "TO", "MA", "PI", "PA", "RO", "Outro"].map(
      (rotulo) => ({ rotulo }),
    ),
  },
  {
    id: "culturas",
    titulo: "O que você produz?",
    dica: "Toque primeiro no que mais pesa na sua renda. A ordem dos toques vira a ordem.",
    tipo: "multipla",
    ordenada: true,
    max: 6,
    colunas: 2,
    escreve: { opcao: 8, max: 24, rotulo: "Qual outra cultura?", exemplo: "sorgo, eucalipto…" },
    opcoes: [
      { rotulo: "Soja" },
      { rotulo: "Milho" },
      { rotulo: "Algodão" },
      { rotulo: "Café" },
      { rotulo: "Cana" },
      { rotulo: "Trigo, arroz ou feijão", curto: "Trigo/arroz/feijão" },
      { rotulo: "Pecuária de corte", curto: "Pecuária" },
      { rotulo: "Leite" },
      { rotulo: "Outras" },
    ],
  },
  {
    id: "area",
    titulo: "Quantos hectares você trabalha?",
    dica: (r) =>
      Array.isArray(r.uf) && r.uf.length > 1
        ? "Some todos os estados, contando os arrendados. Pode ser aproximado."
        : "Contando os arrendados. Pode ser aproximado.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Até 100 ha" },
      { rotulo: "101 a 500 ha" },
      { rotulo: "501 a 1.500 ha" },
      { rotulo: "1.501 a 5.000 ha" },
      { rotulo: "Mais de 5.000 ha" },
    ],
  },
  {
    id: "faturamento",
    titulo: "Quanto a fazenda fatura por ano?",
    dica: "Pode ser aproximado.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Até R$ 1 milhão", curto: "até R$ 1 mi" },
      { rotulo: "De R$ 1 a 4,8 milhões", curto: "R$ 1 a 4,8 mi" },
      { rotulo: "De R$ 4,8 a 15 milhões", curto: "R$ 4,8 a 15 mi" },
      { rotulo: "De R$ 15 a 50 milhões", curto: "R$ 15 a 50 mi" },
      { rotulo: "Mais de R$ 50 milhões", curto: "mais de R$ 50 mi" },
      { rotulo: "Prefiro não dizer", curto: "" },
    ],
  },
  {
    id: "formato",
    titulo: "Você produz como pessoa física ou empresa?",
    tipo: "unica",
    opcoes: [
      { rotulo: "Pessoa física (CPF)", curto: "CPF" },
      { rotulo: "Empresa (CNPJ)", curto: "CNPJ" },
      { rotulo: "Os dois", curto: "CPF e CNPJ" },
      { rotulo: "Não sei", curto: "não sabe" },
    ],
  },
  {
    id: "controle",
    titulo: "Como você controla o dinheiro da fazenda?",
    tipo: "unica",
    opcoes: [
      { rotulo: "Sistema de gestão (ERP ou app)", curto: "sistema" },
      { rotulo: "Planilha" },
      { rotulo: "Caderno ou de cabeça", curto: "caderno/de cabeça" },
      { rotulo: "O escritório de contabilidade cuida", curto: "escritório cuida" },
      { rotulo: "Quase não controlo", curto: "quase nada" },
    ],
  },
  {
    id: "contador",
    titulo: "Quanto você paga de contabilidade por mês?",
    dica: "Escritório ou equipe própria. Valor aproximado.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Não pago", curto: "não paga" },
      { rotulo: "Até R$ 1.000", curto: "até R$ 1 mil por mês" },
      { rotulo: "De R$ 1.000 a 3.000", curto: "R$ 1 a 3 mil por mês" },
      { rotulo: "De R$ 3.000 a 6.000", curto: "R$ 3 a 6 mil por mês" },
      { rotulo: "De R$ 6.000 a 10.000", curto: "R$ 6 a 10 mil por mês" },
      { rotulo: "Mais de R$ 10.000", curto: "mais de R$ 10 mil por mês" },
      { rotulo: "Não sei", curto: "não sabe" },
    ],
  },
  {
    id: "imposto",
    titulo: "Como você lida com o Imposto de Renda da fazenda?",
    tipo: "unica",
    opcoes: [
      { rotulo: "Só descubro no fim do ano e já levei susto", curto: "só no fim do ano, já levou susto" },
      { rotulo: "Só descubro no fim do ano, sem susto", curto: "só no fim do ano, sem susto" },
      { rotulo: "Acompanho durante o ano", curto: "acompanha durante o ano" },
      { rotulo: "Deixo tudo com o contador", curto: "deixa com o contador" },
    ],
  },
  {
    id: "multas",
    titulo: "Nos últimos 3 anos, quantas vezes você pagou multa ou juros por atraso?",
    dica: "Imposto, conta ou parcela.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Nenhuma vez", curto: "nenhuma" },
      { rotulo: "1 ou 2 vezes", curto: "1 ou 2 vezes" },
      { rotulo: "3 a 5 vezes", curto: "3 a 5 vezes" },
      { rotulo: "Mais de 5 vezes", curto: "mais de 5 vezes" },
      { rotulo: "Não sei dizer", curto: "não sabe" },
    ],
  },
  {
    id: "custeio",
    titulo: "Como você paga o custeio da safra?",
    dica: "Adubo, semente e defensivo. Marque todas que usa.",
    tipo: "multipla",
    opcoes: [
      { rotulo: "Dinheiro da própria fazenda", curto: "capital próprio" },
      { rotulo: "Banco (custeio, Plano Safra)", curto: "banco" },
      { rotulo: "Cooperativa" },
      { rotulo: "Revenda ou fornecedor (barter, prazo)", curto: "revenda/barter" },
      { rotulo: "Fundo, CPR ou mercado de capitais", curto: "fundo/CPR" },
      { rotulo: "Outro" },
    ],
  },
  {
    id: "prazo",
    titulo: "Quanto tempo leva para o crédito cair na conta?",
    dica: "Do pedido até o dinheiro.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Menos de 3 dias" },
      { rotulo: "De 3 a 15 dias", curto: "3 a 15 dias" },
      { rotulo: "De 15 a 45 dias", curto: "15 a 45 dias" },
      { rotulo: "Mais de 45 dias" },
      { rotulo: "Nunca consegui o que precisava", curto: "nunca conseguiu" },
      { rotulo: "Não uso crédito de terceiros", curto: "não usa crédito" },
    ],
  },
  {
    id: "taxa",
    titulo: "Que taxa de juros você costuma pagar no crédito da safra?",
    dica: "Por ano, somando tudo que cobram.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Menos de 10%", curto: "menos de 10% ao ano" },
      { rotulo: "De 10% a 14%", curto: "10 a 14% ao ano" },
      { rotulo: "De 14% a 18%", curto: "14 a 18% ao ano" },
      { rotulo: "De 18% a 24%", curto: "18 a 24% ao ano" },
      { rotulo: "Mais de 24%", curto: "mais de 24% ao ano" },
      { rotulo: "Não sei", curto: "não sabe" },
      { rotulo: "Não uso crédito", curto: "não usa crédito" },
    ],
  },
  {
    id: "negado",
    titulo: "Nos últimos 3 anos, quantas vezes o crédito foi negado ou veio menor do que você precisava?",
    tipo: "unica",
    opcoes: [
      { rotulo: "Nenhuma vez", curto: "nenhuma" },
      { rotulo: "1 vez", curto: "1 vez" },
      { rotulo: "2 ou 3 vezes", curto: "2 ou 3 vezes" },
      { rotulo: "4 vezes ou mais", curto: "4 ou mais vezes" },
      { rotulo: "Nunca pedi crédito", curto: "nunca pediu" },
    ],
  },
  {
    id: "obstaculos",
    titulo: "O que mais atrapalha na hora de pedir crédito?",
    dica: "Escolha até 2.",
    tipo: "multipla",
    max: 2,
    opcoes: [
      { rotulo: "Juros altos", curto: "juros altos" },
      { rotulo: "Demora", curto: "demora" },
      { rotulo: "Exigência de garantia (hipoteca da terra)", curto: "garantia" },
      { rotulo: "Muita documentação", curto: "documentação" },
      { rotulo: "Já estou no limite do banco", curto: "limite do banco" },
      { rotulo: "Nada atrapalha", curto: "nada", exclusiva: true },
    ],
  },
  {
    id: "seguro",
    titulo: "Você tem seguro da lavoura?",
    tipo: "unica",
    opcoes: [
      { rotulo: "Sim, em toda a área" },
      { rotulo: "Sim, em parte da área" },
      { rotulo: "Não tenho" },
      { rotulo: "Já tive e deixei de fazer", curto: "já teve" },
    ],
  },
  {
    id: "expansao",
    titulo: "Nos próximos 2 anos, o que você pensa sobre aumentar a produção?",
    tipo: "unica",
    opcoes: [
      { rotulo: "Já estou aumentando", curto: "já está aumentando" },
      { rotulo: "Quero, mas falta dinheiro ou crédito", curto: "quer, falta crédito" },
      { rotulo: "Quero, mas falta outra coisa (terra, máquina, gente)", curto: "quer, falta outra coisa" },
      { rotulo: "Por ora não penso nisso", curto: "não pensa nisso" },
      { rotulo: "Penso em reduzir", curto: "pensa em reduzir" },
    ],
  },
  {
    id: "tecnologia",
    titulo: "O que você acha de usar tecnologia para cuidar do financeiro da fazenda?",
    dica: "Notas, imposto, crédito.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Já uso e funciona bem", curto: "já usa" },
      { rotulo: "Usaria, se fosse simples", curto: "usaria se fosse simples" },
      { rotulo: "Só se alguém de confiança indicar", curto: "só se alguém confiável indicar" },
      { rotulo: "Prefiro como está", curto: "prefere como está" },
    ],
  },
  {
    id: "certificado",
    titulo: "Você tem certificado digital?",
    dica: "e-CPF ou e-CNPJ.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Tenho e está válido" },
      { rotulo: "Tenho, mas venceu" },
      { rotulo: "Não tenho, mas tiraria" },
      { rotulo: "Nem sei o que é" },
    ],
  },
];

export const porId = (id: string) => {
  const p = PERGUNTAS.find((x) => x.id === id);
  if (!p) throw new Error(`Pergunta inexistente: ${id}`);
  return p;
};

/* Regras do próprio questionário, conferidas ao carregar: errar aqui corromperia o código sem aviso. */
const BITS_CONTAGEM = 3;
for (const p of PERGUNTAS) {
  if (p.ordenada && (p.tipo !== "multipla" || !p.max || p.max >= 1 << BITS_CONTAGEM)) {
    throw new Error(`"${p.id}": ordenada exige múltipla com max de 1 a ${(1 << BITS_CONTAGEM) - 1}`);
  }
}
const ESCRITA = PERGUNTAS.find((p) => p.escreve);
if (PERGUNTAS.filter((p) => p.escreve).length > 1) throw new Error("O código suporta um campo de escrita só");

/* ---------------- respostas ---------------- */

export type Valor = number | number[];
export type Respostas = Record<string, Valor>;

export function respostaValida(p: Pergunta, v: unknown): v is Valor {
  const dentro = (i: unknown) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < p.opcoes.length;

  if (p.tipo === "unica") return dentro(v);

  if (!Array.isArray(v) || v.length === 0 || !v.every(dentro)) return false;
  if (new Set(v).size !== v.length) return false;
  if (p.max !== undefined && v.length > p.max) return false;
  if (!p.ordenada && v.length > 1 && v.some((i) => p.opcoes[i].exclusiva)) return false;
  return true;
}

export const respondida = (p: Pergunta, r: Respostas) => respostaValida(p, r[p.id]);

export const completo = (r: Respostas) => PERGUNTAS.every((p) => respondida(p, r));

export const dicaDe = (p: Pergunta, r: Respostas) => (typeof p.dica === "function" ? p.dica(r) : p.dica);

/* ---------------- texto curto ---------------- */

/** Letras (com ou sem acento), espaço e hífen. Serve para filtrar enquanto a pessoa digita. */
export function filtrarEscrito(s: string, max: number): string {
  return s
    .replace(/[^\p{L} -]/gu, "")
    .replace(/ {2,}/g, " ")
    .replace(/^[ -]+/, "")
    .slice(0, max);
}

/** Forma que vai para o código: minúsculas, sem acento, só a-z, espaço e hífen. */
export function normalizarEscrito(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z -]/g, "")
    .replace(/ {2,}/g, " ")
    .replace(/^[ -]+|[ -]+$/g, "")
    .slice(0, max);
}

/* ---------------- código ---------------- */

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford: sem I, L, O, U
const ALFABETO_TEXTO = " abcdefghijklmnopqrstuvwxyz-"; // 28 símbolos, cabem em 5 bits
const BITS_NONCE = 10;
const BITS_TAMANHO_TEXTO = 5;
const BITS_SELO = 12;

const bitsDeIndice = (p: Pergunta) => Math.max(1, Math.ceil(Math.log2(p.opcoes.length)));

const largura = (p: Pergunta) =>
  p.tipo === "unica"
    ? bitsDeIndice(p)
    : p.ordenada
      ? BITS_CONTAGEM + p.max! * bitsDeIndice(p)
      : p.opcoes.length;

const BITS_DADOS = PERGUNTAS.reduce((soma, p) => soma + largura(p), 0);
const BITS_ANTES_DO_TEXTO = BITS_DADOS + BITS_NONCE;
const BITS_PREFIXO = BITS_ANTES_DO_TEXTO + (ESCRITA ? BITS_TAMANHO_TEXTO : 0);

/** Símbolos de que o leitor precisa para saber de que tamanho é o resto do código. */
export const SIMBOLOS_PREFIXO = Math.ceil(BITS_PREFIXO / 5);

/**
 * Sorteado uma vez por resposta. Sem ele, dois produtores com respostas
 * idênticas gerariam o mesmo código e um seria descartado como repetido; com
 * ele, só a mesma mensagem colada duas vezes é repetida.
 */
export function novoNonce(): number {
  try {
    return crypto.getRandomValues(new Uint16Array(1))[0] & ((1 << BITS_NONCE) - 1);
  } catch {
    return Math.floor(Math.random() * (1 << BITS_NONCE));
  }
}

/** Selo de verificação: pega erro de digitação e mistura de códigos de versões. */
function selo(bits: number[]): number {
  let h = 0x811c9dc5 ^ VERSAO;
  for (const b of bits) h = Math.imul(h ^ (b + 1), 0x01000193) >>> 0;
  return (h ^ (h >>> 12) ^ (h >>> 20)) & ((1 << BITS_SELO) - 1);
}

export function codificar(respostas: Respostas, nonce: number, escrito = ""): string {
  const bits: number[] = [];
  const empurrar = (valor: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };

  for (const p of PERGUNTAS) {
    const v = respostas[p.id];
    if (!respostaValida(p, v)) throw new Error(`Resposta inválida para "${p.id}"`);

    if (p.tipo === "unica") empurrar(v as number, bitsDeIndice(p));
    else if (p.ordenada) {
      const ordem = v as number[];
      empurrar(ordem.length, BITS_CONTAGEM);
      for (let i = 0; i < p.max!; i++) empurrar(ordem[i] ?? 0, bitsDeIndice(p));
    } else empurrar((v as number[]).reduce((m, i) => m | (1 << i), 0), p.opcoes.length);
  }

  empurrar(nonce & ((1 << BITS_NONCE) - 1), BITS_NONCE);

  if (ESCRITA) {
    // O texto só vale se a opção que o abre está marcada.
    const aberto = (respostas[ESCRITA.id] as number[]).includes(ESCRITA.escreve!.opcao);
    const texto = aberto ? normalizarEscrito(escrito, ESCRITA.escreve!.max) : "";
    empurrar(texto.length, BITS_TAMANHO_TEXTO);
    for (const c of texto) empurrar(ALFABETO_TEXTO.indexOf(c), 5);
  }

  empurrar(selo(bits), BITS_SELO);
  while (bits.length % 5) bits.push(0);

  let texto = "";
  for (let i = 0; i < bits.length; i += 5) {
    texto += ALFABETO[(bits[i] << 4) | (bits[i + 1] << 3) | (bits[i + 2] << 2) | (bits[i + 3] << 1) | bits[i + 4]];
  }
  return `COOPE${VERSAO}-${texto.match(/.{1,6}/g)!.join("-")}`;
}

/** Confusões clássicas de quem copia à mão: O vira 0; I e L viram 1. */
const limparDados = (s: string) => s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1");

function paraBits(dados: string): number[] | null {
  if (/[^0-9A-HJKMNP-TV-Z]/.test(dados)) return null;
  const bits: number[] = [];
  for (const c of dados) {
    const v = ALFABETO.indexOf(c);
    for (let i = 4; i >= 0; i--) bits.push((v >> i) & 1);
  }
  return bits;
}

const lerBits = (bits: number[], de: number, n: number) => bits.slice(de, de + n).reduce((a, b) => (a << 1) | b, 0);

/**
 * Quantos símbolos o código inteiro tem, lido só do começo. O tamanho do texto
 * está dentro do próprio código, e é isso que deixa achar onde ele termina no
 * meio de uma conversa colada, sem engolir as palavras que vêm depois.
 */
export function simbolosEsperados(dados: string): number | null {
  const limpo = limparDados(dados);
  if (limpo.length < SIMBOLOS_PREFIXO) return null;
  const bits = paraBits(limpo.slice(0, SIMBOLOS_PREFIXO));
  if (!bits) return null;

  let texto = 0;
  if (ESCRITA) {
    texto = lerBits(bits, BITS_ANTES_DO_TEXTO, BITS_TAMANHO_TEXTO);
    if (texto > ESCRITA.escreve!.max) return null;
  }
  return Math.ceil((BITS_PREFIXO + texto * 5 + BITS_SELO) / 5);
}

export type Decodificado =
  | { ok: true; respostas: Respostas; escrito: string; nonce: number; codigo: string }
  | { ok: false; motivo: "formato" | "versao" | "selo" | "valor" };

export function decodificar(texto: string): Decodificado {
  const limpo = texto.toUpperCase().replace(/[\s\-–—._·]/g, "");
  const m = /^COOPE(\d)(.*)$/.exec(limpo);
  if (!m) return { ok: false, motivo: "formato" };
  if (Number(m[1]) !== VERSAO) return { ok: false, motivo: "versao" };

  const dados = limparDados(m[2]);
  const esperado = simbolosEsperados(dados);
  if (esperado === null || dados.length !== esperado) return { ok: false, motivo: "formato" };

  const bits = paraBits(dados);
  if (!bits) return { ok: false, motivo: "formato" };

  const respostas: Respostas = {};
  let pos = 0;
  for (const p of PERGUNTAS) {
    let v: Valor;

    if (p.tipo === "unica") {
      v = lerBits(bits, pos, bitsDeIndice(p));
      pos += bitsDeIndice(p);
    } else if (p.ordenada) {
      const n = lerBits(bits, pos, BITS_CONTAGEM);
      pos += BITS_CONTAGEM;
      const slots: number[] = [];
      for (let i = 0; i < p.max!; i++) {
        slots.push(lerBits(bits, pos, bitsDeIndice(p)));
        pos += bitsDeIndice(p);
      }
      if (n < 1 || n > p.max! || slots.slice(n).some((s) => s !== 0)) return { ok: false, motivo: "valor" };
      v = slots.slice(0, n);
    } else {
      const mascara = lerBits(bits, pos, p.opcoes.length);
      pos += p.opcoes.length;
      v = p.opcoes.map((_, i) => i).filter((i) => (mascara >> i) & 1);
    }

    if (!respostaValida(p, v)) return { ok: false, motivo: "valor" };
    respostas[p.id] = v;
  }

  const nonce = lerBits(bits, pos, BITS_NONCE);
  pos += BITS_NONCE;

  let escrito = "";
  if (ESCRITA) {
    const n = lerBits(bits, pos, BITS_TAMANHO_TEXTO);
    pos += BITS_TAMANHO_TEXTO;
    for (let i = 0; i < n; i++) {
      const c = lerBits(bits, pos, 5);
      pos += 5;
      if (c >= ALFABETO_TEXTO.length) return { ok: false, motivo: "valor" };
      escrito += ALFABETO_TEXTO[c];
    }
    // texto sem a opção que o abre marcada não existe
    if (n > 0 && !(respostas[ESCRITA.id] as number[]).includes(ESCRITA.escreve!.opcao)) {
      return { ok: false, motivo: "valor" };
    }
    if (escrito !== normalizarEscrito(escrito, ESCRITA.escreve!.max)) return { ok: false, motivo: "valor" };
  }

  if (lerBits(bits, pos, BITS_SELO) !== selo(bits.slice(0, pos))) return { ok: false, motivo: "selo" };
  pos += BITS_SELO;
  if (bits.slice(pos).some((b) => b !== 0)) return { ok: false, motivo: "formato" };

  return { ok: true, respostas, escrito, nonce, codigo: codificar(respostas, nonce, escrito) };
}

/* ---------------- mensagem ---------------- */

const curtoDe = (p: Pergunta, i: number) => p.opcoes[i].curto ?? p.opcoes[i].rotulo;

/** Rótulos curtos na ordem em que a pessoa escolheu (nas ordenadas, do maior para o menor). */
export function rotulos(id: string, r: Respostas): string[] {
  const p = porId(id);
  const v = r[id];
  return (Array.isArray(v) ? v : [v]).map((i) => curtoDe(p, i)).filter(Boolean);
}

/** Resumo em linguagem de gente: é o que quem recebe lê no WhatsApp. */
export function resumir(r: Respostas, escrito = ""): string[] {
  // O mesmo texto que vai para o código: sem isso a mensagem mostraria "Açaí " e a
  // soma dos códigos contaria "acai", e quem lê e quem calcula veriam coisas diferentes.
  const limpo = ESCRITA ? normalizarEscrito(escrito, ESCRITA.escreve!.max) : "";
  const culturas = rotulos("culturas", r).map((c) => (c === "Outras" && limpo ? `outras (${limpo})` : c));
  const perfil = [rotulos("uf", r).join(", "), culturas.join(", "), rotulos("area", r)[0], rotulos("faturamento", r)[0]];

  return [
    perfil.filter(Boolean).join(" · "),
    `Imposto: ${rotulos("imposto", r)[0]}; multas por atraso: ${rotulos("multas", r)[0]}`,
    `Crédito: ${rotulos("prazo", r)[0]}; juros: ${rotulos("taxa", r)[0]}; negado: ${rotulos("negado", r)[0]}`,
    `Contabilidade: ${rotulos("contador", r)[0]}; controle: ${rotulos("controle", r)[0]}`,
    `Aumentar a produção: ${rotulos("expansao", r)[0]}`,
  ];
}

export function montarMensagem(r: Respostas, codigo: string, escrito = ""): string {
  return ["Pesquisa Coope (resposta sem nome)", "", ...resumir(r, escrito), "", `Código: ${codigo}`].join("\n");
}
