// Tipos do domínio Coope — camada de orquestração entre dado fiscal,
// infraestrutura bancária (BaaS) e capital privado (Fiagro/bancos).

/** Tipo de lançamento do LCDPR (registro Q100, campo TIPO_LANC). */
export type TipoLancamento = 1 | 2; // 1 = receita da atividade rural, 2 = despesa

/** Tipo de documento do LCDPR (registro Q100, campo TIPO_DOC). */
export type TipoDocumento = 1 | 2 | 3 | 4 | 5 | 6;

export const TIPO_DOC_LABEL: Record<TipoDocumento, string> = {
  1: "Nota fiscal",
  2: "Fatura",
  3: "Recibo",
  4: "Contrato",
  5: "Folha de pagamento",
  6: "Outros",
};

/** Natureza econômica usada para classificar despesas dentro da atividade rural. */
export type Natureza =
  | "receita_producao"
  | "insumo_fertilizante"
  | "insumo_defensivo"
  | "insumo_semente"
  | "combustivel"
  | "servico_operacional"
  | "arrendamento"
  | "mao_de_obra"
  | "investimento_maquina"
  | "nao_rural";

export const NATUREZA_LABEL: Record<Natureza, string> = {
  receita_producao: "Receita de produção",
  insumo_fertilizante: "Fertilizantes",
  insumo_defensivo: "Defensivos",
  insumo_semente: "Sementes",
  combustivel: "Combustível",
  servico_operacional: "Serviços operacionais",
  arrendamento: "Arrendamento",
  mao_de_obra: "Mão de obra",
  investimento_maquina: "Investimento (máquinas)",
  nao_rural: "Não dedutível (pessoal)",
};

/**
 * Despesas de custeio deduzem o resultado da atividade rural no exercício.
 * Investimentos em bens da atividade rural também são dedutíveis no regime de
 * caixa do produtor PF; gastos pessoais não são.
 */
export const NATUREZA_DEDUTIVEL: Record<Natureza, boolean> = {
  receita_producao: false,
  insumo_fertilizante: true,
  insumo_defensivo: true,
  insumo_semente: true,
  combustivel: true,
  servico_operacional: true,
  arrendamento: true,
  mao_de_obra: true,
  investimento_maquina: true,
  nao_rural: false,
};

export interface Propriedade {
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  /** Código do imóvel no LCDPR (cadastro CAFIR/NIRF). */
  codImovel: string;
  car: string;
  hectares: number;
  cultura: string;
}

export interface Produtor {
  nome: string;
  cpf: string;
  inscricaoEstadual: string;
  municipio: string;
  uf: string;
  safra: string;
  /** Receita bruta declarada no exercício anterior. */
  receitaBrutaAnterior: number;
  propriedades: Propriedade[];
  certificadoDigital: {
    tipo: "e-CPF A1" | "e-CPF A3";
    validade: string;
    status: "valido" | "a_vencer" | "vencido";
  };
}

/** Documento fiscal eletrônico obtido via web service NFeDistribuicaoDFe. */
export interface NotaFiscal {
  chave: string;
  /** Número Sequencial Único atribuído pelo Ambiente Nacional da NF-e. */
  nsu: number;
  numero: string;
  serie: string;
  emissao: string;
  /** "saida" = produtor emitente (venda); "entrada" = produtor destinatário (compra). */
  sentido: "entrada" | "saida";
  contraparte: string;
  cnpjContraparte: string;
  valor: number;
  natureza: Natureza;
  propriedadeId: string;
  /** Confiança da classificação automática (0–1). */
  confianca: number;
  cfop: string;
}

/** Lançamento bancário obtido via Open Finance (APIs FAPI, sob consentimento). */
export interface TransacaoBancaria {
  id: string;
  instituicao: string;
  conta: string;
  data: string;
  valor: number;
  tipo: "credito" | "debito";
  descricao: string;
  /** Chave da NF-e conciliada, quando o motor encontrou correspondência. */
  conciliadaCom: string | null;
}

/** Linha do Livro Caixa Digital do Produtor Rural (registro Q100). */
export interface LancamentoLCDPR {
  data: string;
  codImovel: string;
  codConta: string;
  numDoc: string;
  tipoDoc: TipoDocumento;
  historico: string;
  idPartic: string;
  tipoLanc: TipoLancamento;
  valorEntrada: number;
  valorSaida: number;
  saldoFinal: number;
  naturezaSaldo: "P" | "N";
  natureza: Natureza;
  origem: "NF-e" | "Open Finance" | "Captura WhatsApp";
}

export interface ApuracaoFiscal {
  receitaBruta: number;
  despesasCusteio: number;
  investimentos: number;
  resultadoReal: number;
  /** Base arbitrada em 20% da receita bruta (IN RFB 83/2001, art. 23-A). */
  baseArbitrada: number;
  irSobreResultadoReal: number;
  irSobreBaseArbitrada: number;
  economiaTributaria: number;
  /** Percentual do resultado sobre a receita bruta. */
  margem: number;
  lancamentos: number;
  cobertura: {
    notasProcessadas: number;
    transacoesConciliadas: number;
    transacoesTotais: number;
    percentual: number;
  };
}

export interface FatorScore {
  chave: string;
  rotulo: string;
  descricao: string;
  /** Contribuição em pontos para o score final. */
  pontos: number;
  pontosMaximos: number;
  /** Se o fator é verificável em dado primário ou apenas declarado. */
  verificavel: boolean;
  fonte: string;
}

export interface DossieCredito {
  score: number;
  faixa: "AA" | "A" | "B" | "C" | "D";
  fatores: FatorScore[];
  capacidadePagamento: number;
  limiteSugerido: number;
  /** Percentual do dossiê lastreado em dado primário verificável. */
  lastroVerificavel: number;
  geradoEm: string;
  hash: string;
}

export interface OfertaFunding {
  id: string;
  financiador: string;
  tipo: "Fiagro" | "Banco" | "Securitizadora";
  cnpj: string;
  taxaAnual: number;
  /** Custo efetivo total, incluindo tarifas e encargos. */
  cetAnual: number;
  prazoMeses: number;
  limite: number;
  /** Horas estimadas entre submissão e desembolso. */
  timeToMoneyHoras: number;
  garantia: string;
  travaFinalidade: boolean;
  status: "analisando" | "aprovada" | "recusada";
  observacao: string;
}

export interface ContaIndividualizada {
  /** Titularidade é do produtor na instituição prestadora — nunca da Coope. */
  titular: string;
  cpfTitular: string;
  instituicaoPrestadora: string;
  ispb: string;
  agencia: string;
  numero: string;
  tipo: "Conta de pagamento";
  saldo: number;
  abertaEm: string;
  papelCoope: "Iniciadora de transação sob consentimento do titular";
}

export interface TravaFinalidade {
  id: string;
  beneficiario: string;
  cnpj: string;
  finalidade: string;
  valor: number;
  status: "pendente" | "liquidado";
  liquidadoEm: string | null;
  e2e: string | null;
}

export interface EventoAuditoria {
  id: string;
  ts: string;
  camada: "Ingestão" | "Motor fiscal" | "Dossiê" | "Originação" | "Liquidação" | "Compliance";
  evento: string;
  detalhe: string;
  baseLegal: string;
  hash: string;
}

export interface ChecklistConformidade {
  chave: string;
  titulo: string;
  norma: string;
  status: "conforme" | "atencao" | "pendente";
  detalhe: string;
}
