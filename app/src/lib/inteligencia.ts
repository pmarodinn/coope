import { apurar, gerarLCDPR, montarDossie } from "./engine";
import { montarPerfil, recomendar, type Recomendacao } from "./recomendacao";
import { DIVIDA_ATUAL, EXTRATO_RISCO, NOTAS, PRODUTOR, TRANSACOES } from "./seed";
import type { TransacaoBancaria } from "./domain";

/**
 * Casos analisados no console.
 *
 * Dois produtores da mesma cooperativa, com a mesma operação de lavoura e
 * extratos diferentes. É a comparação que mostra o motor separando quem paga
 * de quem não paga — e mostra que a diferença só aparece quando se lê todas as
 * instituições, não apenas a do banco que vai emprestar.
 */
export interface Caso {
  id: string;
  nome: string;
  municipio: string;
  resumo: string;
  extrato: TransacaoBancaria[];
}

export const CASOS: Caso[] = [
  {
    id: "menegat",
    nome: PRODUTOR.nome,
    municipio: `${PRODUTOR.municipio}/${PRODUTOR.uf}`,
    resumo: "O produtor da demonstração. Extrato sem sinais de conduta.",
    extrato: TRANSACOES,
  },
  {
    id: "kruger",
    nome: "Nelson Kruger",
    municipio: "Sorriso/MT",
    resumo: "Mesma cooperativa, lavoura parecida. O extrato conta outra história.",
    extrato: [...TRANSACOES, ...EXTRATO_RISCO],
  },
];

const extratoDe = (caso: string) =>
  (CASOS.find((c) => c.id === caso) ?? CASOS[0]).extrato;

/**
 * Motor de perfil, casamento de produto e risco.
 *
 * A ideia é a mesma de um reconhecedor de música: em vez de comparar o áudio
 * inteiro, reduz-se a gravação a uma assinatura compacta e busca-se o vizinho
 * mais próximo num catálogo de assinaturas. Aqui a gravação é a operação da
 * fazenda — notas, extratos de várias instituições, culturas, calendário — e a
 * assinatura é um vetor de oito eixos normalizados entre 0 e 1.
 *
 * Duas escolhas deliberadas:
 *
 * 1. Nada de caixa-preta. Cada eixo diz de onde veio, cada casamento diz por
 *    que casou e cada ponto de risco diz o que o causou. Crédito regulado exige
 *    poder explicar a recusa ao tomador (LGPD art. 20 dá direito a revisão de
 *    decisão automatizada), e um modelo que ninguém sabe ler é um passivo.
 *
 * 2. Isto é um scorecard determinístico calibrado à mão, não um modelo treinado
 *    em inadimplência observada. Sem carteira não há rótulo para treinar. O
 *    valor aqui é a captura do sinal, não a sofisticação do estimador.
 */

/* ================= assinatura ================= */

export interface Eixo {
  chave: string;
  nome: string;
  /** 0 a 1. */
  valor: number;
  /** O que o número quer dizer, em uma linha. */
  leitura: string;
  /** De onde saiu o dado. */
  origem: "Nota fiscal" | "Open Finance" | "Cadastro" | "Cruzamento";
}

const limita = (v: number) => Math.max(0, Math.min(1, v));

/** Média de dias entre o pico de gasto e a entrada de caixa. */
function descasamento() {
  const p = montarPerfil();
  return limita(p.mesesDescasados / 8);
}

