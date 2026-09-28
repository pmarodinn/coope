import type { LancamentoLCDPR } from "./domain";
import { apurar, gerarLCDPR, montarDossie } from "./engine";
import { NOTAS, PRODUTOR } from "./seed";

/**
 * Motor de recomendação por perfil.
 *
 * Fronteira regulatória embutida no modelo de dados: `podeIndicar` separa o que
 * a Coope pode recomendar como correspondente — com dever de adequação ao
 * perfil (Res. CMN nº 4.935/2021) — do que ela só pode explicar, porque
 * recomendar exigiria registro na CVM ou habilitação na SUSEP.
 */

export type Indicacao = "combina" | "talvez" | "nao_agora" | "so_explico";

export type Categoria = "Crédito" | "Consórcio" | "Proteção" | "Preço";

export interface Numero {
  rotulo: string;
  valor: string;
}

export interface Recomendacao {
  id: string;
  nome: string;
  categoria: Categoria;
  indicacao: Indicacao;
  /** Uma linha: o que é, em palavras do produtor. */
  chamada: string;
  /** Como funciona, sem jargão. */
  comoFunciona: string;
  /** Por que serve (ou não) para este produtor, citando os números dele. */
  porQue: string[];
  /** O lado ruim. Toda recomendação tem um. */
  atencao: string;
  numeros: Numero[];
  /** Quem de fato oferece o produto — a Coope nunca é a parte. */
  quemOferece: string;
  /** Se a Coope pode recomendar ou apenas informar. */
  podeIndicar: boolean;
  /** Base normativa da distinção acima. */
  base: string;
}

export interface Perfil {
  /** Pior saldo acumulado do ciclo e o mês em que acontece. */
  valeDeCaixa: { valor: number; mes: string };
  /** Meses entre o pico de gasto com insumo e o início das vendas. */
  mesesDescasados: number;
  jaInvestiuEmMaquina: number;
  temSeguro: boolean;
  capacidadePagamento: number;
  limiteSugerido: number;
  resultado: number;
  margem: number;
  faixa: string;
  hectares: number;
}

