/**
 * Pesquisa de mercado com produtores: perguntas, código de resposta e mensagem.
 *
 * Não há servidor nem banco. Cada resposta vira um código curto e legível,
 * como COOPE1-K3M9P2-7QXH4T-BN5RA0, que carrega todas as escolhas. O produtor
 * manda o código (dentro de uma mensagem legível) por WhatsApp, e a página de
 * resultados desmonta os códigos e faz as contas.
 *
 * Duas escolhas de desenho:
 *
 * 1. Só perguntas fechadas. Não existe campo de texto, então não há como entrar
 *    lixo nem dado pessoal por engano. Um código só é aceito se cada valor cair
 *    dentro das opções e o selo de verificação fechar.
 *
 * 2. O código é bit-packing, não JSON em base64. Cada pergunta ocupa só os bits
 *    de que precisa (uma escolha entre 15 opções cabe em 4 bits; uma múltipla
 *    com 9 opções é uma máscara de 9 bits). O resultado é curto o bastante para
 *    ser lido em voz alta, e o alfabeto Crockford evita I/L/O/U, que se
 *    confundem com 1/0 quando alguém copia à mão.
 *
 * Se o questionário mudar (opções ou ordem), suba VERSAO: códigos antigos passam
 * a ser recusados em vez de serem lidos errado.
 */

export const VERSAO = 1;

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
  dica?: string;
  tipo: "unica" | "multipla";
  /** Limite de marcações nas perguntas múltiplas. */
  max?: number;
  colunas?: 1 | 2 | 3;
  opcoes: Opcao[];
}

export const PERGUNTAS: Pergunta[] = [
  {
    id: "uf",
    titulo: "Em que estado fica a sua produção?",
    dica: "A principal, se tiver mais de uma.",
    tipo: "unica",
    colunas: 3,
    opcoes: ["MT", "MS", "GO", "PR", "RS", "SP", "MG", "BA", "SC", "TO", "MA", "PI", "PA", "RO", "Outro"].map(
      (rotulo) => ({ rotulo }),
    ),
  },
  {
    id: "culturas",
    titulo: "O que você mais produz?",
    dica: "Escolha até 3.",
    tipo: "multipla",
    max: 3,
    colunas: 2,
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
    dica: "Contando os arrendados.",
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
  {
    id: "dados",
    titulo: "Deixaria a Coope ler suas notas fiscais e extratos?",
    dica: "Só para calcular imposto e crédito. Você autoriza no app do banco e pode cortar quando quiser.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Sim, sem problema" },
      { rotulo: "Sim, se alguém de confiança explicar" },
      { rotulo: "Só se a cooperativa ou o contador indicar" },
      { rotulo: "Não deixaria" },
    ],
  },
  {
    id: "prioridade",
    titulo: "O que um sistema deveria resolver primeiro?",
    dica: "Escolha até 2.",
    tipo: "multipla",
    max: 2,
    opcoes: [
      { rotulo: "Pagar menos imposto", curto: "pagar menos imposto" },
      { rotulo: "Crédito mais rápido e barato", curto: "crédito rápido e barato" },
      { rotulo: "Organizar notas e caixa", curto: "organizar notas e caixa" },
      { rotulo: "Seguro que paga rápido", curto: "seguro que paga rápido" },
      { rotulo: "Travar o preço de venda", curto: "travar preço de venda" },
      { rotulo: "Ver o resultado de cada fazenda", curto: "resultado por fazenda" },
    ],
  },
  {
    id: "pagaImposto",
    titulo: "Se um serviço economizasse imposto para você, quanto pagaria?",
    dica: "De cada R$ 100 que você deixasse de pagar.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Nada, só de graça", curto: "nada" },
      { rotulo: "R$ 5", curto: "R$ 5 a cada R$ 100" },
      { rotulo: "R$ 10", curto: "R$ 10 a cada R$ 100" },
      { rotulo: "R$ 15", curto: "R$ 15 a cada R$ 100" },
      { rotulo: "R$ 20 ou mais", curto: "R$ 20+ a cada R$ 100" },
    ],
  },
  {
    id: "pagaCredito",
    titulo: "Se o crédito saísse em poucas horas, quanto pagaria?",
    dica: "Taxa sobre o valor do crédito.",
    tipo: "unica",
    opcoes: [
      { rotulo: "Nada, só de graça", curto: "nada" },
      { rotulo: "Até 1%" },
      { rotulo: "Até 2%" },
      { rotulo: "Até 3%" },
      { rotulo: "Mais de 3%" },
    ],
  },
  {
    id: "influencia",
    titulo: "Quem mais pesa na hora de adotar algo novo?",
    dica: "Escolha até 2.",
    tipo: "multipla",
    max: 2,
    opcoes: [
      { rotulo: "Cooperativa ou revenda", curto: "cooperativa/revenda" },
      { rotulo: "Contador" },
      { rotulo: "Banco" },
      { rotulo: "Outros produtores", curto: "outros produtores" },
      { rotulo: "Família" },
      { rotulo: "Decido sozinho", curto: "decide sozinho", exclusiva: true },
    ],
  },
  {
    id: "teste",
    titulo: "Testaria de graça na próxima safra?",
    tipo: "unica",
    opcoes: [
      { rotulo: "Sim, com certeza", curto: "sim" },
      { rotulo: "Talvez, quero saber mais", curto: "talvez" },
      { rotulo: "Não" },
    ],
  },
];

