import {
  NATUREZA_DEDUTIVEL,
  NATUREZA_LABEL,
  type ApuracaoFiscal,
  type DossieCredito,
  type FatorScore,
  type LancamentoLCDPR,
  type NotaFiscal,
  type TipoDocumento,
  type TransacaoBancaria,
} from "./domain";
import { NOTAS, PRODUTOR, TRANSACOES } from "./seed";

/** Alíquota marginal máxima do IRPF, aplicável ao resultado da atividade rural. */
export const ALIQUOTA_IRPF = 0.275;

/** Percentual de arbitramento do resultado quando a escrituração é inidônea ou ausente. */
export const PERCENTUAL_ARBITRAMENTO = 0.2;

/** Limite de receita bruta que torna o LCDPR obrigatório (IN RFB nº 1.903/2019). */
export const LIMITE_LCDPR = 4_800_000;

const codConta = (instituicao: string) =>
  instituicao.startsWith("Banco do Brasil") ? "001" : instituicao.startsWith("Sicredi") ? "748" : "341";

function tipoDoc(nf: NotaFiscal): TipoDocumento {
  if (nf.natureza === "mao_de_obra") return 5;
  if (nf.natureza === "arrendamento") return 4;
  return 1;
}

/**
 * Gera o livro caixa no regime de caixa: o lançamento nasce da NF-e, mas a
 * data que vale para a apuração é a da liquidação bancária correspondente.
 */