const MES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Saldo acumulado mês a mês — revela o buraco entre pagar insumo e receber a venda. */
function traçarCaixa(lancamentos: LancamentoLCDPR[]) {
  const porMes = new Map<string, number>();
  for (const l of lancamentos) {
    const chave = l.data.slice(0, 7);
    porMes.set(chave, (porMes.get(chave) ?? 0) + l.valorEntrada - l.valorSaida);
  }
  const meses = [...porMes.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  let acumulado = 0;
  let pior = { valor: 0, chave: meses[0]?.[0] ?? "" };
  const serie: { chave: string; acumulado: number }[] = [];

  for (const [chave, liquido] of meses) {
    acumulado += liquido;
    serie.push({ chave, acumulado });
    if (acumulado < pior.valor) pior = { valor: acumulado, chave };
  }

  return { serie, pior };
}

export function montarPerfil(lancamentos: LancamentoLCDPR[] = gerarLCDPR()): Perfil {
  const a = apurar(lancamentos);
  const d = montarDossie(a);
  const { pior } = traçarCaixa(lancamentos);

  const mesPior = pior.chave ? MES[Number(pior.chave.slice(5, 7)) - 1] : "outubro";

  // Distância entre o mês de maior gasto e o mês da primeira venda relevante.
  const gastos = lancamentos.filter((l) => l.tipoLanc === 2);
  const vendas = lancamentos.filter((l) => l.tipoLanc === 1);
  const picoGasto = gastos.reduce(
    (max, l) => (l.valorSaida > max.valorSaida ? l : max),
    gastos[0],
  );
  const primeiraVenda = vendas[0];
  const meses =
    picoGasto && primeiraVenda
      ? Math.max(
          1,
          Math.round(
            (new Date(primeiraVenda.data).getTime() - new Date(picoGasto.data).getTime()) /
              (30 * 86_400_000),
          ),
        )
      : 5;

  return {
    valeDeCaixa: { valor: Math.abs(pior.valor), mes: mesPior },
    mesesDescasados: meses,
    jaInvestiuEmMaquina: a.investimentos,
    temSeguro: false,
    capacidadePagamento: d.capacidadePagamento,
    limiteSugerido: d.limiteSugerido,
    resultado: a.resultadoReal,
    margem: a.margem,
    faixa: d.faixa,
    hectares: PRODUTOR.propriedades.reduce((s, p) => s + p.hectares, 0),
  };
}

/* ---- parâmetros de mercado usados nas comparações ---- */

const CUSTEIO = { valor: 2_400_000, cet: 15.2, meses: 12 };
const MAQUINA = { valor: 800_000, taxa: 14.0, meses: 60, taxaAdmConsorcio: 0.18 };

/** Parcela de um financiamento pela Tabela Price. */
function parcelaPrice(valor: number, taxaAnual: number, meses: number) {
  const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
  return (valor * i) / (1 - Math.pow(1 + i, -meses));
}

export function recomendar(perfil: Perfil = montarPerfil()): Recomendacao[] {
  const custoCusteio = CUSTEIO.valor * (CUSTEIO.cet / 100);

  const parcelaFin = parcelaPrice(MAQUINA.valor, MAQUINA.taxa, MAQUINA.meses);
  const anualFin = parcelaFin * 12;
  const totalFin = parcelaFin * MAQUINA.meses;

  const parcelaCons = (MAQUINA.valor * (1 + MAQUINA.taxaAdmConsorcio)) / MAQUINA.meses;
  const anualCons = parcelaCons * 12;
  const totalCons = parcelaCons * MAQUINA.meses;

  const comprometimentoFin = (custoCusteio + anualFin) / perfil.capacidadePagamento;

  const lista: Recomendacao[] = [
    {
      id: "custeio",
      nome: "Custeio da safra",
      categoria: "Crédito",
      indicacao: "combina",
      chamada: "Dinheiro para comprar insumo agora e pagar quando colher.",
      comoFunciona:
        "Você pega o valor no plantio e quita de uma vez com a venda da safra. A garantia é a sua própria produção, não a fazenda.",
      porQue: [
        `Você paga adubo e semente ${perfil.mesesDescasados} meses antes de receber pela soja. O descasamento é da atividade, não é descontrole seu.`,
        `No pior mês — ${perfil.valeDeCaixa.mes} — falta ${brl(perfil.valeDeCaixa.valor)} de caixa. Este crédito cobre ${brl(CUSTEIO.valor)} disso; o resto costuma sair de troca com a revenda e do seu próprio caixa.`,
        `Custa ${brl(custoCusteio)} no ano, ou ${Math.round((custoCusteio / perfil.resultado) * 100)}% do que sobrou da sua safra.`,
      ],
      atencao:
        "Se a safra frustrar, a dívida continua. Por isso o seguro de lavoura entra junto, não depois.",
      numeros: [
        { rotulo: "Valor", valor: brl(CUSTEIO.valor) },
        { rotulo: "Custo total no ano", valor: `${CUSTEIO.cet.toFixed(1).replace(".", ",")}%` },
        { rotulo: "Você devolve", valor: brl(CUSTEIO.valor + custoCusteio) },
        { rotulo: "Quando paga", valor: "Na colheita" },
      ],
      quemOferece: "Fiagro ou banco parceiro",
      podeIndicar: true,
      base: "Res. CMN nº 4.935/2021 — dever de adequar o produto ao perfil do cliente",
    },
    {
      id: "consorcio",
      nome: "Consórcio de máquina",
      categoria: "Consórcio",
      indicacao: "talvez",
      chamada: "Trocar de máquina sem pagar juros — se você puder esperar.",
      comoFunciona:
        "Você entra num grupo e paga uma parcela mensal. Não tem juros, só a taxa de administração. A máquina sai quando você é sorteado ou dá um lance.",
      porQue: [
        `Comparando os dois caminhos para uma máquina de ${brl(MAQUINA.valor)}: financiando você devolve ${brl(totalFin)}; no consórcio, ${brl(totalCons)}.`,
        `São ${brl(totalFin - totalCons)} de diferença, que ficam no seu bolso.`,
        "Faz sentido se a máquina é para daqui a um ou dois anos, e não para o plantio que vem.",
      ],
      atencao:
        "Você não escolhe quando recebe. Se a colheitadeira quebrar no meio da safra, consórcio não resolve — aí é financiamento mesmo.",
      numeros: [
        { rotulo: "Parcela", valor: `${brl(parcelaCons)}/mês` },
        { rotulo: "Prazo", valor: `${MAQUINA.meses} meses` },
        { rotulo: "Juros", valor: "Não tem" },
        { rotulo: "Taxa de administração", valor: `${Math.round(MAQUINA.taxaAdmConsorcio * 100)}%` },
      ],
      quemOferece: "Administradora de consórcio parceira",
      podeIndicar: true,
      base: "Res. CMN nº 4.935/2021 — distribuição por correspondente",
    },
    {
      id: "financiamento",
      nome: "Financiamento de máquina agora",
      categoria: "Crédito",
      indicacao: "nao_agora",
      chamada: "Dá para fazer, mas aperta o seu caixa neste ciclo.",
      comoFunciona:
        "Você recebe a máquina na hora e paga em parcelas mensais por vários anos, com juros.",
      porQue: [
        `Você já comprou ${brl(perfil.jaInvestiuEmMaquina)} em máquina nesta safra.`,
        `Somando a parcela nova (${brl(anualFin)}/ano) com o custo do custeio (${brl(custoCusteio)}), você compromete ${Math.round(comprometimentoFin * 100)}% da sua capacidade de pagamento.`,
        "Com margem de 8,7%, uma safra ruim deixaria pouca folga para as duas dívidas ao mesmo tempo.",
      ],
      atencao:
        "Se a máquina for essencial agora, o caminho é esse mesmo — mas vale reduzir o custeio ou alongar o prazo.",
      numeros: [
        { rotulo: "Parcela", valor: `${brl(parcelaFin)}/mês` },
        { rotulo: "Prazo", valor: `${MAQUINA.meses} meses` },
        { rotulo: "Juros", valor: `${MAQUINA.taxa.toFixed(1).replace(".", ",")}% a.a.` },
        { rotulo: "Você devolve", valor: brl(totalFin) },
      ],
      quemOferece: "Banco parceiro",
      podeIndicar: true,
      base: "Res. CMN nº 4.935/2021 — dever de adequar o produto ao perfil do cliente",
    },
    {
      id: "barter",
      nome: "Troca por produto (barter)",
      categoria: "Crédito",
      indicacao: "talvez",
      chamada: "Pegar o insumo agora e pagar em sacas depois.",
      comoFunciona:
        "A revenda entrega adubo e semente, e você quita entregando uma quantidade combinada de soja na colheita.",
      porQue: [
        "Você já trava o preço do insumo e da saca no mesmo dia, então sabe exatamente sua margem.",
        "Não consome o seu limite de crédito no banco — fica livre para outra coisa.",
      ],
      atencao:
        "Se a soja subir, você entrega sacas que valeriam mais. É proteção contra queda e renúncia de alta, ao mesmo tempo.",
      numeros: [
        { rotulo: "Você entrega", valor: "Sacas de soja" },
        { rotulo: "Trava de preço", valor: "Na assinatura" },
        { rotulo: "Usa seu limite?", valor: "Não" },
      ],
      quemOferece: "Cooperativa ou revenda parceira",
      podeIndicar: true,
      base: "Operação comercial entre produtor e revenda, intermediada como correspondente",
    },
    {
      id: "seguro",
      nome: "Seguro da lavoura",
      categoria: "Proteção",
      indicacao: "combina",
      chamada: "Se der seca ou chuva demais, você recebe sem perícia na fazenda.",
      comoFunciona:
        "O pagamento dispara por medição de chuva e temperatura na sua região. Bateu o gatilho, cai na conta.",
      porQue: [
        `Você tem ${perfil.hectares.toLocaleString("pt-BR")} hectares e nenhum seguro hoje.`,
        "Como você vai pegar crédito de custeio, uma quebra de safra viraria dívida sem receita para pagar.",
        "No Brasil, só 3,3% da área plantada tem seguro subvencionado — a maioria carrega o risco sozinha.",
      ],
      atencao:
        "O seguro paramétrico paga pelo índice, não pela sua perda real. Pode pagar a mais ou a menos que o prejuízo.",
      numeros: [
        { rotulo: "Cobertura hoje", valor: "Nenhuma" },
        { rotulo: "Dispara por", valor: "Chuva e temperatura" },
        { rotulo: "Perícia na fazenda", valor: "Não precisa" },
      ],
      quemOferece: "Corretora registrada na SUSEP",
      podeIndicar: false,
      base: "Decreto-Lei nº 73/1966 — intermediação exige corretor habilitado",
    },
    {
      id: "preco",
      nome: "Travar o preço da soja",
      categoria: "Preço",
      indicacao: "so_explico",
      chamada: "Garantir hoje o preço da saca que você só vai vender depois.",
      comoFunciona:
        "Existem contratos que fixam o preço futuro da sua produção. Uns travam o valor, outros funcionam como um seguro de preço.",
      porQue: [
        "Sua receita depende de um preço que oscila até a colheita — travar parte dela reduz essa incerteza.",
        "Faz mais sentido travar só uma fatia da safra, nunca tudo.",
      ],
      atencao:
        "Aqui a Coope só explica como funciona. Quem pode indicar e executar é uma corretora registrada na CVM.",
      numeros: [
        { rotulo: "Quem executa", valor: "Corretora na CVM" },
        { rotulo: "Papel da Coope", valor: "Só explicar" },
      ],
      quemOferece: "Corretora de valores registrada na CVM",
      podeIndicar: false,
      base: "Res. CVM nº 19/2021 — recomendar exigiria registro de consultor",
    },
  ];

  const ordem: Record<Indicacao, number> = {
    combina: 0,
    talvez: 1,
    so_explico: 2,
    nao_agora: 3,
  };
  return lista.sort((a, b) => ordem[a.indicacao] - ordem[b.indicacao]);
}

export const ROTULO_INDICACAO: Record<Indicacao, string> = {
  combina: "Combina com você",
  talvez: "Pode valer a pena",
  nao_agora: "Melhor não agora",
  so_explico: "Só explico",
};