export const porId = (id: string) => {
  const p = PERGUNTAS.find((x) => x.id === id);
  if (!p) throw new Error(`Pergunta inexistente: ${id}`);
  return p;
};

/* ---------------- respostas ---------------- */

export type Valor = number | number[];
export type Respostas = Record<string, Valor>;

export function respostaValida(p: Pergunta, v: unknown): v is Valor {
  const dentro = (i: unknown) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < p.opcoes.length;

  if (p.tipo === "unica") return dentro(v);

  if (!Array.isArray(v) || v.length === 0 || !v.every(dentro)) return false;
  if (new Set(v).size !== v.length) return false;
  if (p.max !== undefined && v.length > p.max) return false;
  if (v.length > 1 && v.some((i) => p.opcoes[i].exclusiva)) return false;
  return true;
}

export const respondida = (p: Pergunta, r: Respostas) => respostaValida(p, r[p.id]);

export const completo = (r: Respostas) => PERGUNTAS.every((p) => respondida(p, r));

/* ---------------- código ---------------- */

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford: sem I, L, O, U
const BITS_NONCE = 10;
const BITS_SELO = 12;

const largura = (p: Pergunta) =>
  p.tipo === "multipla" ? p.opcoes.length : Math.max(1, Math.ceil(Math.log2(p.opcoes.length)));

const BITS_DADOS = PERGUNTAS.reduce((soma, p) => soma + largura(p), 0);

/** Quantos símbolos tem o código (sem o prefixo). */
export const SIMBOLOS = Math.ceil((BITS_DADOS + BITS_NONCE + BITS_SELO) / 5);
const BITS_TOTAL = SIMBOLOS * 5;

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

export function codificar(respostas: Respostas, nonce: number): string {
  const bits: number[] = [];
  const empurrar = (valor: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };

  for (const p of PERGUNTAS) {
    const v = respostas[p.id];
    if (!respostaValida(p, v)) throw new Error(`Resposta inválida para "${p.id}"`);
    empurrar(p.tipo === "unica" ? (v as number) : (v as number[]).reduce((m, i) => m | (1 << i), 0), largura(p));
  }

  empurrar(nonce & ((1 << BITS_NONCE) - 1), BITS_NONCE);
  empurrar(selo(bits), BITS_SELO);
  while (bits.length < BITS_TOTAL) bits.push(0);

  let texto = "";
  for (let i = 0; i < BITS_TOTAL; i += 5) {
    texto += ALFABETO[(bits[i] << 4) | (bits[i + 1] << 3) | (bits[i + 2] << 2) | (bits[i + 3] << 1) | bits[i + 4]];
  }
  return `COOPE${VERSAO}-${texto.match(/.{1,6}/g)!.join("-")}`;
}