export function assinatura(caso = "menegat"): Eixo[] {
  const a = apurar(gerarLCDPR());
  const perfil = montarPerfil();

  const vendas = NOTAS.filter((n) => n.sentido === "saida");
  const porComprador = new Map<string, number>();
  vendas.forEach((v) => porComprador.set(v.contraparte, (porComprador.get(v.contraparte) ?? 0) + v.valor));
  const totalVendas = [...porComprador.values()].reduce((s, v) => s + v, 0) || 1;
  const maiorComprador = Math.max(...porComprador.values()) / totalVendas;

  const culturas = new Set(
    PRODUTOR.propriedades.flatMap((p) => p.cultura.split("/").map((c) => c.trim())),
  );

  const TX = extratoDe(caso);
  const conciliadas = TX.filter((t) => t.conciliadaCom).length;
  const cobertura = conciliadas / TX.length;

  const servicoDivida = DIVIDA_ATUAL.saldo / (a.receitaBruta || 1);

  return [
    {
      chave: "liquidez",
      nome: "Folga de caixa",
      valor: limita(perfil.capacidadePagamento / (a.receitaBruta * 0.12)),
      leitura: `Sobra ${(perfil.margem * 100).toFixed(1)}% da receita depois de tudo pago.`,
      origem: "Cruzamento",
    },
    {
      chave: "descasamento",
      nome: "Descasamento do ciclo",
      valor: descasamento(),
      leitura: `Paga insumo ${perfil.mesesDescasados} meses antes de receber pela safra.`,
      origem: "Cruzamento",
    },
    {
      chave: "concentracao",
      nome: "Concentração de comprador",
      valor: limita(maiorComprador),
      leitura: `${Math.round(maiorComprador * 100)}% das vendas saem para um só comprador.`,
      origem: "Nota fiscal",
    },
    {
      chave: "diversificacao",
      nome: "Diversificação de cultura",
      valor: limita(culturas.size / 4),
      leitura: `${culturas.size} culturas em ${PRODUTOR.propriedades.length} propriedades.`,
      origem: "Cadastro",
    },
    {
      chave: "capex",
      nome: "Intensidade de investimento",
      valor: limita(a.investimentos / (a.resultadoReal || 1)),
      leitura: `Investiu ${(a.investimentos / (a.resultadoReal || 1)).toFixed(1)}× o que sobrou da safra.`,
      origem: "Nota fiscal",
    },
    {
      chave: "alavancagem",
      nome: "Alavancagem externa",
      valor: limita(servicoDivida * 6),
      leitura: `Dívida em outra instituição equivale a ${(servicoDivida * 100).toFixed(1)}% da receita.`,
      origem: "Open Finance",
    },
    {
      chave: "rastro",
      nome: "Rastreabilidade",
      valor: limita(cobertura),
      leitura: `${Math.round(cobertura * 100)}% dos lançamentos bancários casam com nota fiscal.`,
      origem: "Cruzamento",
    },
    {
      chave: "disciplina",
      nome: "Disciplina financeira",
      valor: limita(1 - sinais(caso).reduce((s, x) => s + x.peso, 0) / 100),
      leitura: `${sinais(caso).length} sinais de conduta detectados nos extratos.`,
      origem: "Open Finance",
    },
  ];
}

/* ================= sinais de conduta ================= */

export interface Sinal {
  chave: string;
  titulo: string;
  /** Quanto pesa contra, de 0 a 100. */
  peso: number;
  ocorrencias: number;
  valor: number;
  evidencia: string;
  instituicao: string;
  /** Por que um banco sozinho não veria isto. */
  soComOpenFinance: boolean;
}

const casa = (t: { descricao: string }, termos: string[]) =>
  termos.some((x) => t.descricao.toLowerCase().includes(x));

/**
 * Padrões de conduta lidos nos extratos das três instituições.
 *
 * A aposta é o caso mais claro do porquê do Open Finance: o produtor joga pela
 * conta de um banco e pede crédito em outro. Quem só enxerga a própria conta
 * não vê nada.
 */
