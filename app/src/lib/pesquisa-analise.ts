import {
  PERGUNTAS,
  SIMBOLOS_PREFIXO,
  VERSAO,
  decodificar,
  rotulos,
  simbolosEsperados,
  type Respostas,
} from "./pesquisa";

/**
 * Leitura e contas sobre as respostas recebidas. Só a página de resultados usa
 * este módulo, então a pesquisa em si não carrega nada daqui.
 */

export interface Entrada {
  codigo: string;
  respostas: Respostas;
  /** O que a pessoa escreveu em "Outras", já normalizado. Vazio se nada. */
  escrito: string;
}

/* ---------------- entrada de dados ---------------- */

/**
 * Acha códigos dentro de texto solto: mensagens coladas do WhatsApp, várias de
 * uma vez, com linhas de resumo no meio. Tolera minúsculas, espaço ou traço a
 * mais e quebra de linha no meio do código.
 *
 * O tamanho do código varia (depende do texto de "Outras"), mas ele mesmo diz
 * quanto mede. Lê-se o começo, descobre-se o tamanho e para-se ali: sem isso,
 * as palavras que vêm depois do código seriam engolidas como se fossem dele.
 */
export function extrairCodigos(texto: string): string[] {
  const achados: string[] = [];

  for (const m of texto.matchAll(/COOPE\s*(\d)/gi)) {
    let i = m.index! + m[0].length;
    let dados = "";
    let alvo = SIMBOLOS_PREFIXO;

    while (i < texto.length && dados.length < alvo) {
      const c = texto[i];
      if (/[0-9A-Za-z]/.test(c)) {
        dados += c;
        if (dados.length === SIMBOLOS_PREFIXO) alvo = simbolosEsperados(dados) ?? SIMBOLOS_PREFIXO;
      } else if (!/[\s\-–—._·]/.test(c)) break;
      i += 1;
    }
    achados.push(`COOPE${m[1]}${dados}`);
  }
  return achados;
}

export interface Resultado {
  lista: Entrada[];
  novas: number;
  repetidas: number;
  invalidas: number;
  /** Códigos de outra versão do questionário. */
  outraVersao: number;
}

export function adicionar(atual: Entrada[], texto: string): Resultado {
  const lista = [...atual];
  const vistos = new Set(lista.map((e) => e.codigo));
  let novas = 0;
  let repetidas = 0;
  let invalidas = 0;
  let outraVersao = 0;

  for (const bruto of extrairCodigos(texto)) {
    const d = decodificar(bruto);
    if (!d.ok) {
      if (d.motivo === "versao") outraVersao += 1;
      else invalidas += 1;
      continue;
    }
    if (vistos.has(d.codigo)) {
      repetidas += 1;
      continue;
    }
    vistos.add(d.codigo);
    lista.push({ codigo: d.codigo, respostas: d.respostas, escrito: d.escrito });
    novas += 1;
  }
  return { lista, novas, repetidas, invalidas, outraVersao };
}

/** Reconstrói a lista a partir do que ficou guardado, descartando o que não lê mais. */
export function restaurar(codigos: unknown): Entrada[] {
  if (!Array.isArray(codigos)) return [];
  const lista: Entrada[] = [];
  for (const c of codigos) {
    if (typeof c !== "string") continue;
    const d = decodificar(c);
    if (d.ok) lista.push({ codigo: d.codigo, respostas: d.respostas, escrito: d.escrito });
  }
  return lista;
}

/* ---------------- contas ---------------- */

const tem = (r: Respostas, id: string, indices: number[]) => {
  const v = r[id];
  return (Array.isArray(v) ? v : [v]).some((i) => indices.includes(i));
};

/** Faturamento a partir de R$ 4,8 milhões, produtor pessoa física: onde o LCDPR é obrigatório. */
export const perfilAlvo = (r: Respostas) => tem(r, "faturamento", [2, 3, 4]) && tem(r, "formato", [0, 2]);

/** Quantas pessoas citaram cada opção, em qualquer posição. */
export function contar(lista: Entrada[], id: string): number[] {
  const p = PERGUNTAS.find((x) => x.id === id)!;
  const c = p.opcoes.map(() => 0);
  for (const e of lista) {
    const v = e.respostas[id];
    for (const i of Array.isArray(v) ? v : [v]) c[i] += 1;
  }
  return c;
}

/** Nas perguntas ordenadas, quantas pessoas puseram cada opção em primeiro lugar. */
export function contarPrimeira(lista: Entrada[], id: string): number[] {
  const p = PERGUNTAS.find((x) => x.id === id)!;
  const c = p.opcoes.map(() => 0);
  for (const e of lista) {
    const v = e.respostas[id];
    c[Array.isArray(v) ? v[0] : v] += 1;
  }
  return c;
}

/** O que as pessoas escreveram em "Outras", do mais repetido para o menos. */
export function escritos(lista: Entrada[]): { texto: string; n: number }[] {
  const c = new Map<string, number>();
  for (const e of lista) if (e.escrito) c.set(e.escrito, (c.get(e.escrito) ?? 0) + 1);
  return [...c.entries()].map(([texto, n]) => ({ texto, n })).sort((a, b) => b.n - a.n || a.texto.localeCompare(b.texto));
}

/**
 * Intervalo de confiança de Wilson, 95%. Com amostra pequena e proporção perto
 * de 0 ou 100% a margem de erro "normal" engana; Wilson não.
 */
