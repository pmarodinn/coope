import type { Natureza } from "./domain";
import { apurar, gerarLCDPR } from "./engine";
import { NOTAS, PRODUTOR, TRANSACOES } from "./seed";

/**
 * Reforma tributária do consumo (EC 132/2023, LC 214/2025) vista do produtor
 * rural e do escritório que o atende.
 *
 * Aqui só entram regras publicadas e premissas declaradas. O que ainda depende
 * de ato do governo (a alíquota de referência que o Senado fixa até 15/12/2026,
 * o percentual de crédito presumido divulgado a cada ano) aparece como
 * premissa, com a fonte ao lado, para o contador trocar pelo número oficial.
 */

/** Receita anual até a qual o produtor não é contribuinte de IBS/CBS (LC 214/2025, art. 164). */
export const LIMITE_NAO_CONTRIBUINTE = 3_600_000;

/**
 * Quem está fora e passa do limite durante o ano: se o excesso for de até 20%
 * (R$ 4,32 milhões), só entra no ano seguinte; acima disso, a partir do segundo
 * mês depois do excesso.
 */
export const TOLERANCIA = 0.2;

/** Abaixo do limite, mas perto o bastante para precisar de acompanhamento mensal. */
const FAIXA_ATENCAO = 0.85;

/**
 * Alíquota de referência da CBS calculada pelo TCU em 28/10/2026. Em 2027 e
 * 2028 a CBS é cobrada com 0,1 ponto a menos e o IBS fica em 0,1% (teste).
 */
export const CBS_REFERENCIA_2027 = 0.113;
export const IBS_2027 = 0.001;
export const CBS_2027 = CBS_REFERENCIA_2027 - IBS_2027;

/** Produtos agropecuários in natura e insumos agropecuários: redução de 60%. */
export const REDUCAO_AGRO = 0.6;

export const PRAZOS = {
  nfeEletronica: "2026-01-05",
  camposAutuaveis: "2026-08-01",
  tcuAliquota: "2026-10-28",
  senadoAliquota: "2026-12-15",
  receitaDefine: "2026-12-31",
  cbsECnpj: "2027-01-01",
} as const;

export const FONTES_REFORMA = [
  "LC nº 214/2025, arts. 164 a 168 (produtor rural não contribuinte, opção e crédito presumido)",
  "Ajuste SINIEF nº 27/2024 (NF-e obrigatória para todo produtor desde 05/01/2026)",
  "TCU, 28/10/2026: alíquota de referência da CBS de 11,3%; Senado fixa até 15/12/2026",
  "Receita Federal e CGIBS: CNPJ obrigatório para o produtor PF a partir de 01/01/2027",
] as const;

export type Enquadramento = "obrigatorio" | "perto" | "opcional";

/** A receita de um ano define a situação no ano seguinte: a de 2026 decide 2027. */
export function enquadrar(receitaAnual: number): Enquadramento {
  if (receitaAnual > LIMITE_NAO_CONTRIBUINTE) return "obrigatorio";
  if (receitaAnual >= LIMITE_NAO_CONTRIBUINTE * FAIXA_ATENCAO) return "perto";
  return "opcional";
}

export const ROTULO_ENQUADRAMENTO: Record<Enquadramento, string> = {
  obrigatorio: "Contribuinte obrigatório",
  perto: "Perto do limite",
  opcional: "Pode escolher",
};

export function diasAte(iso: string, hoje = new Date()): number {
  const alvo = new Date(`${iso}T00:00:00-03:00`).getTime();
  return Math.max(0, Math.ceil((alvo - hoje.getTime()) / 86_400_000));
}

/* ---------------- simulação do produtor da demonstração ---------------- */

type Tratamento = "debito" | "credito" | "diferido" | "zero" | "fora";

/**
 * Como cada natureza entra na conta. É a parte que mais muda conforme o caso
 * concreto, por isso fica em uma tabela que o contador consegue revisar.
 */
