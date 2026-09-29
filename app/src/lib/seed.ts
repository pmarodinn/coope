import type {
  ChecklistConformidade,
  ContaIndividualizada,
  Natureza,
  NotaFiscal,
  OfertaFunding,
  Produtor,
  TransacaoBancaria,
  TravaFinalidade,
} from "./domain";

/**
 * PRNG determinístico: a demo precisa renderizar os mesmos números no servidor
 * e no cliente, e mostrar o mesmo dataset em toda apresentação.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260805);

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];

export const PRODUTOR: Produtor = {
  nome: "José Aparecido Menegat",
  cpf: "472.918.330-15",
  inscricaoEstadual: "13.482.906-7",
  municipio: "Sorriso",
  uf: "MT",
  safra: "2025/26",
  receitaBrutaAnterior: 19_840_000,
  certificadoDigital: {
    tipo: "e-CPF A1",
    validade: "14/03/2027",
    status: "valido",
  },
  propriedades: [
    {
      id: "IM001",
      nome: "Fazenda Santa Helena",
      municipio: "Sorriso",
      uf: "MT",
      codImovel: "IM001",
      car: "MT-5107925-8A3F.2C10.4E77",
      hectares: 1620,
      cultura: "Soja / Milho 2ª safra",
    },
    {
      id: "IM002",
      nome: "Fazenda Boa Vista",
      municipio: "Lucas do Rio Verde",
      uf: "MT",
      codImovel: "IM002",
      car: "MT-5105259-1B7D.9F44.2A05",
      hectares: 820,
      cultura: "Soja",
    },
    {
      id: "IM003",
      nome: "Gleba Rio Claro",
      municipio: "Nova Mutum",
      uf: "MT",
      codImovel: "IM003",
      car: "MT-5106224-6C21.0E93.7B18",
      hectares: 460,
      cultura: "Milho / Algodão",
    },
  ],
};

const COMPRADORES = [
  { nome: "Amaggi Exportação e Importação Ltda", cnpj: "77.294.254/0012-08" },
  { nome: "Cargill Agrícola S.A.", cnpj: "60.498.706/0341-77" },
  { nome: "Bunge Alimentos S.A.", cnpj: "84.046.101/0289-40" },
  { nome: "ADM do Brasil Ltda", cnpj: "02.003.402/0156-91" },
  { nome: "Coop. Agroindustrial Cooagri", cnpj: "03.817.442/0001-56" },
] as const;

const FORNECEDORES: Record<Natureza, readonly { nome: string; cnpj: string }[]> = {
  receita_producao: [],
  insumo_fertilizante: [
    { nome: "Mosaic Fertilizantes do Brasil", cnpj: "33.931.486/0075-12" },
    { nome: "Yara Brasil Fertilizantes S.A.", cnpj: "17.155.730/0044-83" },
    { nome: "Heringer Insumos Agrícolas", cnpj: "21.348.607/0019-24" },
  ],
  insumo_defensivo: [
    { nome: "Syngenta Proteção de Cultivos", cnpj: "60.744.463/0087-11" },
    { nome: "Bayer S.A. — Crop Science", cnpj: "18.459.628/0142-06" },
    { nome: "Ourofino Agrociência Ltda", cnpj: "09.100.671/0003-79" },
  ],
  insumo_semente: [
    { nome: "Sementes Boa Safra Ltda", cnpj: "07.914.200/0001-45" },
    { nome: "Brasmax Genética Ltda", cnpj: "11.482.905/0002-30" },
  ],
  combustivel: [
    { nome: "Posto Rodoagro Sorriso Ltda", cnpj: "05.291.774/0001-62" },
    { nome: "Vibra Energia — Distrib. MT", cnpj: "34.274.233/0118-95" },
  ],
  servico_operacional: [
    { nome: "Aeroagrícola Planalto Ltda", cnpj: "08.663.219/0001-07" },
    { nome: "Transportes Rota Norte Ltda", cnpj: "12.774.008/0001-83" },
    { nome: "Armazéns Gerais Sorriso S.A.", cnpj: "04.118.336/0001-29" },
  ],
  arrendamento: [{ nome: "Agropecuária Rio Claro Ltda", cnpj: "10.226.871/0001-14" }],
  mao_de_obra: [{ nome: "Folha de pagamento — equipe de campo", cnpj: "—" }],
  investimento_maquina: [
    { nome: "John Deere Brasil — Concessionária MT", cnpj: "89.674.782/0031-50" },
    { nome: "Stara S.A. Indústria de Implementos", cnpj: "87.208.397/0001-11" },
  ],
  nao_rural: [
    { nome: "Supermercado Ideal Sorriso Ltda", cnpj: "09.774.112/0001-38" },
    { nome: "Auto Posto Centro Ltda", cnpj: "06.339.281/0001-70" },
    { nome: "Clínica Vida Saúde S/S", cnpj: "14.905.663/0001-92" },
  ],
};

const CFOP: Record<Natureza, string> = {
  receita_producao: "5101",
  insumo_fertilizante: "1102",
  insumo_defensivo: "1102",
  insumo_semente: "1102",
  combustivel: "1653",
  servico_operacional: "1353",
  arrendamento: "1949",
  mao_de_obra: "—",
  investimento_maquina: "1551",
  nao_rural: "1102",
};

function chaveNFe(i: number): string {
  // 44 dígitos, formato posicional da NF-e (UF 51 = MT).
  const base = `51${(2509 + (i % 8)).toString()}${"77294254001208"}55001${String(
    100000 + i * 37,
  ).padStart(9, "0")}1${String(10000000 + i * 913).padStart(8, "0")}`;
  return base.padEnd(43, "0").slice(0, 43) + String((i * 7) % 10);
}

function dataSafra(offsetDias: number): string {
  const inicio = new Date(2025, 8, 1); // 01/09/2025 — abertura do plantio
  const d = new Date(inicio.getTime() + offsetDias * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Distribui um total entre `n` itens com variação, fechando exatamente no total. */