export function intervalo(sucessos: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const p = sucessos / n;
  const d = 1 + (z * z) / n;
  const centro = (p + (z * z) / (2 * n)) / d;
  const meia = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, centro - meia), Math.min(1, centro + meia)];
}

/**
 * Sinais de dor, todos sobre o que a pessoa já vive, não sobre o que diria de
 * um serviço. Quem marca dois ou mais tem dor recorrente.
 */
export const SINAIS_DE_DOR: { rotulo: string; fn: (r: Respostas) => boolean }[] = [
  { rotulo: "só vê o imposto no fim do ano", fn: (r) => tem(r, "imposto", [0, 1]) },
  { rotulo: "pagou multa ou juros por atraso", fn: (r) => tem(r, "multas", [1, 2, 3]) },
  { rotulo: "crédito negado ou menor que o necessário", fn: (r) => tem(r, "negado", [1, 2, 3]) },
  { rotulo: "crédito demora 15 dias ou mais, ou nunca saiu", fn: (r) => tem(r, "prazo", [2, 3, 4]) },
  { rotulo: "controle precário do dinheiro", fn: (r) => tem(r, "controle", [2, 4]) },
];

export const temDorRecorrente = (r: Respostas) => SINAIS_DE_DOR.filter((s) => s.fn(r)).length >= 2;

export interface Indicador {
  rotulo: string;
  nota: string;
  sucessos: number;
  n: number;
}

export function indicadores(lista: Entrada[]): Indicador[] {
  const conta = (rotulo: string, nota: string, fn: (r: Respostas) => boolean): Indicador => ({
    rotulo,
    nota,
    sucessos: lista.filter((e) => fn(e.respostas)).length,
    n: lista.length,
  });

  return [
    conta("Só descobrem o imposto no fim do ano", "incluindo quem já levou susto", (r) => tem(r, "imposto", [0, 1])),
    conta("Pagaram multa ou juros por atraso", "nos últimos 3 anos, ao menos uma vez", (r) => tem(r, "multas", [1, 2, 3])),
    conta("Crédito negado ou menor que o necessário", "nos últimos 3 anos, ao menos uma vez", (r) => tem(r, "negado", [1, 2, 3])),
    conta("Crédito demora 15 dias ou mais", "ou nunca saiu", (r) => tem(r, "prazo", [2, 3, 4])),
    conta("Não sabem a taxa de juros que pagam", "entre todos os respondentes", (r) => tem(r, "taxa", [5])),
    conta("Controle precário do dinheiro", "caderno, de cabeça ou quase nada", (r) => tem(r, "controle", [2, 4])),
    conta("Sem seguro da lavoura", "não têm ou deixaram de fazer", (r) => tem(r, "seguro", [2, 3])),
    conta("Abertos a usar tecnologia", "já usam, usariam se fosse simples ou se alguém de confiança indicar", (r) =>
      tem(r, "tecnologia", [0, 1, 2]),
    ),
  ];
}

export interface Etapa {
  rotulo: string;
  regra: string;
  n: number;
}

/**
 * Funil de demanda qualificada. Cada etapa só conta quem passou pelas
 * anteriores. Mede situação vivida, que é evidência mais forte que intenção
 * declarada: quem chega ao fim está no perfil, sofre de verdade, não rejeita
 * tecnologia e consegue entrar.
 */
export function funil(lista: Entrada[]): Etapa[] {
  const passos: { rotulo: string; regra: string; fn: (r: Respostas) => boolean }[] = [
    { rotulo: "Responderam", regra: "todas as respostas válidas", fn: () => true },
    {
      rotulo: "No perfil do produto",
      regra: "pessoa física com faturamento a partir de R$ 4,8 mi",
      fn: perfilAlvo,
    },
    {
      rotulo: "Com dor recorrente",
      regra: `dois ou mais sinais entre: ${SINAIS_DE_DOR.map((s) => s.rotulo).join("; ")}`,
      fn: temDorRecorrente,
    },
    {
      rotulo: "Abertos a tecnologia",
      regra: "já usam, usariam se fosse simples ou se alguém de confiança indicar",
      fn: (r) => tem(r, "tecnologia", [0, 1, 2]),
    },
    {
      rotulo: "Conseguem entrar",
      regra: "têm certificado digital válido, vencido ou tirariam um",
      fn: (r) => tem(r, "certificado", [0, 1, 2]),
    },
  ];

  let restantes = lista;
  return passos.map((p) => {
    restantes = restantes.filter((e) => p.fn(e.respostas));
    return { rotulo: p.rotulo, regra: p.regra, n: restantes.length };
  });
}

/* ---------------- exportação ---------------- */

const celula = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** CSV com ponto e vírgula e BOM, que é o que o Excel brasileiro abre sem reclamar. */
export function paraCSV(lista: Entrada[]): string {
  const cab = ["codigo", "perfil_alvo", "dor_recorrente", ...PERGUNTAS.map((p) => p.id), "culturas_outras"];

  const linhas = lista.map((e) => [
    e.codigo,
    perfilAlvo(e.respostas) ? "sim" : "nao",
    temDorRecorrente(e.respostas) ? "sim" : "nao",
    ...PERGUNTAS.map((p) => {
      const v = e.respostas[p.id];
      if (!Array.isArray(v)) return p.opcoes[v].rotulo;
      // nas ordenadas, a ordem é a informação: primeiro é o maior
      return v.map((i) => p.opcoes[i].rotulo).join(p.ordenada ? " > " : " | ");
    }),
    e.escrito,
  ]);
  return "﻿" + [cab, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
}

export { VERSAO, rotulos };