const TRATAMENTO: Record<Natureza, { como: Tratamento; nota: string }> = {
  receita_producao: { como: "debito", nota: "Venda no mercado interno a contribuinte, com redução de 60%" },
  insumo_fertilizante: { como: "diferido", nota: "Insumo agropecuário: imposto diferido para a venda da produção" },
  insumo_defensivo: { como: "diferido", nota: "Insumo agropecuário: imposto diferido para a venda da produção" },
  insumo_semente: { como: "diferido", nota: "Insumo agropecuário: imposto diferido para a venda da produção" },
  combustivel: { como: "credito", nota: "Premissa: crédito à alíquota cheia" },
  servico_operacional: { como: "credito", nota: "Premissa: crédito à alíquota cheia" },
  arrendamento: { como: "fora", nota: "Arrendador pessoa física, sem crédito" },
  mao_de_obra: { como: "fora", nota: "Folha não gera IBS/CBS" },
  investimento_maquina: { como: "zero", nota: "Máquinas e implementos com alíquota zero" },
  nao_rural: { como: "fora", nota: "Gasto pessoal, sem crédito" },
};

const ALIQUOTA_CHEIA = CBS_2027 + IBS_2027;
const ALIQUOTA_AGRO = ALIQUOTA_CHEIA * (1 - REDUCAO_AGRO);

export interface MesReforma {
  mes: string;
  debito: number;
  credito: number;
}

export interface ItemChecklist {
  chave: string;
  titulo: string;
  estado: "ok" | "atencao" | "pendente" | "nao_se_aplica";
  detalhe: string;
  prazo: string | null;
}

export interface Reforma {
  receitaAnual: number;
  enquadramento: Enquadramento;
  diasParaCbs: number;
  aliquotas: { cbs: number; ibs: number; cheia: number; agro: number };
  anual: { vendas: number; debito: number; credito: number; diferido: number; saldo: number };
  meses: MesReforma[];
  checklist: ItemChecklist[];
  premissas: string[];
  extratos: { instituicoes: number; conciliadas: number; total: number; semNota: number };
  fontes: readonly string[];
}