function distribuir(total: number, n: number, variacao = 0.55): number[] {
  const pesos = Array.from({ length: n }, () => 1 + (rnd() - 0.5) * 2 * variacao);
  const soma = pesos.reduce((a, b) => a + b, 0);
  const valores = pesos.map((p) => Math.round((p / soma) * total));
  const ajuste = total - valores.reduce((a, b) => a + b, 0);
  valores[0] += ajuste;
  return valores;
}

const ALVO = {
  receita: 22_400_000,
  custeio: 20_600_000,
  investimento: 1_600_000,
  naoRural: 96_000,
} as const;

const MIX_CUSTEIO: { natureza: Natureza; fatia: number; notas: number }[] = [
  { natureza: "insumo_fertilizante", fatia: 0.31, notas: 11 },
  { natureza: "insumo_defensivo", fatia: 0.26, notas: 13 },
  { natureza: "insumo_semente", fatia: 0.14, notas: 7 },
  { natureza: "combustivel", fatia: 0.11, notas: 12 },
  { natureza: "servico_operacional", fatia: 0.1, notas: 9 },
  { natureza: "arrendamento", fatia: 0.05, notas: 4 },
  { natureza: "mao_de_obra", fatia: 0.03, notas: 6 },
];

function construirNotas(): NotaFiscal[] {
  const notas: NotaFiscal[] = [];
  const propIds = PRODUTOR.propriedades.map((p) => p.id);
  let i = 0;
  let nsu = 41_200;

  const novaNota = (
    sentido: "entrada" | "saida",
    natureza: Natureza,
    valor: number,
    contraparte: { nome: string; cnpj: string },
    dia: number,
    confianca: number,
  ): NotaFiscal => {
    i += 1;
    nsu += Math.floor(rnd() * 5) + 1;
    return {
      chave: chaveNFe(i),
      nsu,
      numero: String(1000 + i * 3),
      serie: "001",
      emissao: dataSafra(dia),
      sentido,
      contraparte: contraparte.nome,
      cnpjContraparte: contraparte.cnpj,
      valor,
      natureza,
      propriedadeId: pick(propIds),
      confianca,
      cfop: CFOP[natureza],
    };
  };

  // Vendas: concentradas na janela de comercialização (fev–jul).
  distribuir(ALVO.receita, 14, 0.5).forEach((valor, k) => {
    notas.push(
      novaNota("saida", "receita_producao", valor, pick(COMPRADORES), 150 + k * 17, 0.99),
    );
  });

  // Custeio: distribuído ao longo do ciclo produtivo.
  MIX_CUSTEIO.forEach(({ natureza, fatia, notas: qtd }) => {
    distribuir(Math.round(ALVO.custeio * fatia), qtd).forEach((valor, k) => {
      const conf = 0.82 + rnd() * 0.17;
      notas.push(
        novaNota(
          "entrada",
          natureza,
          valor,
          pick(FORNECEDORES[natureza]),
          10 + Math.floor(rnd() * 240) + k,
          Number(conf.toFixed(3)),
        ),
      );
    });
  });

  // Investimento em bens da atividade rural.
  distribuir(ALVO.investimento, 3, 0.4).forEach((valor, k) => {
    notas.push(
      novaNota(
        "entrada",
        "investimento_maquina",
        valor,
        pick(FORNECEDORES.investimento_maquina),
        60 + k * 55,
        0.96,
      ),
    );
  });

  // Despesas pessoais capturadas no mesmo CPF — o motor precisa segregar.
  distribuir(ALVO.naoRural, 5, 0.6).forEach((valor, k) => {
    notas.push(
      novaNota("entrada", "nao_rural", valor, pick(FORNECEDORES.nao_rural), 30 + k * 48, 0.91),
    );
  });

  return notas.sort((a, b) => a.emissao.localeCompare(b.emissao));
}