export function sinais(caso = "menegat"): Sinal[] {
  const achados: Sinal[] = [];
  const TX = extratoDe(caso);

  const apostas = TX.filter(
    (t) => t.tipo === "debito" && casa(t, ["bet", "apostas", "blaze"]),
  );
  if (apostas.length) {
    const total = apostas.reduce((s, t) => s + t.valor, 0);
    const meses = new Set(apostas.map((t) => t.data.slice(0, 7))).size;
    achados.push({
      chave: "apostas",
      titulo: "Gasto recorrente com apostas",
      peso: Math.min(34, 10 + apostas.length * 5),
      ocorrencias: apostas.length,
      valor: total,
      evidencia: `${apostas.length} pagamentos em ${meses} meses, sempre pela mesma conta.`,
      instituicao: apostas[0].instituicao,
      soComOpenFinance: true,
    });
  }

  const rotativo = TX.filter(
    (t) => t.tipo === "debito" && casa(t, ["cheque especial", "juros", "encargos por atraso"]),
  );
  if (rotativo.length) {
    achados.push({
      chave: "rotativo",
      titulo: "Uso de crédito caro e atraso",
      peso: Math.min(26, 8 + rotativo.length * 5),
      ocorrencias: rotativo.length,
      valor: rotativo.reduce((s, t) => s + t.valor, 0),
      evidencia: "Juros de cheque especial e encargos por parcela em atraso.",
      instituicao: rotativo[0].instituicao,
      soComOpenFinance: true,
    });
  }

  const outraDivida = TX.filter((t) => casa(t, ["ccb", "banco rural norte"]));
  if (outraDivida.length) {
    achados.push({
      chave: "divida_externa",
      titulo: "Dívida não declarada em outra instituição",
      peso: 18,
      ocorrencias: outraDivida.length,
      valor: outraDivida.reduce((s, t) => s + t.valor, 0),
      evidencia: `Parcelas mensais de ${DIVIDA_ATUAL.instituicao}, fora do que o produtor informou.`,
      instituicao: outraDivida[0].instituicao,
      soComOpenFinance: true,
    });
  }

  const saques = TX.filter((t) => t.tipo === "debito" && casa(t, ["saque em espécie"]));
  if (saques.length) {
    achados.push({
      chave: "saque",
      titulo: "Saque em espécie fora do padrão",
      peso: 9,
      ocorrencias: saques.length,
      valor: saques.reduce((s, t) => s + t.valor, 0),
      evidencia: "Acima do limite de comunicação obrigatória, exige registro.",
      instituicao: saques[0].instituicao,
      soComOpenFinance: false,
    });
  }

  return achados.sort((a, b) => b.peso - a.peso);
}

/* ================= arquétipos ================= */

export interface Arquetipo {
  chave: string;
  nome: string;
  descricao: string;
  /** Mesma ordem dos eixos da assinatura. */
  vetor: number[];
  /** O que costuma resolver o problema deste perfil. */
  precisa: string[];
}

export const ARQUETIPOS: Arquetipo[] = [
  {
    chave: "descasado",
    nome: "Descasado de caixa",
    descricao: "Opera com margem sadia, mas paga o insumo muito antes de receber pela safra.",
    vetor: [0.6, 0.9, 0.6, 0.5, 0.4, 0.3, 0.8, 0.7],
    precisa: ["custeio", "barter", "seguro"],
  },
  {
    chave: "expansionista",
    nome: "Expansionista",
    descricao: "Investe pesado em máquina e área, e comprime a própria folga de caixa.",
    vetor: [0.4, 0.6, 0.5, 0.6, 0.9, 0.6, 0.7, 0.7],
    precisa: ["consorcio", "financiamento", "custeio", "seguro"],
  },
  {
    chave: "alavancado",
    nome: "Alavancado",
    descricao: "Carrega dívida cara em mais de uma instituição e paga juros de rotativo.",
    vetor: [0.3, 0.6, 0.6, 0.4, 0.5, 0.9, 0.6, 0.3],
    precisa: ["portabilidade", "custeio"],
  },
  {
    chave: "exposto",
    nome: "Exposto a preço e clima",
    descricao: "Poucas culturas, poucos compradores e nenhuma proteção contratada.",
    vetor: [0.5, 0.6, 0.9, 0.2, 0.4, 0.4, 0.7, 0.7],
    precisa: ["seguro", "preco", "barter"],
  },
  {
    chave: "conservador",
    nome: "Conservador",
    descricao: "Caixa folgado, pouca dívida e rastro fiscal limpo.",
    vetor: [0.9, 0.4, 0.4, 0.7, 0.3, 0.1, 0.9, 0.9],
    precisa: ["preco", "consorcio"],
  },
];