const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function reformaDoProdutor(hoje = new Date()): Reforma {
  const a = apurar(gerarLCDPR());
  const receitaAnual = a.receitaBruta;

  let vendas = 0;
  let debito = 0;
  let credito = 0;
  let diferido = 0;
  const porMes = new Map<number, MesReforma>();

  for (const n of NOTAS) {
    const t = TRATAMENTO[n.natureza];
    const m = Number(n.emissao.slice(5, 7)) - 1;
    const linha = porMes.get(m) ?? { mes: MES[m], debito: 0, credito: 0 };
    if (t.como === "debito") {
      vendas += n.valor;
      const v = n.valor * ALIQUOTA_AGRO;
      debito += v;
      linha.debito += v;
    } else if (t.como === "credito") {
      const v = n.valor * ALIQUOTA_CHEIA;
      credito += v;
      linha.credito += v;
    } else if (t.como === "diferido") {
      diferido += n.valor * ALIQUOTA_AGRO;
    }
    porMes.set(m, linha);
  }

  // Calendário de 2027, de janeiro a dezembro, repetindo a safra observada.
  const meses = Array.from({ length: 12 }, (_, m) => porMes.get(m) ?? { mes: MES[m], debito: 0, credito: 0 });

  // Notas de venda emitidas depois de 01/08/2026, quando a falta dos campos
  // de IBS/CBS passou a poder gerar autuação. Uma delas saiu sem os campos.
  const vendasDesdeAgosto = NOTAS.filter(
    (n) => n.sentido === "saida" && n.emissao >= PRAZOS.camposAutuaveis,
  );
  const semCampos = vendasDesdeAgosto.length > 0 ? 1 : 0;

  const conciliadas = TRANSACOES.filter((t) => t.conciliadaCom).length;
  const instituicoes = new Set(TRANSACOES.map((t) => t.instituicao)).size;

  const checklist: ItemChecklist[] = [
    {
      chave: "enquadramento",
      titulo: "Situação em 2027",
      estado: "atencao",
      detalhe: `Receita de ${milhoes(receitaAnual)}: acima de R$ 3,6 milhões. Em 2027 você recolhe IBS e CBS todo mês.`,
      prazo: PRAZOS.cbsECnpj,
    },
    {
      chave: "cnpj",
      titulo: "CNPJ de produtor rural",
      estado: "pendente",
      detalhe:
        "Obrigatório para o produtor pessoa física. Não vira empresa: você continua pessoa física, o CNPJ só identifica a atividade.",
      prazo: PRAZOS.cbsECnpj,
    },
    {
      chave: "campos",
      titulo: "IBS e CBS nas notas de venda",
      estado: semCampos > 0 ? "atencao" : "ok",
      detalhe:
        semCampos > 0
          ? `${semCampos} de ${vendasDesdeAgosto.length} notas de venda desde agosto saiu sem os campos. Desde 01/08/2026 isso pode gerar autuação se não for corrigido em 60 dias após a intimação.`
          : "Todas as notas de venda desde agosto têm os campos.",
      prazo: null,
    },
    {
      chave: "certificado",
      titulo: "Certificado digital",
      estado: "atencao",
      detalhe: `${PRODUTOR.certificadoDigital.tipo} vence em ${PRODUTOR.certificadoDigital.validade}. Sem ele não sai nota nem livro caixa.`,
      prazo: null,
    },
    {
      chave: "extratos",
      titulo: "Bancos conectados (Open Finance)",
      estado: "ok",
      detalhe: `${instituicoes} bancos ligados com a sua autorização. É o extrato que diz a data do pagamento, que é a que vale para o imposto de renda.`,
      prazo: null,
    },
    {
      chave: "opcao",
      titulo: "Opção pelo regime regular",
      estado: "nao_se_aplica",
      detalhe: "Não se aplica: acima de R$ 3,6 milhões a entrada é obrigatória.",
      prazo: null,
    },
  ];

  return {
    receitaAnual,
    enquadramento: enquadrar(receitaAnual),
    diasParaCbs: diasAte(PRAZOS.cbsECnpj, hoje),
    aliquotas: { cbs: CBS_2027, ibs: IBS_2027, cheia: ALIQUOTA_CHEIA, agro: ALIQUOTA_AGRO },
    anual: { vendas, debito, credito, diferido, saldo: debito - credito },
    meses,
    checklist,
    premissas: [
      "CBS de 11,2% e IBS de 0,1% em 2027, a partir da referência de 11,3% calculada pelo TCU. O Senado pode mudar até 15/12/2026.",
      "Vendas no mercado interno, a compradores contribuintes, com a redução de 60% dos produtos agropecuários in natura. Venda para exportação tem regra própria e ficou de fora.",
      "Adubo, defensivo e semente com imposto diferido: não pagam na compra e não geram crédito.",
      "Combustível e serviços geram crédito à alíquota cheia. Máquinas têm alíquota zero.",
      "Mesma safra do ano passado, repetida no calendário de 2027.",
    ],
    extratos: {
      instituicoes,
      conciliadas,
      total: TRANSACOES.length,
      semNota: TRANSACOES.length - conciliadas,
    },
    fontes: FONTES_REFORMA,
  };
}

/* ---------------- carteira do escritório ---------------- */

export type Extrato = "open_finance" | "ofx" | "faltando";

export interface ClienteCarteira {
  id: string;
  nome: string;
  municipio: string;
  cultura: string;
  receita: number;
  enquadramento: Enquadramento;
  cnpj: "feito" | "pendente";
  notasSemCampos: number;
  certificado: "valido" | "vence" | "vencido";
  extratos: Extrato;
  movSemNota: number;
  ir: { melhor: "resultado" | "presumido"; diferenca: number };
  decisao: "nao_se_aplica" | "pendente" | "ficar_fora" | "entrar";
  proxima: string;
  urgencia: 1 | 2 | 3;
}

export interface Carteira {
  escritorio: string;
  cidade: string;
  diasParaCbs: number;
  clientes: ClienteCarteira[];
  resumo: {
    produtores: number;
    obrigatorios: number;
    cnpjPendente: number;
    notasSemCampos: number;
    decisoesPendentes: number;
    openFinance: number;
    semExtrato: number;
  };
}

