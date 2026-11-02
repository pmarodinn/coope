
/**
 * Números do negócio, revistos em novembro de 2026.
 *
 * Quem paga é o escritório de contabilidade, por produtor atendido. Tudo aqui
 * é hipótese de preço e de meta, a ser testada nas conversas com contadores;
 * nada é resultado. A Coope ainda não tem cliente pagante.
 */

/** Preço por CPF por mês, cobrado do escritório. Hipótese a validar. */
export const PRECO = {
  contribuinte: 120,
  naoContribuinte: 40,
  /** Diagnóstico avulso da opção pelo regime regular, abaixo de R$ 3,6 mi. */
  diagnostico: 600,
} as const;

/** Um escritório de cidade agrícola, como o da demonstração. */
export const ESCRITORIO_TIPICO = { produtores: 30, contribuintes: 12 } as const;

/** Produtores com receita acima de R$ 3,6 mi (RFB, DIRPF atividade rural 2023, via CNA). */
export const PRODUTORES_OBRIGATORIOS = 43_600;

export const METAS = [
  { prazo: "2 semanas", meta: "20 conversas e 5 pilotos manuais", criterio: "3 de 5 contadores dizem que 2027 é problema de capacidade" },
  { prazo: "90 dias", meta: "3 escritórios pagando", criterio: "Cobrança desde o primeiro mês, mesmo que pequena" },
  { prazo: "12 meses", meta: "50 escritórios e 1.500 produtores", criterio: "Churn mensal abaixo de 3%" },
] as const;

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
  /** Fontes adiadas ou removidas ficam marcadas, com o motivo. */
  ressalva: string | null;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function receitaEscritorio() {
  const { produtores, contribuintes } = ESCRITORIO_TIPICO;
  return contribuintes * PRECO.contribuinte + (produtores - contribuintes) * PRECO.naoContribuinte;
}

export function metricas(): Metrica[] {
  const porEscritorio = receitaEscritorio();
  const nucleo = PRODUTORES_OBRIGATORIOS * PRECO.contribuinte * 12;
  return [
    {
      chave: "clientes",
      rotulo: "Escritórios pagando hoje",
      valor: "0",
      nota: "Ponto de partida honesto. A meta de 90 dias é 3.",
    },
    {
      chave: "pesquisa",
      rotulo: "Produtores ouvidos",
      valor: "11",
      nota: "Pesquisa de dor, out/2026. Amostra pequena e fora do perfil-alvo.",
    },
    {
      chave: "escritorio",
      rotulo: "Receita por escritório",
      valor: `${brl(porEscritorio)}/mês`,
      nota: `${ESCRITORIO_TIPICO.produtores} produtores, ${ESCRITORIO_TIPICO.contribuintes} deles contribuintes obrigatórios.`,
    },
    {
      chave: "meta12",
      rotulo: "Meta de 12 meses",
      valor: `R$ ${((porEscritorio * 50 * 12) / 1_000_000).toFixed(1).replace(".", ",")} mi/ano`,
      nota: "50 escritórios × 30 produtores. Hipótese, não projeção.",
    },
    {
      chave: "nucleo",
      rotulo: "Teto do núcleo obrigatório",
      valor: `R$ ${(nucleo / 1_000_000).toFixed(1).replace(".", ",")} mi/ano`,
      nota: `${PRODUTORES_OBRIGATORIOS.toLocaleString("pt-BR")} produtores × ${brl(PRECO.contribuinte)} × 12. Cunha pequena de propósito.`,
    },
    {
      chave: "validacao",
      rotulo: "Custo da validação",
      valor: "2 semanas",
      nota: "Conversas, planilha e WhatsApp. Sem código novo.",
    },
  ];
}

export function fontesReceita(): FonteReceita[] {
  const { produtores, contribuintes } = ESCRITORIO_TIPICO;
  const itens: Omit<FonteReceita, "fatia">[] = [
    {
      nome: "Assinatura por produtor contribuinte",
      comoGanha: `${brl(PRECO.contribuinte)} por CPF por mês: notas, apuração mensal de IBS e CBS conferida contra a pré-apuração do Fisco, livro caixa e alertas.`,
      valorMes: contribuintes * PRECO.contribuinte,
      ressalva: null,
    },
    {
      nome: "Assinatura por produtor não contribuinte",
      comoGanha: `${brl(PRECO.naoContribuinte)} por CPF por mês: CNPJ, notas eletrônicas, livro caixa e acompanhamento do limite de R$ 3,6 mi.`,
      valorMes: (produtores - contribuintes) * PRECO.naoContribuinte,
      ressalva: null,
    },
    {
      nome: "Diagnóstico da opção pelo regime regular",
      comoGanha: `${brl(PRECO.diagnostico)} por produtor abaixo do limite, uma vez por ano, com as notas reais dele.`,
      valorMes: 0,
      ressalva: "Avulso e sazonal (novembro e dezembro). Fica fora da receita recorrente.",
    },
    {
      nome: "Indicação de crédito a parceiros",
      comoGanha: "Comissão paga pelo financiador quando o produtor, com consentimento, leva o histórico mensal a ele.",
      valorMes: 0,
      ressalva: "Fase 3. Só depois de 12 meses de apuração mensal da carteira, e via parceiro regulado.",
    },
    {
      nome: "Success fee sobre economia de imposto",
      comoGanha: "Removida.",
      valorMes: 0,
      ressalva: "A diferença entre resultado real e presunção de 20% é uma escolha que a lei já dá. Cobrar por ela seria vender o que não é nosso.",
    },
    {
      nome: "Float sobre saldo em conta",
      comoGanha: "Removida.",
      valorMes: 0,
      ressalva: "Conta de titularidade do produtor (Res. Conjunta nº 16/2025): o rendimento é dele. E conta saiu do MVP.",
    },
  ];
  const total = itens.reduce((s, i) => s + i.valorMes, 0);
  return itens.map((i) => ({ ...i, fatia: total > 0 ? i.valorMes / total : 0 }));
}

/** Receita base do piloto da cooperativa, mantida para a tela de fase 3. */
const PILOTO = { inadimplenciaBarterAntes: 0.094 } as const;

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