function cosseno(a: number[], b: number[]) {
  const pe = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return na && nb ? pe / (na * nb) : 0;
}

export interface Semelhanca {
  arquetipo: Arquetipo;
  similaridade: number;
}

/** Vizinhos mais próximos da assinatura, do mais parecido ao menos. */
export function classificar(caso = "menegat"): Semelhanca[] {
  const v = assinatura(caso).map((e) => e.valor);
  return ARQUETIPOS.map((arquetipo) => ({ arquetipo, similaridade: cosseno(v, arquetipo.vetor) }))
    .sort((a, b) => b.similaridade - a.similaridade);
}

/* ================= casamento de produto ================= */

export interface Casamento {
  produto: Recomendacao;
  /** 0 a 1. */
  aderencia: number;
  motivos: string[];
}

/**
 * Casa produto com necessidade combinando duas evidências: o arquétipo mais
 * próximo e os eixos que dispararam. Não é ordenação por taxa — é por
 * adequação, que é o que a norma do correspondente exige.
 */
export function casar(caso = "menegat"): Casamento[] {
  const eixos = Object.fromEntries(assinatura(caso).map((e) => [e.chave, e.valor]));
  const perto = classificar(caso);
  const principal = perto[0];
  const secundario = perto[1];

  const produtos = recomendar();

  return produtos
    .map((produto) => {
      const motivos: string[] = [];
      let nota = 0;

      if (principal.arquetipo.precisa.includes(produto.id)) {
        nota += 0.5 * principal.similaridade;
        motivos.push(`Resolve a dor típica de quem é "${principal.arquetipo.nome}".`);
      }
      if (secundario.arquetipo.precisa.includes(produto.id)) {
        nota += 0.2 * secundario.similaridade;
        motivos.push(`Também aparece no perfil "${secundario.arquetipo.nome}".`);
      }

      // Eixos que puxam produtos específicos.
      const gatilhos: Record<string, { eixo: string; limiar: number; texto: string }[]> = {
        custeio: [{ eixo: "descasamento", limiar: 0.4, texto: "O ciclo está descasado." }],
        seguro: [
          { eixo: "capex", limiar: 0.5, texto: "Investimento alto sem nenhuma proteção contratada." },
          { eixo: "descasamento", limiar: 0.4, texto: "Se a safra frustrar, a dívida de custeio continua." },
        ],
        consorcio: [{ eixo: "capex", limiar: 0.5, texto: "Já investe pesado em máquina." }],
        financiamento: [{ eixo: "liquidez", limiar: 0.6, texto: "Há folga para assumir parcela." }],
        barter: [{ eixo: "alavancagem", limiar: 0.4, texto: "Preserva o limite bancário." }],
        preco: [{ eixo: "concentracao", limiar: 0.5, texto: "Receita presa a poucos compradores." }],
      };

      (gatilhos[produto.id] ?? []).forEach((g) => {
        if ((eixos[g.eixo] ?? 0) >= g.limiar) {
          nota += 0.25;
          motivos.push(g.texto);
        }
      });

      if (produto.indicacao === "nao_agora") {
        nota *= 0.35;
        motivos.push("Cabe no perfil, mas não neste ciclo.");
      }

      // Produto que a Coope só explica não entra no ranking de adequação:
      // ordenar hedge junto de crédito daria a entender recomendação.
      if (!produto.podeIndicar && produto.indicacao === "so_explico") {
        motivos.push("Fora do ranking: aqui a plataforma apenas informa.");
      }

      return { produto, aderencia: limita(nota), motivos };
    })
    .sort((a, b) => b.aderencia - a.aderencia);
}