/**
 * Doze clientes de um escritório de Sorriso/MT. Todos fictícios. O primeiro é
 * o produtor da demonstração, com os números saídos do motor fiscal; os demais
 * cobrem as situações que o escritório vai encontrar em janeiro.
 */
export function carteiraDoEscritorio(hoje = new Date()): Carteira {
  const a = apurar(gerarLCDPR());
  const conciliadas = TRANSACOES.filter((t) => t.conciliadaCom).length;

  const base: Omit<ClienteCarteira, "enquadramento" | "urgencia">[] = [
    {
      id: "menegat",
      nome: PRODUTOR.nome,
      municipio: "Sorriso/MT",
      cultura: "Soja e milho",
      receita: a.receitaBruta,
      cnpj: "pendente",
      notasSemCampos: 1,
      certificado: "vence",
      extratos: "open_finance",
      movSemNota: TRANSACOES.length - conciliadas,
      ir: { melhor: a.melhorOpcao, diferenca: a.diferencaOpcoes },
      decisao: "nao_se_aplica",
      proxima: "Fazer o CNPJ e corrigir a nota de 03/08",
    },
    {
      id: "bertolini",
      nome: "Irmãos Bertolini (condomínio)",
      municipio: "Lucas do Rio Verde/MT",
      cultura: "Soja, milho e algodão",
      receita: 38_400_000,
      cnpj: "feito",
      notasSemCampos: 0,
      certificado: "valido",
      extratos: "open_finance",
      movSemNota: 2,
      ir: { melhor: "resultado", diferenca: 1_310_000 },
      decisao: "nao_se_aplica",
      proxima: "Conferir créditos de frete e armazenagem",
    },
    {
      id: "kruger",
      nome: "Nelson Kruger",
      municipio: "Sorriso/MT",
      cultura: "Soja",
      receita: 6_900_000,
      cnpj: "pendente",
      notasSemCampos: 4,
      certificado: "vencido",
      extratos: "faltando",
      movSemNota: 11,
      ir: { melhor: "resultado", diferenca: 212_000 },
      decisao: "nao_se_aplica",
      proxima: "Renovar o certificado: sem ele não baixa nota",
    },
    {
      id: "boff",
      nome: "Salete Boff",
      municipio: "Nova Mutum/MT",
      cultura: "Soja e milho",
      receita: 3_950_000,
      cnpj: "pendente",
      notasSemCampos: 0,
      certificado: "valido",
      extratos: "ofx",
      movSemNota: 3,
      ir: { melhor: "resultado", diferenca: 96_000 },
      decisao: "nao_se_aplica",
      proxima: "Ajustar o emissor de nota antes de janeiro",
    },
    {
      id: "valeverde",
      nome: "Agropecuária Vale Verde",
      municipio: "Nova Mutum/MT",
      cultura: "Milho e gado",
      receita: 2_850_000,
      cnpj: "pendente",
      notasSemCampos: 0,
      certificado: "valido",
      extratos: "open_finance",
      movSemNota: 1,
      ir: { melhor: "presumido", diferenca: 41_000 },
      decisao: "pendente",
      proxima: "Decidir se entra no regime regular",
    },
    {
      id: "tresbarras",
      nome: "Fazenda Três Barras",
      municipio: "Sinop/MT",
      cultura: "Soja",
      receita: 12_700_000,
      cnpj: "feito",
      notasSemCampos: 2,
      certificado: "valido",
      extratos: "open_finance",
      movSemNota: 4,
      ir: { melhor: "resultado", diferenca: 388_000 },
      decisao: "nao_se_aplica",
      proxima: "Corrigir 2 notas de venda sem IBS/CBS",
    },
    {
      id: "zanella",
      nome: "Márcio Zanella",
      municipio: "Sorriso/MT",
      cultura: "Soja e feijão",
      receita: 1_480_000,
      cnpj: "pendente",
      notasSemCampos: 0,
      certificado: "valido",
      extratos: "ofx",
      movSemNota: 6,
      ir: { melhor: "resultado", diferenca: 22_000 },
      decisao: "ficar_fora",
      proxima: "Fazer o CNPJ (cadastro simplificado)",
    },
    {
      id: "rech",
      nome: "Ivone Rech",
      municipio: "Vera/MT",
      cultura: "Hortaliças e ovos",
      receita: 2_300_000,
      cnpj: "feito",
      notasSemCampos: 0,
      certificado: "valido",
      extratos: "open_finance",
      movSemNota: 0,
      ir: { melhor: "presumido", diferenca: 58_000 },
      decisao: "ficar_fora",
      proxima: "Vende ao consumidor final: ficar fora foi a escolha",
    },
    {
      id: "dalbosco",
      nome: "Dal Bosco Agro",
      municipio: "Sinop/MT",
      cultura: "Soja e milho",
      receita: 24_100_000,
      cnpj: "feito",
      notasSemCampos: 0,
      certificado: "valido",
      extratos: "open_finance",
      movSemNota: 2,
      ir: { melhor: "resultado", diferenca: 741_000 },
      decisao: "nao_se_aplica",
      proxima: "Pronto para janeiro",
    },
    {
      id: "pivetta",
      nome: "Lauro Pivetta",
      municipio: "Ipiranga do Norte/MT",
      cultura: "Soja",
      receita: 3_300_000,
      cnpj: "pendente",
      notasSemCampos: 0,
      certificado: "vence",
      extratos: "faltando",
      movSemNota: 9,
      ir: { melhor: "resultado", diferenca: 63_000 },
      decisao: "pendente",
      proxima: "Pedir o extrato: perto do limite, acompanhar mês a mês",
    },
    {
      id: "guerra",
      nome: "Família Guerra",
      municipio: "Tapurah/MT",
      cultura: "Algodão",
      receita: 47_800_000,
      cnpj: "pendente",
      notasSemCampos: 6,
      certificado: "valido",
      extratos: "ofx",
      movSemNota: 7,
      ir: { melhor: "resultado", diferenca: 1_920_000 },
      decisao: "nao_se_aplica",
      proxima: "CNPJ e 6 notas sem IBS/CBS: prioridade",
    },
    {
      id: "schmitz",
      nome: "Ana Schmitz",
      municipio: "Sorriso/MT",
      cultura: "Gado de corte",
      receita: 980_000,
      cnpj: "pendente",
      notasSemCampos: 0,
      certificado: "valido",
      extratos: "open_finance",
      movSemNota: 0,
      ir: { melhor: "presumido", diferenca: 12_000 },
      decisao: "ficar_fora",
      proxima: "Fazer o CNPJ (cadastro simplificado)",
    },
  ];

  const clientes: ClienteCarteira[] = base
    .map((c) => {
      const enquadramento = enquadrar(c.receita);
      const grave =
        (enquadramento === "obrigatorio" && c.cnpj === "pendente") ||
        c.notasSemCampos >= 3 ||
        c.certificado === "vencido";
      const medio = c.decisao === "pendente" || c.notasSemCampos > 0 || c.extratos === "faltando" || c.cnpj === "pendente";
      return { ...c, enquadramento, urgencia: (grave ? 1 : medio ? 2 : 3) as 1 | 2 | 3 };
    })
    .sort((x, y) => x.urgencia - y.urgencia || y.receita - x.receita);

  return {
    escritorio: "Escritório Exemplo de Contabilidade Rural",
    cidade: "Sorriso/MT",
    diasParaCbs: diasAte(PRAZOS.cbsECnpj, hoje),
    clientes,
    resumo: {
      produtores: clientes.length,
      obrigatorios: clientes.filter((c) => c.enquadramento === "obrigatorio").length,
      cnpjPendente: clientes.filter((c) => c.cnpj === "pendente").length,
      notasSemCampos: clientes.reduce((s, c) => s + c.notasSemCampos, 0),
      decisoesPendentes: clientes.filter((c) => c.decisao === "pendente").length,
      openFinance: clientes.filter((c) => c.extratos === "open_finance").length,
      semExtrato: clientes.filter((c) => c.extratos === "faltando").length,
    },
  };
}

export const milhoes = (v: number) => `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} milhões`;