export type Decodificado =
  | { ok: true; respostas: Respostas; nonce: number; codigo: string }
  | { ok: false; motivo: "formato" | "versao" | "selo" | "valor" };

export function decodificar(texto: string): Decodificado {
  const limpo = texto.toUpperCase().replace(/[\s\-–—._·]/g, "");
  const m = /^COOPE(\d)(.*)$/.exec(limpo);
  if (!m) return { ok: false, motivo: "formato" };
  if (Number(m[1]) !== VERSAO) return { ok: false, motivo: "versao" };

  // Confusões clássicas de quem copia à mão: O vira 0; I e L viram 1.
  const dados = m[2].replace(/O/g, "0").replace(/[IL]/g, "1");
  if (dados.length !== SIMBOLOS || /[^0-9A-HJKMNP-TV-Z]/.test(dados)) return { ok: false, motivo: "formato" };

  const bits: number[] = [];
  for (const c of dados) {
    const v = ALFABETO.indexOf(c);
    for (let i = 4; i >= 0; i--) bits.push((v >> i) & 1);
  }

  const ler = (de: number, n: number) => bits.slice(de, de + n).reduce((a, b) => (a << 1) | b, 0);

  const fimCorpo = BITS_DADOS + BITS_NONCE;
  if (ler(fimCorpo, BITS_SELO) !== selo(bits.slice(0, fimCorpo))) return { ok: false, motivo: "selo" };
  if (bits.slice(fimCorpo + BITS_SELO).some((b) => b !== 0)) return { ok: false, motivo: "formato" };

  const respostas: Respostas = {};
  let pos = 0;
  for (const p of PERGUNTAS) {
    const n = largura(p);
    const bruto = ler(pos, n);
    pos += n;

    const v: Valor =
      p.tipo === "unica" ? bruto : p.opcoes.map((_, i) => i).filter((i) => (bruto >> i) & 1);
    if (!respostaValida(p, v)) return { ok: false, motivo: "valor" };
    respostas[p.id] = v;
  }

  const nonce = ler(BITS_DADOS, BITS_NONCE);
  return { ok: true, respostas, nonce, codigo: codificar(respostas, nonce) };
}

/* ---------------- mensagem ---------------- */

const curtoDe = (p: Pergunta, i: number) => p.opcoes[i].curto ?? p.opcoes[i].rotulo;

export function rotulos(id: string, r: Respostas): string[] {
  const p = porId(id);
  const v = r[id];
  return (Array.isArray(v) ? v : [v]).map((i) => curtoDe(p, i)).filter(Boolean);
}

/** Resumo em linguagem de gente: é o que quem recebe lê no WhatsApp. */
export function resumir(r: Respostas): string[] {
  const perfil = [
    rotulos("uf", r)[0],
    rotulos("culturas", r).join(", "),
    rotulos("area", r)[0],
    rotulos("faturamento", r)[0],
  ].filter(Boolean);

  return [
    perfil.join(" · "),
    `Imposto: ${rotulos("imposto", r)[0]}`,
    `Crédito: ${rotulos("prazo", r)[0]}; atrapalha: ${rotulos("obstaculos", r).join(", ")}`,
    `Quer resolver primeiro: ${rotulos("prioridade", r).join(", ")}`,
    `Testaria de graça: ${rotulos("teste", r)[0].toLowerCase()}`,
  ];
}

export function montarMensagem(r: Respostas, codigo: string): string {
  return ["Pesquisa Coope (resposta sem nome)", "", ...resumir(r), "", `Código: ${codigo}`].join("\n");
}
