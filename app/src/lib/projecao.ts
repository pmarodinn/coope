import type { LancamentoLCDPR } from "./domain";
import { apurar, gerarLCDPR } from "./engine";
import { OFERTAS } from "./seed";
import { estado } from "./store";

/**
 * Projeção de caixa e compromissos.
 *
 * A previsão de gasto usa a sazonalidade do próprio produtor: o mês de
 * outubro do ciclo que vem se parece com o outubro do ciclo que passou. Não é
 * um modelo estatístico — é a repetição do calendário agrícola, que é como o
 * produtor já raciocina.
 */

const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export interface MesProjetado {
  chave: string;
  rotulo: string;
  gasto: number;
  entrada: number;
  /** Já aconteceu ou é previsão. */
  previsto: boolean;
}

export interface Compromissos {
  /** Total tomado de crédito. */
  financiado: number;
  /** Custo total do crédito no período. */
  custoTotal: number;
  /** Quanto o crédito custa por mês, mesmo que a quitação seja na colheita. */
  custoMensal: number;
  /** Valor a devolver ao financiador. */
  devolver: number;
  cetAnual: number;
  prazoMeses: number;
  financiador: string | null;
  quandoPaga: string;
  /** Quanto já foi repassado aos fornecedores. */
  pagoFornecedores: number;
  aPagarFornecedores: number;
}

function porMes(lancamentos: LancamentoLCDPR[]) {
  const mapa = new Map<string, { gasto: number; entrada: number }>();
  for (const l of lancamentos) {
    const chave = l.data.slice(0, 7);
    const atual = mapa.get(chave) ?? { gasto: 0, entrada: 0 };
    atual.gasto += l.valorSaida;
    atual.entrada += l.valorEntrada;
    mapa.set(chave, atual);
  }
  return mapa;
}

const rotulo = (chave: string) => {
  const [ano, mes] = chave.split("-");
  return `${MES_CURTO[Number(mes) - 1]}/${ano.slice(2)}`;
};

/**
 * Seis meses à frente do último mês com movimento, repetindo o mesmo mês do
 * ciclo anterior como previsão.
 */
export function projetar(lancamentos: LancamentoLCDPR[] = gerarLCDPR(), meses = 6): MesProjetado[] {
  const mapa = porMes(lancamentos);
  const chaves = [...mapa.keys()].sort();
  if (chaves.length === 0) return [];

  const ultima = chaves[chaves.length - 1];
  const [ano, mes] = ultima.split("-").map(Number);

  const saida: MesProjetado[] = [];

  // Dois meses de histórico dão contexto ao que vem pela frente.
  for (const c of chaves.slice(-2)) {
    const v = mapa.get(c)!;
    saida.push({ chave: c, rotulo: rotulo(c), gasto: v.gasto, entrada: v.entrada, previsto: false });
  }

  for (let i = 1; i <= meses; i += 1) {
    const d = new Date(Date.UTC(ano, mes - 1 + i, 1));
    const chave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    // Mesmo mês do ciclo anterior.
    const anterior = `${d.getUTCFullYear() - 1}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const base = mapa.get(anterior) ?? { gasto: 0, entrada: 0 };
    saida.push({
      chave,
      rotulo: rotulo(chave),
      gasto: base.gasto,
      entrada: base.entrada,
      previsto: true,
    });
  }

  return saida;
}

export function compromissos(): Compromissos {
  const e = estado();
  const oferta = OFERTAS.find((o) => o.id === e.ofertaContratada) ?? null;

  const financiado = oferta ? e.travas.reduce((s, t) => s + t.valor, 0) : 0;
  const cet = oferta?.cetAnual ?? 0;
  const prazo = oferta?.prazoMeses ?? 0;

  const custoTotal = financiado * (cet / 100) * (prazo / 12);
  const custoMensal = prazo > 0 ? custoTotal / prazo : 0;

  const pago = e.travas.filter((t) => t.status === "liquidado").reduce((s, t) => s + t.valor, 0);

  return {
    financiado,
    custoTotal,
    custoMensal,
    devolver: financiado + custoTotal,
    cetAnual: cet,
    prazoMeses: prazo,
    financiador: oferta?.financiador ?? null,
    quandoPaga: "Na colheita",
    pagoFornecedores: pago,
    aPagarFornecedores: financiado - pago,
  };
}

export function resumoImposto() {
  const a = apurar(gerarLCDPR());
  return {
    economia: a.economiaTributaria,
    aPagar: a.irSobreResultadoReal,
    semOrganizar: a.irSobreBaseArbitrada,
  };
}