export const NOTAS: NotaFiscal[] = construirNotas();

const BANCOS = [
  { nome: "Banco do Brasil", conta: "0001 / 42.918-3" },
  { nome: "Sicredi Celeiro MT", conta: "0710 / 18.204-6" },
  { nome: "Itaú Unibanco", conta: "8447 / 06.331-9" },
] as const;

function construirTransacoes(): TransacaoBancaria[] {
  const txs: TransacaoBancaria[] = [];

  // Liquidação bancária de cada NF-e, com defasagem típica de prazo comercial.
  NOTAS.forEach((nf, k) => {
    const banco = BANCOS[k % BANCOS.length];
    const defasagem = nf.sentido === "saida" ? 3 + Math.floor(rnd() * 9) : 20 + Math.floor(rnd() * 25);
    const data = new Date(new Date(nf.emissao).getTime() + defasagem * 86_400_000)
      .toISOString()
      .slice(0, 10);
    // Uma fração das notas ainda não liquidou — cobertura nunca é 100%.
    if (rnd() < 0.06) return;
    txs.push({
      id: `TX${String(k + 1).padStart(4, "0")}`,
      instituicao: banco.nome,
      conta: banco.conta,
      data,
      valor: nf.valor,
      tipo: nf.sentido === "saida" ? "credito" : "debito",
      descricao:
        nf.sentido === "saida"
          ? `TED recebida — ${nf.contraparte.split(" ")[0]}`
          : `Pagamento fornecedor — ${nf.contraparte.split(" ")[0]}`,
      conciliadaCom: nf.chave,
    });
  });

  // Movimentações sem documento fiscal correspondente: o resíduo que o
  // contador tradicionalmente descobre só no fechamento.
  const orfas = [
    { desc: "Pix enviado — J. R. Terraplanagem ME", valor: 128_400, tipo: "debito" as const },
    { desc: "Tarifa pacote de serviços", valor: 1_890, tipo: "debito" as const },
    { desc: "Pix recebido — venda de sucata", valor: 34_700, tipo: "credito" as const },
    { desc: "IOF operação de crédito", valor: 22_140, tipo: "debito" as const },
    { desc: "Pix enviado — despesa não identificada", valor: 76_500, tipo: "debito" as const },
  ];
  orfas.forEach((o, k) => {
    txs.push({
      id: `TX9${String(k + 1).padStart(3, "0")}`,
      instituicao: BANCOS[k % BANCOS.length].nome,
      conta: BANCOS[k % BANCOS.length].conta,
      data: dataSafra(70 + k * 41),
      valor: o.valor,
      tipo: o.tipo,
      descricao: o.desc,
      conciliadaCom: null,
    });
  });

  return txs.sort((a, b) => a.data.localeCompare(b.data));
}

export const TRANSACOES: TransacaoBancaria[] = construirTransacoes();

/**
 * Extrato de outro produtor da mesma cooperativa, usado para demonstrar o
 * motor de risco separando quem paga de quem não paga.
 *
 * É o caso que justifica o Open Finance: a aposta corre num banco e o pedido
 * de crédito chega em outro. Quem enxerga só a própria conta não vê nada.
 */
