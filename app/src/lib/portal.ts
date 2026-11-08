import { PRODUTOR } from "./seed";
import type { Carteira, ClienteCarteira, Enquadramento, Extrato } from "./reforma";
import { enquadrar, urgenciaDe } from "./reforma";

/**
 * Portal do contador: o que o escritório faz em cima da carteira.
 *
 * A carteira base vem de /api/contador (mesmo motor do app do produtor). O que
 * o contador muda — CNPJ registrado, nota corrigida, convite enviado — fica no
 * navegador, em localStorage, para que o link de pré-cadastro aberto em outra
 * aba atualize o portal. Tudo aqui é demonstração com dados fictícios.
 */

export type Decisao = ClienteCarteira["decisao"];
export type Certificado = ClienteCarteira["certificado"] | "faltando";

export interface Ajuste {
  cnpj?: "feito";
  cnpjNumero?: string;
  certificado?: "valido";
  certificadoValidade?: string;
  extratos?: Extrato;
  decisao?: Decisao;
  notasCorrigidas?: string[];
}

export type Faixa = "ate1" | "ate36" | "ate10" | "acima10";

export const FAIXAS: Record<Faixa, { rotulo: string; estimativa: number }> = {
  ate1: { rotulo: "Até R$ 1 milhão", estimativa: 700_000 },
  ate36: { rotulo: "De R$ 1 milhão a R$ 3,6 milhões", estimativa: 2_400_000 },
  ate10: { rotulo: "De R$ 3,6 milhões a R$ 10 milhões", estimativa: 6_500_000 },
  acima10: { rotulo: "Acima de R$ 10 milhões", estimativa: 18_000_000 },
};

export interface Cadastro {
  nome: string;
  cpf: string;
  celular: string;
  municipio: string;
  cultura: string;
  faixa: Faixa;
  sefaz: boolean;
  openFinance: boolean;
  bancos: string[];
}

export type TipoConvite = "cadastro" | "open_finance";
export type StatusConvite = "enviado" | "aberto" | "concluido" | "cancelado";

export interface Convite {
  codigo: string;
  tipo: TipoConvite;
  /** Cliente que já está na carteira (pedido de Open Finance). */
  clienteId?: string;
  nome: string;
  celular: string;
  criadoEm: string;
  abertoEm?: string;
  concluidoEm?: string;
  status: StatusConvite;
  /** Veio pelo link geral do escritório, sem convite individual. */
  avulso?: boolean;
  cadastro?: Cadastro;
}

export interface Evento {
  id: string;
  em: string;
  texto: string;
  clienteId?: string;
  tom: "bom" | "atencao" | "neutro";
}

export interface EstadoPortal {
  versao: 1;
  ajustes: Record<string, Ajuste>;
  convites: Convite[];
  eventos: Evento[];
  lidasAte: string;
}

export interface ClientePortal extends Omit<ClienteCarteira, "certificado"> {
  certificado: Certificado;
  certificadoValidade: string | null;
  cnpjNumero: string | null;
  notasTotal: number;
  /** Entrou pelo pré-cadastro: receita estimada pela faixa, IR ainda sem livro caixa. */
  novo: boolean;
  irConhecido: boolean;
  pendencias: Pendencia[];
}

export type TipoPendencia =
  | "certificado_vencido"
  | "cnpj_obrigatorio"
  | "notas"
  | "extrato_faltando"
  | "decisao"
  | "cnpj"
  | "certificado_vence"
  | "extrato_arquivo";

export interface Pendencia {
  tipo: TipoPendencia;
  titulo: string;
  detalhe: string;
  gravidade: 1 | 2 | 3;
}

export const ROTULO_PENDENCIA: Record<TipoPendencia, string> = {
  certificado_vencido: "Certificado vencido",
  cnpj_obrigatorio: "CNPJ de contribuinte",
  notas: "Notas sem IBS/CBS",
  extrato_faltando: "Extrato faltando",
  decisao: "Decisão do regime",
  cnpj: "CNPJ simplificado",
  certificado_vence: "Certificado vencendo",
  extrato_arquivo: "Extrato por arquivo",
};

/* ---------------- datas ---------------- */

export const HOJE = () => new Date();

