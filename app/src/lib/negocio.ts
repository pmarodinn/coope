import { apurar, gerarLCDPR } from "./engine";
import { NOTAS } from "./seed";

/**
 * Números do negócio e da carteira de uma cooperativa parceira.
 *
 * A escala é sintética — um piloto plausível —, mas as taxas e o ticket médio
 * derivam do produtor real da demo, para que as contas fechem entre as telas.
 */

/**
 * Piloto: uma cooperativa do Mato Grosso.
 *
 * O produtor da demo é grande (R$ 21,5 mi de receita) e não representa a média
 * da carteira. Projetar a economia dele sobre os 184 produtores inflaria a
 * receita, então o ticket e a economia média são calibrados para baixo.
 */
const PILOTO = {
  produtoresAtivos: 184,
  cooperativas: 1,
  /** Um custeio por produtor por ciclo, distribuído ao longo do ano. */
  operacoesMes: 15,
  ticketMedio: 1_500_000,
  /** Média da carteira, não o caso do produtor da demo. */
  economiaMediaAnual: 285_000,
  taxaAprovacao: 0.72,
  timeToMoneyHoras: 11,
  /** Inadimplência do barter da cooperativa antes da plataforma. */
  inadimplenciaBarterAntes: 0.094,
};

/** Faixas do Lean Canvas, no piso conservador. */
export const RECEITA = {
  takeRate: 0.02,
  successFee: 0.1,
  rebatePorOperacao: 4_200,
} as const;

export interface Metrica {
  chave: string;
  rotulo: string;
  valor: string;
  nota: string;
}

export interface FonteReceita {
  nome: string;
  comoGanha: string;
  valorMes: number;
  fatia: number;
  /** Fontes que dependem de validação regulatória ficam marcadas. */
  ressalva: string | null;
}

function base() {
  const a = apurar(gerarLCDPR());
  const gmvMes = PILOTO.operacoesMes * PILOTO.ticketMedio;
  return { a, ticketCredito: PILOTO.ticketMedio, gmvMes };
}

export function metricas(): Metrica[] {
  const { a, gmvMes, ticketCredito } = base();
  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return [
    {
      chave: "gmv",
      rotulo: "Crédito originado no mês",
      valor: `R$ ${(gmvMes / 1_000_000).toFixed(1).replace(".", ",")} mi`,
      nota: `${PILOTO.operacoesMes} operações · ticket médio de ${brl(ticketCredito)}`,
    },
    {
      chave: "produtores",
      rotulo: "Produtores ativos",
      valor: String(PILOTO.produtoresAtivos),
      nota: "Numa cooperativa parceira",
    },
    {
      chave: "notas",
      rotulo: "Notas processadas no ciclo",
      valor: (PILOTO.produtoresAtivos * NOTAS.length).toLocaleString("pt-BR"),
      nota: "Capturadas da SEFAZ, sem digitação",
    },
    {
      chave: "ttm",
      rotulo: "Time-to-money médio",
      valor: `${PILOTO.timeToMoneyHoras} h`,
      nota: "Contra 45 a 60 dias no ciclo tradicional",
    },
    {
      chave: "aprovacao",
      rotulo: "Aprovação nos Fiagros",
      valor: `${Math.round(PILOTO.taxaAprovacao * 100)}%`,
      nota: "Dos dossiês submetidos a financiadores parceiros",
    },
    {
      chave: "economia",
      rotulo: "Economia tributária média",
      valor: brl(PILOTO.economiaMediaAnual),
      nota: `Por produtor, no ano. O caso da demo (${brl(a.economiaTributaria)}) é de um produtor grande, acima da média.`,
    },
  ];
}