export const EXTRATO_RISCO: TransacaoBancaria[] = (() => {
  const linhas: {
    desc: string;
    valor: number;
    tipo: "credito" | "debito";
    banco: number;
    dia: number;
  }[] = [
    { desc: "Pagamento — BET7K Entretenimento", valor: 18_500, tipo: "debito", banco: 2, dia: 232 },
    { desc: "Pagamento — Betano Apostas", valor: 24_200, tipo: "debito", banco: 2, dia: 261 },
    { desc: "Pagamento — Blaze Apostas Online", valor: 31_900, tipo: "debito", banco: 2, dia: 289 },
    { desc: "Pagamento — BET7K Entretenimento", valor: 27_400, tipo: "debito", banco: 2, dia: 305 },
    { desc: "Crédito recebido — Betano Apostas", valor: 9_800, tipo: "credito", banco: 2, dia: 297 },
    { desc: "Juros de cheque especial", valor: 14_600, tipo: "debito", banco: 1, dia: 243 },
    { desc: "Juros de cheque especial", valor: 21_300, tipo: "debito", banco: 1, dia: 274 },
    { desc: "Encargos por atraso — parcela de financiamento", valor: 8_950, tipo: "debito", banco: 1, dia: 281 },
    { desc: "Débito parcela — Banco Rural Norte (CCB)", valor: 118_400, tipo: "debito", banco: 2, dia: 250 },
    { desc: "Débito parcela — Banco Rural Norte (CCB)", valor: 118_400, tipo: "debito", banco: 2, dia: 280 },
    { desc: "Débito parcela — Banco Rural Norte (CCB)", valor: 118_400, tipo: "debito", banco: 2, dia: 310 },
    { desc: "Saque em espécie — agência", valor: 62_000, tipo: "debito", banco: 0, dia: 268 },
  ];

  return linhas.map((c, k) => {
    const banco = BANCOS[c.banco % BANCOS.length];
    return {
      id: `TR${String(k + 1).padStart(4, "0")}`,
      instituicao: banco.nome,
      conta: banco.conta,
      data: dataSafra(c.dia),
      valor: c.valor,
      tipo: c.tipo,
      descricao: c.desc,
      conciliadaCom: null,
    };
  });
})();

export const OFERTAS: OfertaFunding[] = [
  {
    id: "OF-001",
    financiador: "Fiagro Terra Capital Agro FIC FIDC",
    tipo: "Fiagro",
    cnpj: "48.221.906/0001-33",
    taxaAnual: 13.9,
    cetAnual: 15.2,
    prazoMeses: 12,
    limite: 2_600_000,
    timeToMoneyHoras: 9,
    garantia: "CPR financeira + trava de recebíveis de safra",
    travaFinalidade: true,
    status: "aprovada",
    observacao: "Aprovação condicionada a LCDPR contínuo e trava de finalidade em insumos.",
  },
  {
    id: "OF-002",
    financiador: "Fiagro Cerrado Invest FII-Agro",
    tipo: "Fiagro",
    cnpj: "51.008.774/0001-08",
    taxaAnual: 14.8,
    cetAnual: 16.4,
    prazoMeses: 18,
    limite: 2_200_000,
    timeToMoneyHoras: 26,
    garantia: "CPR financeira + aval",
    travaFinalidade: true,
    status: "aprovada",
    observacao: "Prazo mais longo, exige laudo agronômico complementar.",
  },
  {
    id: "OF-003",
    financiador: "Banco Regional do Agro S.A.",
    tipo: "Banco",
    cnpj: "29.117.402/0001-77",
    taxaAnual: 12.4,
    cetAnual: 18.9,
    prazoMeses: 24,
    limite: 3_000_000,
    timeToMoneyHoras: 720,
    garantia: "Hipoteca de imóvel rural (matrícula IM001)",
    travaFinalidade: false,
    status: "aprovada",
    observacao: "Taxa nominal menor, CET maior e constituição de garantia real em cartório.",
  },
  {
    id: "OF-004",
    financiador: "Securitizadora Agro Norte CRA",
    tipo: "Securitizadora",
    cnpj: "37.664.219/0001-45",
    taxaAnual: 0,
    cetAnual: 0,
    prazoMeses: 0,
    limite: 0,
    timeToMoneyHoras: 0,
    garantia: "—",
    travaFinalidade: false,
    status: "recusada",
    observacao: "Fora do mandato: ticket mínimo de R$ 10 mi por operação.",
  },
];

/**
 * Dívida que o produtor já carrega em outra instituição. Desde fevereiro de
 * 2026 o Open Finance permite portabilidade de crédito totalmente digital, o
 * que torna esse saldo comparável — e transferível — sem ir à agência.
 */
export const DIVIDA_ATUAL = {
  instituicao: "Banco Rural Norte",
  saldo: 1_480_000,
  cetAnual: 22.4,
  parcelasRestantes: 14,
  contratadaEm: "2025-11-18",
};