export function dataCurta(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00-03:00` : iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function quando(iso: string, agora = new Date()) {
  const seg = Math.round((agora.getTime() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return "agora";
  const min = Math.round(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return dataCurta(iso);
}

function somarDias(base: Date, dias: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

/* ---------------- determinismo ---------------- */

/** Hash curto e estável: as notas e validades fictícias saem sempre iguais. */
function hash(txt: string) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) {
    h ^= txt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---------------- certificados ---------------- */

function validadeBase(c: ClienteCarteira, agora: Date): string {
  if (c.id === "menegat") {
    const [d, m, a] = PRODUTOR.certificadoDigital.validade.split("/");
    return `${a}-${m}-${d}`;
  }
  const h = hash(c.id);
  const dias =
    c.certificado === "vencido" ? -(8 + (h % 40)) : c.certificado === "vence" ? 20 + (h % 50) : 200 + (h % 300);
  return somarDias(agora, dias).slice(0, 10);
}

/* ---------------- notas sem os campos novos ---------------- */

const COMPRADORES = [
  "Cerealista Planalto Ltda.",
  "Armazéns Rio Verde S.A.",
  "Cooperativa Agrícola Exemplo",
  "Trading Centro-Oeste Ltda.",
  "Comercial de Grãos Norte Ltda.",
  "Algodoeira Serra Azul Ltda.",
];

export interface NotaPendente {
  id: string;
  clienteId: string;
  cliente: string;
  numero: string;
  serie: string;
  emissao: string;
  destinatario: string;
  produto: string;
  valor: number;
  falta: string[];
  corrigida: boolean;
}

function produtoDe(cultura: string, i: number) {
  const partes = cultura
    .toLowerCase()
    .split(/,| e /)
    .map((p) => p.trim())
    .filter(Boolean);
  const p = partes[i % partes.length] ?? "soja";
  const nomes: Record<string, string> = {
    soja: "Soja em grão",
    milho: "Milho em grão",
    algodão: "Algodão em pluma",
    feijão: "Feijão carioca",
    gado: "Bovinos para abate",
    "gado de corte": "Bovinos para abate",
    hortaliças: "Hortaliças in natura",
    ovos: "Ovos",
  };
  return nomes[p] ?? `${p[0].toUpperCase()}${p.slice(1)}`;
}

export function notasDe(
  c: Pick<ClientePortal, "id" | "nome" | "cultura" | "receita" | "notasTotal">,
  corrigidas: string[] = [],
): NotaPendente[] {
  const notas: NotaPendente[] = [];
  for (let i = 0; i < c.notasTotal; i++) {
    const id = `${c.id}-${i + 1}`;
    const h = hash(id);
    // A nota de 03/08 do produtor da demonstração é a mesma que o app mostra.
    const emissao =
      c.id === "menegat" && i === 0
        ? "2026-08-03"
        : `2026-${String(8 + (h % 3)).padStart(2, "0")}-${String(1 + (h % 27)).padStart(2, "0")}`;
    const faltas = [
      ["CST do IBS/CBS", "cClassTrib", "Valores de IBS e CBS"],
      ["cClassTrib", "Valores de IBS e CBS"],
      ["Grupo IBS/CBS inteiro"],
    ][h % 3];
    notas.push({
      id,
      clienteId: c.id,
      cliente: c.nome,
      numero: String(1200 + (h % 8000)).padStart(6, "0"),
      serie: "1",
      emissao,
      destinatario: COMPRADORES[h % COMPRADORES.length],
      produto: produtoDe(c.cultura, i),
      valor: Math.round((c.receita * (0.012 + (h % 30) / 1000)) / 100) * 100,
      falta: faltas,
      corrigida: corrigidas.includes(id),
    });
  }
  return notas.sort((a, b) => a.emissao.localeCompare(b.emissao));
}

/* ---------------- pendências e próxima ação ---------------- */

function pendenciasDe(c: Omit<ClientePortal, "pendencias" | "urgencia" | "proxima">): Pendencia[] {
  const p: Pendencia[] = [];
  if (c.certificado === "vencido")
    p.push({
      tipo: "certificado_vencido",
      titulo: "Renovar o certificado digital",
      detalhe: "Sem certificado válido a Coope não baixa as notas na SEFAZ.",
      gravidade: 1,
    });
  if (c.certificado === "faltando")
    p.push({
      tipo: "certificado_vencido",
      titulo: "Enviar o certificado digital",
      detalhe: "O produtor não autorizou o escritório na SEFAZ nem enviou o e-CPF.",
      gravidade: 1,
    });
  if (c.cnpj === "pendente" && c.enquadramento === "obrigatorio")
    p.push({
      tipo: "cnpj_obrigatorio",
      titulo: "Fazer o CNPJ",
      detalhe: "Contribuinte de IBS/CBS em 2027: sem CNPJ não emite nota em janeiro.",
      gravidade: 1,
    });
  if (c.notasSemCampos > 0)
    p.push({
      tipo: "notas",
      titulo: `Corrigir ${c.notasSemCampos} ${c.notasSemCampos === 1 ? "nota" : "notas"} sem IBS/CBS`,
      detalhe: "Notas de venda emitidas sem o grupo IBS/CBS, autuáveis desde 01/08/2026.",
      gravidade: c.notasSemCampos >= 3 ? 1 : 2,
    });
  if (c.extratos === "faltando")
    p.push({
      tipo: "extrato_faltando",
      titulo: "Pedir o extrato bancário",
      detalhe: "Sem extrato o livro caixa não fecha e não dá para conferir o que entra sem nota.",
      gravidade: 2,
    });
  if (c.decisao === "pendente")
    p.push({
      tipo: "decisao",
      titulo: "Decidir se entra no regime regular",
      detalhe: "Abaixo de R$ 3,6 milhões o produtor escolhe: ficar fora ou apurar IBS/CBS.",
      gravidade: 2,
    });
  if (c.cnpj === "pendente" && c.enquadramento !== "obrigatorio")
    p.push({
      tipo: "cnpj",
      titulo: "Fazer o CNPJ (cadastro simplificado)",
      detalhe: "Obrigatório para todo produtor pessoa física a partir de 01/01/2027.",
      gravidade: 2,
    });
  if (c.certificado === "vence")
    p.push({
      tipo: "certificado_vence",
      titulo: "Renovar o certificado antes de vencer",
      detalhe: c.certificadoValidade ? `Vence em ${dataCurta(c.certificadoValidade)}.` : "Vence nos próximos meses.",
      gravidade: 3,
    });
  if (c.extratos === "ofx")
    p.push({
      tipo: "extrato_arquivo",
      titulo: "Trocar o arquivo pelo Open Finance",
      detalhe: "O escritório recebe o arquivo do banco à mão todo mês. Com o consentimento, vem sozinho.",
      gravidade: 3,
    });
  return p;
}

/** Junta a carteira do servidor com o que o escritório fez no navegador. */
export function montarCarteira(base: Carteira, e: EstadoPortal, agora = new Date()): ClientePortal[] {
  const novos: ClienteCarteira[] = e.convites
    .filter((c) => c.tipo === "cadastro" && c.status === "concluido" && c.cadastro)
    .map((c) => {
      const cad = c.cadastro!;
      const receita = FAIXAS[cad.faixa].estimativa;
      const enq: Enquadramento = enquadrar(receita);
      return {
        id: `novo-${c.codigo}`,
        nome: cad.nome,
        municipio: cad.municipio,
        cultura: cad.cultura,
        receita,
        enquadramento: enq,
        cnpj: "pendente",
        notasSemCampos: 0,
        certificado: "valido",
        extratos: cad.openFinance ? "open_finance" : "faltando",
        movSemNota: 0,
        ir: { melhor: "resultado", diferenca: 0 },
        decisao: enq === "obrigatorio" ? "nao_se_aplica" : "pendente",
        proxima: "",
        urgencia: 2,
      };
    });

  return [...base.clientes, ...novos]
    .map((orig) => {
      const a = e.ajustes[orig.id] ?? {};
      const novo = orig.id.startsWith("novo-");
      const convite = novo ? e.convites.find((c) => `novo-${c.codigo}` === orig.id) : undefined;
      const certificado: Certificado = a.certificado ?? (novo && !convite?.cadastro?.sefaz ? "faltando" : orig.certificado);
      const corrigidas = a.notasCorrigidas ?? [];
      const notasTotal = orig.notasSemCampos;
      const parcial = {
        ...orig,
        cnpj: a.cnpj ?? orig.cnpj,
        cnpjNumero: a.cnpjNumero ?? null,
        certificado,
        certificadoValidade:
          certificado === "faltando" ? null : (a.certificadoValidade ?? (novo ? null : validadeBase(orig, agora))),
        extratos: a.extratos ?? orig.extratos,
        decisao: a.decisao ?? orig.decisao,
        notasSemCampos: notasTotal - corrigidas.filter((id) => id.startsWith(`${orig.id}-`)).length,
        notasTotal,
        novo,
        irConhecido: !novo,
      };
      const pendencias = pendenciasDe(parcial);
      const urgencia = urgenciaDe(parcial);
      // Sem nada pendente, vale o que o escritório já tinha anotado para o
      // cliente pronto; quem acabou de resolver tudo fica "pronto para janeiro".
      const proxima = pendencias[0]?.titulo ?? (orig.urgencia === 3 && orig.proxima ? orig.proxima : "Pronto para janeiro");
      return { ...parcial, pendencias, urgencia, proxima };
    })
    .sort((x, y) => x.urgencia - y.urgencia || y.pendencias.length - x.pendencias.length || y.receita - x.receita);
}

export function resumir(cs: ClientePortal[]) {
  return {
    produtores: cs.length,
    prontos: cs.filter((c) => c.pendencias.every((p) => p.gravidade === 3)).length,
    obrigatorios: cs.filter((c) => c.enquadramento === "obrigatorio").length,
    cnpjPendente: cs.filter((c) => c.cnpj === "pendente").length,
    notasSemCampos: cs.reduce((s, c) => s + c.notasSemCampos, 0),
    decisoesPendentes: cs.filter((c) => c.decisao === "pendente").length,
    openFinance: cs.filter((c) => c.extratos === "open_finance").length,
    semExtrato: cs.filter((c) => c.extratos === "faltando").length,
    certificadosProblema: cs.filter((c) => c.certificado !== "valido").length,
    urgentes: cs.filter((c) => c.urgencia === 1).length,
  };
}

/* ---------------- estado no navegador ---------------- */

const CHAVE = "coope-portal-v1";

export function codigoNovo() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return s;
}

/** Código do link geral do escritório: serve para qualquer produtor se cadastrar. */
export const CODIGO_ESCRITORIO = "ESCRITORIO";

export function estadoInicial(agora = new Date()): EstadoPortal {
  const t = (h: number) => new Date(agora.getTime() - h * 3_600_000).toISOString();
  return {
    versao: 1,
    ajustes: {},
    convites: [
      {
        codigo: "K7Q2MX",
        tipo: "cadastro",
        nome: "Rogério Tessaro",
        celular: "(66) 99901-0001",
        criadoEm: t(50),
        abertoEm: t(26),
        status: "aberto",
      },
      {
        codigo: "P3V9TA",
        tipo: "cadastro",
        nome: "Cleide Foletto",
        celular: "(66) 99901-0002",
        criadoEm: t(5),
        status: "enviado",
      },
      {
        codigo: "H4N8RW",
        tipo: "open_finance",
        clienteId: "kruger",
        nome: "Nelson Kruger",
        celular: "(66) 99901-0003",
        criadoEm: t(72),
        status: "enviado",
      },
    ],
    eventos: [
      { id: "e1", em: t(2), texto: "SEFAZ: 14 notas novas baixadas da carteira", tom: "neutro" },
      {
        id: "e2",
        em: t(6),
        texto: "Família Guerra emitiu mais uma nota de venda sem IBS/CBS",
        clienteId: "guerra",
        tom: "atencao",
      },
      {
        id: "e3",
        em: t(26),
        texto: "Rogério Tessaro abriu o convite de pré-cadastro",
        tom: "neutro",
      },
      {
        id: "e4",
        em: t(30),
        texto: "Dal Bosco Agro: extratos de outubro conciliados pelo Open Finance",
        clienteId: "dalbosco",
        tom: "bom",
      },
      {
        id: "e5",
        em: t(54),
        texto: "Certificado de Nelson Kruger venceu: notas paradas",
        clienteId: "kruger",
        tom: "atencao",
      },
    ],
    lidasAte: t(10),
  };
}

export function lerEstado(): EstadoPortal {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const e = JSON.parse(bruto) as EstadoPortal;
      if (e.versao === 1) return e;
    }
  } catch {
    /* sem armazenamento: a demonstração começa do zero a cada visita */
  }
  return estadoInicial();
}

export function salvarEstado(e: EstadoPortal) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e));
  } catch {
    /* vale só nesta aba */
  }
}

export function limparEstado() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a limpar */
  }
}

export function evento(texto: string, tom: Evento["tom"] = "neutro", clienteId?: string): Evento {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, em: new Date().toISOString(), texto, tom, clienteId };
}

/* ---------------- convites ---------------- */

export const ROTULO_STATUS: Record<StatusConvite, string> = {
  enviado: "Enviado",
  aberto: "Aberto",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export function linkConvite(codigo: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const caminho = process.env.NEXT_PUBLIC_ESTATICO === "1" ? "/convite/" : "/convite";
  const origem = typeof window === "undefined" ? "" : window.location.origin;
  return `${origem}${base}${caminho}?c=${codigo}`;
}

export function mensagemConvite(c: Pick<Convite, "tipo" | "nome">, escritorio: string, link: string) {
  const nome = c.nome.split(" ")[0];
  if (c.tipo === "open_finance")
    return `Olá, ${nome}! Aqui é do ${escritorio}. Para fecharmos o livro caixa sem você mandar extrato todo mês, autorize o Open Finance pelo link (leva 2 minutos e você escolhe os bancos): ${link}`;
  return `Olá, ${nome}! Aqui é do ${escritorio}. Estamos preparando os produtores para a reforma tributária de 2027. Faça seu pré-cadastro no app da Coope pelo link (leva 3 minutos): ${link}`;
}

export function linkWhatsApp(celular: string, texto: string) {
  const digitos = celular.replace(/\D/g, "");
  const numero = digitos.length >= 10 && !digitos.startsWith("55") ? `55${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/* ---------------- exportação ---------------- */

export function csvCarteira(cs: ClientePortal[]) {
  const cab = [
    "Produtor",
    "Município",
    "Cultura",
    "Receita 2026 (R$)",
    "Situação 2027",
    "CNPJ",
    "Notas sem IBS/CBS",
    "Certificado",
    "Validade do certificado",
    "Extrato",
    "Movimentos sem nota",
    "IR: melhor forma",
    "IR: diferença (R$)",
    "Decisão",
    "Próxima ação",
  ];
  const ext: Record<Extrato, string> = { open_finance: "Open Finance", ofx: "Arquivo", faltando: "Faltando" };
  const linhas = cs.map((c) => [
    c.nome,
    c.municipio,
    c.cultura,
    String(Math.round(c.receita)),
    c.enquadramento,
    c.cnpj === "feito" ? "Feito" : "Pendente",
    String(c.notasSemCampos),
    c.certificado,
    c.certificadoValidade ? dataCurta(c.certificadoValidade) : "",
    ext[c.extratos],
    String(c.movSemNota),
    c.irConhecido ? (c.ir.melhor === "resultado" ? "Resultado" : "Presunção 20%") : "Sem livro caixa",
    c.irConhecido ? String(Math.round(c.ir.diferenca)) : "",
    c.decisao,
    c.proxima,
  ]);
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // Ponto e vírgula e BOM: é o que o Excel em português abre sem pedir nada.
  return "﻿" + [cab, ...linhas].map((l) => l.map(esc).join(";")).join("\n");
}

export function baixar(nome: string, conteudo: string, tipo = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------- prazos ---------------- */

export interface Prazo {
  data: string;
  titulo: string;
  detalhe: string;
  fonte: string;
}

export const AGENDA: Prazo[] = [
  {
    data: "2026-01-05",
    titulo: "NF-e obrigatória para todo produtor",
    detalhe: "A nota de papel e a nota avulsa saíram; todo produtor emite NF-e.",
    fonte: "Ajuste SINIEF nº 27/2024",
  },
  {
    data: "2026-08-01",
    titulo: "Campos de IBS/CBS passam a ser autuáveis",
    detalhe: "Nota de venda sem o grupo IBS/CBS (CST, cClassTrib e valores) pode ser rejeitada e autuada.",
    fonte: "Cronograma da NF-e da reforma",
  },
  {
    data: "2026-10-28",
    titulo: "TCU calcula a alíquota de referência",
    detalhe: "CBS de referência em 11,3%. Em 2027 a CBS é cobrada com 0,1 ponto a menos e o IBS fica em 0,1%.",
    fonte: "TCU, 28/10/2026",
  },
  {
    data: "2026-12-15",
    titulo: "Senado fixa a alíquota de referência",
    detalhe: "Até aqui, a alíquota do portal é premissa. Depois, troca pelo número oficial.",
    fonte: "LC nº 214/2025",
  },
  {
    data: "2026-12-31",
    titulo: "Receita de 2026 define 2027",
    detalhe: "Quem passar de R$ 3,6 milhões no ano é contribuinte de IBS/CBS em 2027. Abaixo disso, decide se entra.",
    fonte: "LC nº 214/2025, art. 164",
  },
  {
    data: "2027-01-01",
    titulo: "IBS/CBS e CNPJ do produtor",
    detalhe: "Começa a cobrança de teste e o CNPJ passa a ser obrigatório para o produtor pessoa física.",
    fonte: "Receita Federal e CGIBS",
  },
];

/** Celular fictício do cliente da carteira, para o pedido de Open Finance. */
export function celularDe(id: string) {
  const h = hash(`cel-${id}`);
  return `(66) 99${String(100 + (h % 900))}-${String(1000 + (h % 9000)).padStart(4, "0")}`;
}