export function fontesReceita(): FonteReceita[] {
  const { gmvMes } = base();

  const take = gmvMes * RECEITA.takeRate;
  const success =
    (PILOTO.economiaMediaAnual * RECEITA.successFee * PILOTO.produtoresAtivos) / 12;
  const rebate = PILOTO.operacoesMes * RECEITA.rebatePorOperacao;
  const float = 0;

  const total = take + success + rebate + float;

  const itens: Omit<FonteReceita, "fatia">[] = [
    {
      nome: "Take rate sobre o crédito",
      comoGanha: `${(RECEITA.takeRate * 100).toFixed(0)}% do volume originado para os financiadores parceiros. A faixa do plano vai de 1% a 3%.`,
      valorMes: take,
      ressalva: null,
    },
    {
      nome: "Success fee sobre o imposto",
      comoGanha: `${(RECEITA.successFee * 100).toFixed(0)}% da economia tributária efetivamente comprovada, calculada sobre a média da carteira.`,
      valorMes: success,
      ressalva: null,
    },
    {
      nome: "Rebate de seguro e hedge",
      comoGanha: "Corretagem repassada pela corretora parceira registrada.",
      valorMes: rebate,
      ressalva: "Depende de parceria com corretora habilitada na SUSEP.",
    },
    {
      nome: "Float sobre saldo parado",
      comoGanha: "Remuneração do saldo em repouso nas contas.",
      valorMes: float,
      ressalva:
        "Não considerado. Com contas de titularidade do produtor, a remuneração do saldo é do titular — a Res. Conjunta nº 16/2025 esvazia essa linha de receita.",
    },
  ];

  return itens.map((i) => ({ ...i, fatia: total > 0 ? i.valorMes / total : 0 }));
}

/* ---------------- carteira da cooperativa ---------------- */

export interface ProdutorCarteira {
  nome: string;
  municipio: string;
  hectares: number;
  faixa: "AA" | "A" | "B" | "C";
  pedido: number;
  status: "pago" | "aprovado" | "analise";
}

export interface Cooperativa {
  nome: string;
  cnpj: string;
  produtores: number;
  /** Vendas de insumo viabilizadas pela plataforma no ciclo. */
  sellOut: number;
  /** Quanto disso a cooperativa recebeu à vista, sem financiar o produtor. */
  recebidoAVista: number;
  /** Risco de crédito que ela deixou de carregar no balanço. */
  riscoNaoAssumido: number;
  inadimplenciaAntes: number;
  inadimplenciaAgora: number;
  carteira: ProdutorCarteira[];
}

export function cooperativa(): Cooperativa {
  const carteira: ProdutorCarteira[] = [
    { nome: "José A. Menegat", municipio: "Sorriso", hectares: 2900, faixa: "A", pedido: 2_400_000, status: "pago" },
    { nome: "Irmãos Bertolini", municipio: "Lucas do Rio Verde", hectares: 4100, faixa: "AA", pedido: 3_850_000, status: "pago" },
    { nome: "Agropecuária Vale Verde", municipio: "Nova Mutum", hectares: 1750, faixa: "A", pedido: 1_620_000, status: "aprovado" },
    { nome: "Nelson Kruger", municipio: "Sorriso", hectares: 980, faixa: "B", pedido: 740_000, status: "aprovado" },
    { nome: "Fazenda Três Barras", municipio: "Sinop", hectares: 2240, faixa: "A", pedido: 1_980_000, status: "analise" },
    { nome: "Salete Boff", municipio: "Nova Mutum", hectares: 620, faixa: "B", pedido: 465_000, status: "analise" },
  ];

  const sellOut = carteira.reduce((s, p) => s + p.pedido, 0);
  const recebido = carteira
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + p.pedido, 0);

  return {
    nome: "Cooperativa Agroindustrial Cooagri",
    cnpj: "03.817.442/0001-56",
    produtores: 184,
    sellOut,
    recebidoAVista: recebido,
    riscoNaoAssumido: recebido,
    inadimplenciaAntes: PILOTO.inadimplenciaBarterAntes,
    inadimplenciaAgora: 0,
    carteira,
  };
}