export const CONTA: ContaIndividualizada = {
  titular: PRODUTOR.nome,
  cpfTitular: PRODUTOR.cpf,
  instituicaoPrestadora: "Instituição de Pagamento parceira (BaaS)",
  ispb: "13935893",
  agencia: "0001",
  numero: "88.410-2",
  tipo: "Conta de pagamento",
  saldo: 0,
  abertaEm: "2026-01-12",
  papelCoope: "Iniciadora de transação sob consentimento do titular",
};

export const TRAVAS_INICIAIS: TravaFinalidade[] = [
  {
    id: "TR-01",
    beneficiario: "Mosaic Fertilizantes do Brasil",
    cnpj: "33.931.486/0075-12",
    finalidade: "Fertilizante — NPK 02-20-18 · 320 t",
    valor: 1_080_000,
    status: "pendente",
    liquidadoEm: null,
    e2e: null,
  },
  {
    id: "TR-02",
    beneficiario: "Syngenta Proteção de Cultivos",
    cnpj: "60.744.463/0087-11",
    finalidade: "Defensivos — pacote fungicida safra 25/26",
    valor: 820_000,
    status: "pendente",
    liquidadoEm: null,
    e2e: null,
  },
  {
    id: "TR-03",
    beneficiario: "Sementes Boa Safra Ltda",
    cnpj: "07.914.200/0001-45",
    finalidade: "Semente de soja — cultivar BMX Zeus IPRO",
    valor: 500_000,
    status: "pendente",
    liquidadoEm: null,
    e2e: null,
  },
];

export const CHECKLIST: ChecklistConformidade[] = [
  {
    chave: "titularidade",
    titulo: "Conta de titularidade do produtor",
    norma: "Res. Conjunta BCB/CMN nº 16/2025",
    status: "conforme",
    detalhe:
      "A conta é aberta em nome do CPF do produtor na instituição prestadora. A Coope não mantém conta-bolsão nem figura como titular ou custodiante.",
  },
  {
    chave: "fluxo",
    titulo: "Fluxo financeiro direto",
    norma: "Res. Conjunta BCB/CMN nº 16/2025, art. 6º",
    status: "conforme",
    detalhe:
      "Os recursos transitam entre o financiador, a conta do produtor e o beneficiário final. A Coope atua como iniciadora sob consentimento, sem intermediação financeira de fato.",
  },
  {
    chave: "omnibus",
    titulo: "Ausência de conta concentradora",
    norma: "Res. BCB nº 518/2025",
    status: "conforme",
    detalhe:
      "Nenhuma conta em nome da Coope concentra recursos de múltiplos clientes. A trava de finalidade é regra contratual sobre a conta do próprio titular.",
  },
  {
    chave: "correspondente",
    titulo: "Enquadramento como correspondente no País",
    norma: "Res. CMN nº 4.935/2021",
    status: "conforme",
    detalhe:
      "Responsável técnico indicado perante cada instituição contratante; equipe submetida a certificação em regulamentação, LGPD, CDC, ética e ouvidoria.",
  },
  {
    chave: "cvm",
    titulo: "Fronteira informação × recomendação",
    norma: "Res. CVM nº 19/2021",
    status: "atencao",
    detalhe:
      "A plataforma apresenta ofertas com parâmetros objetivos e não emite recomendação de produto. Todo texto gerado automaticamente passa por revisão jurídica antes de publicação.",
  },
  {
    chave: "lgpd",
    titulo: "Base legal por finalidade e RIPD",
    norma: "LGPD · Mapa de Temas Prioritários ANPD 2026–2027",
    status: "conforme",
    detalhe:
      "Consentimento explícito e revogável para Open Finance; execução de obrigação legal para dados fiscais do LCDPR. RIPD elaborado desde a concepção, Encarregado designado e ROPA atualizado.",
  },
  {
    chave: "pld",
    titulo: "PLD/FT com calibragem setorial",
    norma: "Circular BCB nº 3.978/2020",
    status: "conforme",
    detalhe:
      "KYC/KYE/KYP/KYS ativos e monitoramento de atipicidade calibrado para sazonalidade de safra, evitando falso positivo em movimentação concentrada. Guarda de registros por 10 anos.",
  },
  {
    chave: "susep",
    titulo: "Intermediação de seguros via parceiro habilitado",
    norma: "Decreto-Lei nº 73/1966 · Res. CNSP/SUSEP nº 55/2025",
    status: "pendente",
    detalhe:
      "Cotação e emissão de apólice paramétrica ocorrem por corretora registrada na SUSEP, em modelo white-label. Integração prevista para a fase 5 do cronograma.",
  },
];
