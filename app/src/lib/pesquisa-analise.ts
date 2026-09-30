import {
  PERGUNTAS,
  SIMBOLOS,
  VERSAO,
  decodificar,
  rotulos,
  type Respostas,
} from "./pesquisa";

/**
 * Leitura e contas sobre as respostas recebidas. Só a página de resultados usa
 * este módulo, então a pesquisa em si não carrega nada daqui.
 */

export interface Entrada {
  codigo: string;
  respostas: Respostas;
}

/* ---------------- entrada de dados ---------------- */

/**
 * Acha códigos dentro de texto solto: mensagens coladas do WhatsApp, várias de
 * uma vez, com linhas de resumo no meio. Tolera minúsculas, espaço ou traço a
 * mais e quebra de linha no meio do código.
 */
export function extrairCodigos(texto: string): string[] {
  const achados: string[] = [];

  for (const m of texto.matchAll(/COOPE\s*(\d)/gi)) {
    let i = m.index! + m[0].length;
    let dados = "";

    while (i < texto.length && dados.length < SIMBOLOS) {
      const c = texto[i];
      if (/[0-9A-Za-z]/.test(c)) dados += c;
      else if (!/[\s\-–—._·]/.test(c)) break;
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
    lista.push({ codigo: d.codigo, respostas: d.respostas });
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
    if (d.ok) lista.push({ codigo: d.codigo, respostas: d.respostas });
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

export function contar(lista: Entrada[], id: string): number[] {
  const p = PERGUNTAS.find((x) => x.id === id)!;
  const c = p.opcoes.map(() => 0);
  for (const e of lista) {
    const v = e.respostas[id];
    for (const i of Array.isArray(v) ? v : [v]) c[i] += 1;
  }
  return c;
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
    conta("Testariam de graça", "responderam “Sim, com certeza”", (r) => tem(r, "teste", [0])),
    conta("Só descobrem o imposto no fim do ano", "incluindo quem já levou susto", (r) => tem(r, "imposto", [0, 1])),
    conta("Crédito demora 15 dias ou mais", "ou nunca saiu", (r) => tem(r, "prazo", [2, 3, 4])),
    conta("Sem seguro da lavoura", "não têm ou deixaram de fazer", (r) => tem(r, "seguro", [2, 3])),
    conta("Deixariam ler notas e extratos", "com ou sem ajuda de alguém de confiança", (r) => tem(r, "dados", [0, 1, 2])),
    conta("Têm ou tirariam certificado digital", "a porta de entrada do produto", (r) => tem(r, "certificado", [0, 1, 2])),
    conta("Pagariam parte do imposto economizado", "R$ 5 ou mais a cada R$ 100", (r) => tem(r, "pagaImposto", [1, 2, 3, 4])),
    conta("Pagariam taxa sobre o crédito", "de até 1% ou mais", (r) => tem(r, "pagaCredito", [1, 2, 3, 4])),
  ];
}

export interface Etapa {
  rotulo: string;
  regra: string;
  n: number;
}

/**
 * Funil de demanda qualificada. Cada etapa só conta quem passou pelas
 * anteriores, então o último número é gente que está no perfil, tem o problema,
 * quer testar, deixaria o produto ler os dados e consegue entrar.
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
      rotulo: "Sentem a dor",
      regra: "só veem o imposto no fim do ano, ou o crédito demora 15 dias ou mais, ou algo trava o crédito",
      fn: (r) =>
        tem(r, "imposto", [0, 1]) ||
        tem(r, "prazo", [2, 3, 4]) ||
        tem(r, "obstaculos", [0, 1, 2, 3, 4]),
    },
    { rotulo: "Testariam de graça", regra: "“Sim, com certeza”", fn: (r) => tem(r, "teste", [0]) },
    {
      rotulo: "Deixariam ler os dados",
      regra: "sem problema, com alguém que explique ou se a cooperativa ou o contador indicar",
      fn: (r) => tem(r, "dados", [0, 1, 2]),
    },
    {
      rotulo: "Conseguem entrar",
      regra: "têm certificado válido, vencido ou tirariam um",
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
  const cab = ["codigo", "perfil_alvo", ...PERGUNTAS.map((p) => p.id)];
  const linhas = lista.map((e) => [
    e.codigo,
    perfilAlvo(e.respostas) ? "sim" : "nao",
    ...PERGUNTAS.map((p) =>
      (Array.isArray(e.respostas[p.id]) ? rotulos(p.id, e.respostas) : [p.opcoes[e.respostas[p.id] as number].rotulo]).join(" | "),
    ),
  ]);
  return "﻿" + [cab, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
}

export { VERSAO };