export function gerarLCDPR(
  notas: NotaFiscal[] = NOTAS,
  transacoes: TransacaoBancaria[] = TRANSACOES,
): LancamentoLCDPR[] {
  const porChave = new Map(transacoes.filter((t) => t.conciliadaCom).map((t) => [t.conciliadaCom!, t]));

  const lancamentos: LancamentoLCDPR[] = notas
    .filter((nf) => porChave.has(nf.chave))
    .map((nf) => {
      const tx = porChave.get(nf.chave)!;
      const receita = nf.sentido === "saida";
      return {
        data: tx.data,
        codImovel: nf.propriedadeId,
        codConta: codConta(tx.instituicao),
        numDoc: nf.numero,
        tipoDoc: tipoDoc(nf),
        historico: `${NATUREZA_LABEL[nf.natureza]} — ${nf.contraparte}`,
        idPartic: nf.cnpjContraparte,
        tipoLanc: receita ? (1 as const) : (2 as const),
        valorEntrada: receita ? nf.valor : 0,
        valorSaida: receita ? 0 : nf.valor,
        saldoFinal: 0,
        naturezaSaldo: "P" as const,
        natureza: nf.natureza,
        origem: "NF-e" as const,
      };
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  let saldo = 0;
  for (const l of lancamentos) {
    saldo += l.valorEntrada - l.valorSaida;
    l.saldoFinal = Math.abs(saldo);
    l.naturezaSaldo = saldo >= 0 ? "P" : "N";
  }

  return lancamentos;
}

export function apurar(lancamentos: LancamentoLCDPR[] = gerarLCDPR()): ApuracaoFiscal {
  const receitaBruta = lancamentos
    .filter((l) => l.tipoLanc === 1)
    .reduce((s, l) => s + l.valorEntrada, 0);

  const despesasCusteio = lancamentos
    .filter((l) => l.tipoLanc === 2 && NATUREZA_DEDUTIVEL[l.natureza] && l.natureza !== "investimento_maquina")
    .reduce((s, l) => s + l.valorSaida, 0);

  const investimentos = lancamentos
    .filter((l) => l.natureza === "investimento_maquina")
    .reduce((s, l) => s + l.valorSaida, 0);

  const resultadoReal = Math.max(0, receitaBruta - despesasCusteio - investimentos);
  const baseArbitrada = receitaBruta * PERCENTUAL_ARBITRAMENTO;

  const irSobreResultadoReal = resultadoReal * ALIQUOTA_IRPF;
  const irSobreBaseArbitrada = baseArbitrada * ALIQUOTA_IRPF;

  const conciliadas = TRANSACOES.filter((t) => t.conciliadaCom).length;

  return {
    receitaBruta,
    despesasCusteio,
    investimentos,
    resultadoReal,
    baseArbitrada,
    irSobreResultadoReal,
    irSobreBaseArbitrada,
    economiaTributaria: Math.max(0, irSobreBaseArbitrada - irSobreResultadoReal),
    margem: receitaBruta > 0 ? resultadoReal / receitaBruta : 0,
    lancamentos: lancamentos.length,
    cobertura: {
      notasProcessadas: NOTAS.length,
      transacoesConciliadas: conciliadas,
      transacoesTotais: TRANSACOES.length,
      percentual: TRANSACOES.length > 0 ? conciliadas / TRANSACOES.length : 0,
    },
  };
}

/** Hash curto e determinístico usado como referência de auditoria na demo. */
export function hashCurto(entrada: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < entrada.length; i += 1) {
    h ^= entrada.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function montarDossie(apuracao: ApuracaoFiscal = apurar()): DossieCredito {
  const margem = apuracao.margem;
  const cobertura = apuracao.cobertura.percentual;
  const hectares = PRODUTOR.propriedades.reduce((s, p) => s + p.hectares, 0);
  const receitaPorHectare = apuracao.receitaBruta / hectares;
  const crescimento =
    (apuracao.receitaBruta - PRODUTOR.receitaBrutaAnterior) / PRODUTOR.receitaBrutaAnterior;

  const fatores: FatorScore[] = [
    {
      chave: "cobertura",
      rotulo: "Cobertura documental",
      descricao: `${(cobertura * 100).toFixed(1)}% das movimentações bancárias têm documento fiscal correspondente`,
      pontos: Math.round(cobertura * 220),
      pontosMaximos: 220,
      verificavel: true,
      fonte: "SEFAZ · NFeDistribuicaoDFe + Open Finance",
    },
    {
      chave: "margem",
      rotulo: "Margem da atividade rural",
      descricao: `Resultado de ${(margem * 100).toFixed(1)}% sobre a receita bruta apurada no regime de caixa`,
      pontos: Math.round(Math.min(1, margem / 0.12) * 190),
      pontosMaximos: 190,
      verificavel: true,
      fonte: "Motor fiscal LCDPR",
    },
    {
      chave: "produtividade",
      rotulo: "Receita por hectare",
      descricao: `R$ ${receitaPorHectare.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ha em ${hectares.toLocaleString("pt-BR")} ha sob manejo`,
      pontos: Math.round(Math.min(1, receitaPorHectare / 8000) * 160),
      pontosMaximos: 160,
      verificavel: true,
      fonte: "NF-e de venda + CAR das propriedades",
    },
    {
      chave: "crescimento",
      rotulo: "Evolução de receita",
      descricao: `${crescimento >= 0 ? "+" : ""}${(crescimento * 100).toFixed(1)}% frente ao exercício anterior`,
      pontos: Math.round(Math.min(1, Math.max(0, crescimento / 0.2)) * 130),
      pontosMaximos: 130,
      verificavel: true,
      fonte: "Série histórica LCDPR",
    },
    {
      chave: "diversificacao",
      rotulo: "Diversificação de contraparte",
      descricao: `Comercialização distribuída entre ${new Set(NOTAS.filter((n) => n.sentido === "saida").map((n) => n.contraparte)).size} compradores distintos`,
      pontos: 120,
      pontosMaximos: 140,
      verificavel: true,
      fonte: "NF-e de saída",
    },
    {
      chave: "conformidade",
      rotulo: "Conformidade fiscal contínua",
      descricao: "LCDPR apurado em tempo real, sem pendência de escrituração no exercício corrente",
      pontos: 150,
      pontosMaximos: 160,
      verificavel: true,
      fonte: "Motor fiscal LCDPR",
    },
  ];

  const score = fatores.reduce((s, f) => s + f.pontos, 0);
  const faixa: DossieCredito["faixa"] =
    score >= 850 ? "AA" : score >= 720 ? "A" : score >= 600 ? "B" : score >= 480 ? "C" : "D";

  // Capacidade de pagamento derivada do resultado apurado, com margem de segurança.
  const capacidadePagamento = apuracao.resultadoReal * 0.6;
  const limiteSugerido = Math.round((capacidadePagamento * 2.3) / 100_000) * 100_000;

  const verificaveis = fatores.filter((f) => f.verificavel).reduce((s, f) => s + f.pontosMaximos, 0);
  const totalMax = fatores.reduce((s, f) => s + f.pontosMaximos, 0);

  return {
    score,
    faixa,
    fatores,
    capacidadePagamento,
    limiteSugerido,
    lastroVerificavel: verificaveis / totalMax,
    geradoEm: "2026-08-05T09:41:00-03:00",
    hash: hashCurto(`${PRODUTOR.cpf}:${score}:${apuracao.receitaBruta}`),
  };
}

export const brl = (v: number, opts: Intl.NumberFormatOptions = {}) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
    ...opts,
  });

export const brlCompacto = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2).replace(".", ",")} mi`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)} mil`;
  return brl(v);
};

export const pct = (v: number, casas = 1) => `${(v * 100).toFixed(casas).replace(".", ",")}%`;

export const dataBR = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};
