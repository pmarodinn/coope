import type { EventoAuditoria, TravaFinalidade } from "./domain";
import { hashCurto } from "./engine";
import { CONTA, TRAVAS_INICIAIS } from "./seed";

export interface Movimento {
  id: string;
  quando: string;
  descricao: string;
  contraparte: string;
  valor: number;
  tipo: "entrada" | "saida";
  e2e: string | null;
}

/**
 * Estado do protótipo. Mantido em memória do processo — a demo não precisa de
 * persistência, e isso torna o reset entre apresentações trivial.
 */
interface Estado {
  /** Vínculo com o Open Finance: condição para abrir a conta. */
  consentimentoOpenFinance: boolean;
  consentimentoConcedidoEm: string | null;
  /** Aceite explícito dos termos, coletado na abertura da conta. */
  aceites: { termos: boolean; privacidade: boolean; correspondente: boolean };
  aceiteEm: string | null;
  /** Procuração eletrônica para consultar NF-e em nome do titular. */
  certificadoVinculado: boolean;

  notasIngeridas: number;
  ultimoNSU: number;

  contaAberta: boolean;
  contaAbertaEm: string | null;
  saldo: number;
  movimentos: Movimento[];

  ofertaContratada: string | null;
  travas: TravaFinalidade[];
  auditoria: EventoAuditoria[];
}

function estadoInicial(): Estado {
  return {
    consentimentoOpenFinance: false,
    consentimentoConcedidoEm: null,
    aceites: { termos: false, privacidade: false, correspondente: false },
    aceiteEm: null,
    certificadoVinculado: false,
    notasIngeridas: 0,
    ultimoNSU: 41_200,
    contaAberta: false,
    contaAbertaEm: null,
    saldo: 0,
    movimentos: [],
    ofertaContratada: null,
    travas: TRAVAS_INICIAIS.map((t) => ({ ...t })),
    auditoria: [],
  };
}

// O dev server do Next recarrega módulos a cada edição; o globalThis preserva
// o estado entre recompilações para não zerar a demo no meio de um pitch.
const g = globalThis as unknown as { __coope?: Estado };
if (!g.__coope) g.__coope = estadoInicial();

export const estado = (): Estado => g.__coope!;

export function resetar() {
  g.__coope = estadoInicial();
}

/**
 * Deixa a demonstração no meio da jornada: conta aberta, crédito tomado e um
 * fornecedor já pago.
 *
 * Abrir um app financeiro em "R$ 0" comunica produto vazio. Quem vê a demo tem
 * poucos minutos e não vai percorrer o onboarding inteiro antes de entender o
 * que a tela faz. O caminho do zero continua disponível em "Reiniciar".
 */
export function semear() {
  const e = estadoInicial();

  e.consentimentoOpenFinance = true;
  e.consentimentoConcedidoEm = new Date().toISOString();
  e.certificadoVinculado = true;
  e.aceites = { termos: true, privacidade: true, correspondente: true };
  e.aceiteEm = new Date().toISOString();
  e.contaAberta = true;
  e.contaAbertaEm = new Date().toISOString();
  e.notasIngeridas = 84;
  e.ofertaContratada = "OF-001";

  const total = e.travas.reduce((soma, t) => soma + t.valor, 0);
  e.saldo = total;
  e.movimentos = [
    {
      id: "MV0001",
      quando: new Date().toISOString(),
      descricao: "Crédito de custeio recebido",
      contraparte: "Fiagro Terra Capital Agro FIC FIDC",
      valor: total,
      tipo: "entrada",
      e2e: null,
    },
  ];

  g.__coope = e;
}

export function registrar(
  camada: EventoAuditoria["camada"],
  evento: string,
  detalhe: string,
  baseLegal: string,
): EventoAuditoria {
  const e = estado();
  const seq = e.auditoria.length + 1;
  const registro: EventoAuditoria = {
    id: `EV${String(seq).padStart(4, "0")}`,
    ts: new Date().toISOString(),
    camada,
    evento,
    detalhe,
    baseLegal,
    // Encadeamento simples: cada evento referencia o anterior, como um ledger.
    hash: hashCurto(`${seq}:${evento}:${e.auditoria.at(-1)?.hash ?? "genesis"}`),
  };
  e.auditoria.push(registro);
  return registro;
}

/** Identificador fim a fim do Pix, no formato do arranjo. */
export function gerarE2E() {
  const e = estado();
  const seq = e.movimentos.length + 1;
  return `E${CONTA.ispb}${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${String(seq).padStart(11, "0")}`;
}

export function lancar(m: Omit<Movimento, "id" | "quando">) {
  const e = estado();
  const mov: Movimento = {
    ...m,
    id: `MV${String(e.movimentos.length + 1).padStart(4, "0")}`,
    quando: new Date().toISOString(),
  };
  e.movimentos.unshift(mov);
  e.saldo += m.tipo === "entrada" ? m.valor : -m.valor;
  return mov;
}

export const contaAtual = () => {
  const e = estado();
  return { ...CONTA, saldo: e.saldo, abertaEm: e.contaAbertaEm ?? CONTA.abertaEm };
};

/** A conta só existe com vínculo de Open Finance e aceite registrado. */
export const podeAbrirConta = () => {
  const e = estado();
  return (
    e.consentimentoOpenFinance &&
    e.aceites.termos &&
    e.aceites.privacidade &&
    e.aceites.correspondente
  );
};

/** Latência artificial: uma chamada instantânea não parece integração externa. */
export const latencia = (ms: number) => new Promise((r) => setTimeout(r, ms));