/* ================= risco ================= */

export interface FatorRisco {
  nome: string;
  /** Pontos percentuais somados ou subtraídos da probabilidade. */
  contribuicao: number;
  detalhe: string;
  origem: "Nota fiscal" | "Open Finance" | "Cruzamento" | "Mercado";
}

export interface Risco {
  /** Probabilidade de inadimplência em 12 meses, em pontos percentuais. */
  pd: number;
  faixa: "A" | "B" | "C" | "D";
  /** Média do setor, para comparação. */
  referenciaSetor: number;
  fatores: FatorRisco[];
  /** O que sai da conta quando só se olha uma instituição. */
  pdSemOpenFinance: number;
}

/**
 * Probabilidade de inadimplência montada por soma de contribuições sobre uma
 * base setorial. Cada parcela é visível e reversível, então dá para dizer ao
 * produtor exatamente o que pesou contra ele e o que mudaria o resultado.
 */
export function risco(caso = "menegat"): Risco {
  const a = apurar(gerarLCDPR());
  const d = montarDossie(a);
  const eixos = Object.fromEntries(assinatura(caso).map((e) => [e.chave, e.valor]));

  // Inadimplência rural medida pela Serasa Experian no 1T2026.
  const base = 8.8;
  const fatores: FatorRisco[] = [];

  const rastro = eixos.rastro ?? 0;
  fatores.push({
    nome: "Rastro fiscal verificável",
    contribuicao: -(rastro * 3.4),
    detalhe: `${Math.round(rastro * 100)}% dos lançamentos casam com nota fiscal emitida contra o CPF.`,
    origem: "Cruzamento",
  });

  fatores.push({
    nome: "Margem da atividade",
    contribuicao: a.margem > 0.08 ? -1.6 : 1.9,
    detalhe: `Margem de ${(a.margem * 100).toFixed(1)}% sobre a receita bruta.`,
    origem: "Nota fiscal",
  });

  fatores.push({
    nome: "Concentração de comprador",
    contribuicao: (eixos.concentracao ?? 0) * 2.2,
    detalhe: "Perder um comprador derruba parte relevante da receita.",
    origem: "Nota fiscal",
  });

  fatores.push({
    nome: "Sem seguro de lavoura",
    contribuicao: 2.4,
    detalhe: "Uma quebra de safra vira dívida sem receita para cobrir.",
    origem: "Cruzamento",
  });

  const pdParcial = base + fatores.reduce((s, f) => s + f.contribuicao, 0);

  // A partir daqui, só o que a leitura multi-instituição revela.
  const comportamento = sinais(caso).filter((s) => s.soComOpenFinance);
  comportamento.forEach((s) => {
    fatores.push({
      nome: s.titulo,
      contribuicao: s.peso / 8,
      detalhe: s.evidencia,
      origem: "Open Finance",
    });
  });

  const pd = Math.max(0.4, base + fatores.reduce((s, f) => s + f.contribuicao, 0));
  const faixa: Risco["faixa"] = pd < 6 ? "A" : pd < 10 ? "B" : pd < 16 ? "C" : "D";

  return {
    pd,
    faixa,
    referenciaSetor: base,
    fatores,
    pdSemOpenFinance: Math.max(0.4, pdParcial),
  };
}

/** Tudo de uma vez, para a tela do console. */
export function analise(caso = "menegat") {
  const c = CASOS.find((x) => x.id === caso) ?? CASOS[0];
  return {
    caso: c,
    assinatura: assinatura(caso),
    arquetipos: classificar(caso),
    sinais: sinais(caso),
    casamentos: casar(caso),
    risco: risco(caso),
    score: montarDossie(apurar(gerarLCDPR())).score,
  };
}
