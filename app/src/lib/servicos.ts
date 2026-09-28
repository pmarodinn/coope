import { apurar, gerarLCDPR, montarDossie } from "./engine";
import { cooperativa, fontesReceita, metricas } from "./negocio";
import { compromissos, projetar, resumoImposto } from "./projecao";
import { montarPerfil, recomendar } from "./recomendacao";
import { CHECKLIST, NOTAS, OFERTAS, PRODUTOR, TRANSACOES } from "./seed";
import {
  contaAtual,
  estado,
  gerarE2E,
  lancar,
  latencia,
  podeAbrirConta,
  registrar,
  resetar,
} from "./store";

/**
 * Regras de negócio das rotas, isoladas do transporte.
 *
 * As rotas do Next e o interceptador de fetch do build estático chamam
 * exatamente estas funções, para que o comportamento não divirja entre rodar
 * com servidor e rodar só no navegador.
 */

export interface Resposta<T = unknown> {
  status: number;
  corpo: T;
}

const ok = <T,>(corpo: T): Resposta<T> => ({ status: 200, corpo });
const erro = (status: number, corpo: unknown): Resposta => ({ status, corpo });

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/* ---------------- ingestão ---------------- */

export async function consentirOpenFinance() {
  await latencia(900);
  const e = estado();
  e.consentimentoOpenFinance = true;
  e.consentimentoConcedidoEm = new Date().toISOString();

  registrar(
    "Ingestão",
    "Consentimento Open Finance concedido",
    "Escopos ACCOUNTS_READ e RESOURCES_READ autorizados pelo titular por 12 meses, revogáveis a qualquer momento.",
    "LGPD art. 7º, I — consentimento · Manual de APIs Open Finance (IN BCB nº 615/2025)",
  );

  return ok({
    consentId: "urn:coope:9f2c41a8-7b33-4de2-9a10-5c8e4417d0b6",
    status: "AUTHORISED",
    permissions: ["ACCOUNTS_READ", "ACCOUNTS_BALANCES_READ", "RESOURCES_READ"],
    creationDateTime: e.consentimentoConcedidoEm,
    expirationDateTime: "2027-08-05T12:00:00Z",
    instituicoes: ["Banco do Brasil", "Sicredi Celeiro MT", "Itaú Unibanco"],
  });
}

export async function revogarConsentimento() {
  await latencia(300);
  const e = estado();
  e.consentimentoOpenFinance = false;
  e.consentimentoConcedidoEm = null;

  registrar(
    "Compliance",
    "Consentimento revogado pelo titular",
    "Coleta de dados via Open Finance interrompida e tratamento cessado para as finalidades vinculadas ao consentimento.",
    "LGPD art. 8º, §5º — revogação a qualquer momento",
  );

  return ok({ status: "REVOKED" });
}

export async function lerTransacoes() {
  const e = estado();
  if (!e.consentimentoOpenFinance) {
    return erro(403, {
      erro: "CONSENT_REQUIRED",
      mensagem: "Não há consentimento vigente para leitura de contas.",
    });
  }

  await latencia(700);

  registrar(
    "Ingestão",
    "Leitura de extratos multi-instituição",
    `${TRANSACOES.length} lançamentos obtidos de 3 instituições detentoras sob consentimento vigente.`,
    "Open Finance Brasil — APIs FAPI sob consentimento do titular",
  );

  return ok({
    total: TRANSACOES.length,
    instituicoes: [...new Set(TRANSACOES.map((t) => t.instituicao))],
    transacoes: TRANSACOES,
  });
}

export async function consultarNFe() {
  await latencia(620);
  const e = estado();
  const lote = NOTAS.slice(e.notasIngeridas, e.notasIngeridas + 20);

  if (lote.length === 0) {
    return ok({
      cStat: "137",
      xMotivo: "Nenhum documento localizado",
      ultNSU: e.ultimoNSU,
      maxNSU: NOTAS.at(-1)?.nsu ?? e.ultimoNSU,
      documentos: [],
      total: e.notasIngeridas,
    });
  }

  e.notasIngeridas += lote.length;
  e.ultimoNSU = lote.at(-1)!.nsu;

  registrar(
    "Ingestão",
    "Consulta NFeDistribuicaoDFe",
    `${lote.length} documentos fiscais recebidos do Ambiente Nacional (NSU ${lote[0].nsu}–${e.ultimoNSU}).`,
    "Nota Técnica 2014.002 — autorização por certificado digital e-CPF do titular",
  );

  return ok({
    cStat: "138",
    xMotivo: "Documento(s) localizado(s)",
    ultNSU: e.ultimoNSU,
    maxNSU: NOTAS.at(-1)!.nsu,
    documentos: lote,
    total: e.notasIngeridas,
    restantes: NOTAS.length - e.notasIngeridas,
  });
}

export async function vincularCertificado() {
  await latencia(1100);
  estado().certificadoVinculado = true;

  registrar(
    "Ingestão",
    "Procuração eletrônica vinculada",
    `Autorização do titular para consultar documentos fiscais emitidos contra o CPF ${PRODUTOR.cpf}. Certificado ${PRODUTOR.certificadoDigital.tipo}, válido até ${PRODUTOR.certificadoDigital.validade}.`,
    "Nota Técnica 2014.002 — consulta exige certificado digital do titular ou procuração específica",
  );

  return ok({
    ok: true,
    tipo: PRODUTOR.certificadoDigital.tipo,
    validade: PRODUTOR.certificadoDigital.validade,
  });
}

/* ---------------- fiscal e dossiê ---------------- */

export async function lerLCDPR() {
  await latencia(450);
  const lancamentos = gerarLCDPR();
  return ok({ apuracao: apurar(lancamentos), lancamentos });
}

export async function gerarArquivoLCDPR() {
  await latencia(1100);
  const lancamentos = gerarLCDPR();
  const apuracao = apurar(lancamentos);

  registrar(
    "Motor fiscal",
    "Arquivo LCDPR gerado",
    `Leiaute com ${lancamentos.length} registros Q100 e resultado apurado de R$ ${apuracao.resultadoReal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}.`,
    "IN RFB nº 1.848/2018 — assinatura com certificado digital ICP-Brasil",
  );

  return ok({
    arquivo: "LCDPR_47291833015_2026.txt",
    registros: lancamentos.length,
    blocos: ["0000", "0010", "0030", "0040", "0050", "Q100", "Q200", "9999"],
    assinatura: "Pendente — requer certificado e-CPF do titular",
    apuracao,
  });
}

export async function lerDossie() {
  await latencia(400);
  return ok(montarDossie(apurar()));
}

export async function empacotarDossie() {
  await latencia(1000);
  const dossie = montarDossie(apurar());

  registrar(
    "Dossiê",
    "Dossiê de crédito empacotado",
    `Score ${dossie.score} (faixa ${dossie.faixa}), com ${(dossie.lastroVerificavel * 100).toFixed(0)}% dos fatores lastreados em dado primário verificável. Referência ${dossie.hash}.`,
    "Dado derivado de escrituração fiscal própria do titular — não constitui recomendação de produto",
  );

  return ok(dossie);
}

export async function lerRecomendacoes() {
  await latencia(1400);
  const perfil = montarPerfil();
  const itens = recomendar(perfil);
  const indicados = itens.filter((i) => i.podeIndicar);
  const informativos = itens.filter((i) => !i.podeIndicar);

  registrar(
    "Dossiê",
    "Perfil analisado e produtos sugeridos",
    `${indicados.length} produtos de crédito sugeridos com base no perfil (vale de caixa em ${perfil.valeDeCaixa.mes}, margem de ${(perfil.margem * 100).toFixed(1)}%). ${informativos.length} produtos apenas explicados, sem recomendação.`,
    "Res. CMN nº 4.935/2021 (adequação ao perfil) · Res. CVM nº 19/2021 (vedação de recomendar sem registro)",
  );

  return ok({ perfil, recomendacoes: itens });
}

/* ---------------- originação ---------------- */

export async function listarOfertas() {
  await latencia(1300);

  registrar(
    "Originação",
    "Dossiê roteado a financiadores parceiros",
    `Submissão a ${OFERTAS.length} contrapartes. Não existe API única de mercado: cada integração é bilateral, sob contrato de correspondente.`,
    "Res. CMN nº 4.935/2021 — correspondente no País",
  );

  return ok({ ofertas: OFERTAS, contratada: estado().ofertaContratada });
}

export async function escolherOferta(ofertaId: string) {
  const oferta = OFERTAS.find((o) => o.id === ofertaId);
  if (!oferta || oferta.status !== "aprovada") {
    return erro(400, { erro: "OFERTA_INVALIDA" });
  }

  await latencia(900);
  estado().ofertaContratada = ofertaId;

  registrar(
    "Originação",
    "Oferta selecionada pelo titular",
    `${oferta.financiador} — ${oferta.taxaAnual}% a.a. (CET ${oferta.cetAnual}%), ${oferta.prazoMeses} meses. Seleção feita pelo produtor a partir de parâmetros objetivos comparáveis.`,
    "Res. CVM nº 19/2021 — apresentação de informação, sem recomendação de produto",
  );

  return ok({ ok: true, oferta });
}

/* ---------------- conta e liquidação ---------------- */

export function lerOnboarding() {
  const e = estado();
  return ok({
    consentimentoOpenFinance: e.consentimentoOpenFinance,
    aceites: e.aceites,
    aceiteEm: e.aceiteEm,
    contaAberta: e.contaAberta,
    pronto: podeAbrirConta(),
  });
}

export async function abrirConta(aceites?: {
  termos?: boolean;
  privacidade?: boolean;
  correspondente?: boolean;
}) {
  const e = estado();
  e.aceites = {
    termos: !!aceites?.termos,
    privacidade: !!aceites?.privacidade,
    correspondente: !!aceites?.correspondente,
  };

  if (!e.consentimentoOpenFinance) {
    return erro(400, {
      erro: "OPEN_FINANCE_OBRIGATORIO",
      mensagem: "É preciso conectar suas contas pelo Open Finance antes de abrir a conta.",
    });
  }
  if (!podeAbrirConta()) {
    return erro(400, {
      erro: "ACEITE_INCOMPLETO",
      mensagem: "Todos os aceites são obrigatórios.",
    });
  }

  await latencia(1300);
  e.aceiteEm = new Date().toISOString();

  if (!e.contaAberta) {
    e.contaAberta = true;
    e.contaAbertaEm = e.aceiteEm;

    registrar(
      "Compliance",
      "Aceite registrado na abertura",
      "Titular aceitou os termos de uso, a política de privacidade e a condição de atuação da plataforma como correspondente. Aceite versionado e arquivado com data e hora.",
      "Res. CMN nº 4.935/2021 · LGPD art. 9º — informação clara sobre a finalidade do tratamento",
    );
    registrar(
      "Liquidação",
      "Conta de pagamento aberta em nome do titular",
      `Conta de titularidade de ${PRODUTOR.nome} (CPF ${PRODUTOR.cpf}) na instituição prestadora, com Pix habilitado. A Coope não é titular, não custodia e não movimenta recursos em nome próprio.`,
      "Res. Conjunta BCB/CMN nº 16/2025 — titularidade individualizada obrigatória",
    );
  }

  return ok({ ok: true, conta: contaAtual(), aceiteEm: e.aceiteEm });
}

export function lerConta() {
  const e = estado();
  return ok({
    aberta: e.contaAberta,
    conta: contaAtual(),
    travas: e.travas,
    movimentos: e.movimentos,
    ofertaContratada: e.ofertaContratada,
    consentimentoOpenFinance: e.consentimentoOpenFinance,
    aceites: e.aceites,
    prontoParaAbrir: podeAbrirConta(),
  });
}

export async function receberDesembolso() {
  const e = estado();
  if (!e.contaAberta) {
    return erro(400, {
      erro: "CONTA_NAO_ABERTA",
      mensagem: "Abra a conta antes de receber o desembolso.",
    });
  }
  if (!e.ofertaContratada) {
    return erro(400, {
      erro: "SEM_OFERTA",
      mensagem: "Nenhuma oferta de crédito foi selecionada.",
    });
  }

  await latencia(1200);

  const oferta = OFERTAS.find((o) => o.id === e.ofertaContratada)!;
  const valor = e.travas.reduce((s, t) => s + t.valor, 0);

  lancar({
    descricao: "Crédito de custeio recebido",
    contraparte: oferta.financiador,
    valor,
    tipo: "entrada",
    e2e: gerarE2E(),
  });

  registrar(
    "Liquidação",
    "Desembolso do financiador recebido",
    `${oferta.financiador} creditou ${brl(valor)} diretamente na conta do produtor, sem trânsito por conta da plataforma.`,
    "Res. Conjunta BCB/CMN nº 16/2025 — fluxo financeiro direto",
  );

  return ok({ conta: contaAtual(), travas: e.travas, valor });
}

export async function liquidarTrava(travaId: string) {
  const e = estado();
  const trava = e.travas.find((t) => t.id === travaId);

  if (!trava) return erro(404, { erro: "NAO_ENCONTRADO" });
  if (trava.status === "liquidado") return erro(409, { erro: "JA_PAGO" });
  if (!e.contaAberta || e.saldo < trava.valor) {
    return erro(400, { erro: "SALDO_INSUFICIENTE", saldo: e.saldo, exigido: trava.valor });
  }

  await latencia(1000);

  const e2e = gerarE2E();
  trava.status = "liquidado";
  trava.liquidadoEm = new Date().toISOString();
  trava.e2e = e2e;

  lancar({
    descricao: trava.finalidade,
    contraparte: trava.beneficiario,
    valor: trava.valor,
    tipo: "saida",
    e2e,
  });

  registrar(
    "Liquidação",
    "Pagamento iniciado sob trava de finalidade",
    `Pix de ${brl(trava.valor)} da conta do titular para ${trava.beneficiario} (CNPJ ${trava.cnpj}). Finalidade: ${trava.finalidade}. E2E ${e2e}.`,
    "Iniciação de pagamento sob consentimento do titular — a plataforma nunca detém os recursos",
  );

  const pendentes = e.travas.filter((t) => t.status === "pendente").length;
  if (pendentes === 0) {
    registrar(
      "Compliance",
      "Destinação integral comprovada",
      "100% do valor desembolsado foi liquidado em beneficiários previstos na finalidade contratada, com trilha de auditoria completa disponível ao financiador.",
      "Circular BCB nº 3.978/2020 — guarda de registros por 10 anos",
    );
  }

  return ok({ trava, conta: contaAtual(), pendentes });
}

const AGENDA: Record<string, string> = {
  "33931486000112": "Mosaic Fertilizantes",
  "07914200000145": "Sementes Boa Safra",
  "60744463008711": "Syngenta Proteção de Cultivos",
  "11987654321": "Maria Menegat",
  "joao@oficina.com.br": "Oficina Rio Claro",
};

export async function enviarPix(chave: string, valor: number, descricao?: string) {
  const e = estado();

  if (!e.contaAberta) return erro(400, { erro: "CONTA_NAO_ABERTA" });
  if (!chave || !valor || valor <= 0) return erro(400, { erro: "DADOS_INVALIDOS" });
  if (valor > e.saldo) {
    return erro(400, { erro: "SALDO_INSUFICIENTE", saldo: e.saldo, exigido: valor });
  }

  await latencia(900);

  const e2e = gerarE2E();
  const nome = AGENDA[chave] ?? AGENDA[chave.replace(/\D/g, "")] ?? "Recebedor";

  lancar({
    descricao: descricao?.trim() || "Pix enviado",
    contraparte: nome,
    valor,
    tipo: "saida",
    e2e,
  });

  registrar(
    "Liquidação",
    "Pix enviado pelo titular",
    `${brl(valor)} para ${nome} (chave ${chave}). E2E ${e2e}.`,
    "Iniciação de pagamento sob consentimento do titular — a plataforma não detém os recursos",
  );

  return ok({ ok: true, e2e, nome, conta: contaAtual() });
}

/* ---------------- leitura ---------------- */

export function lerResumo() {
  const e = estado();
  return ok({
    conta: { ...contaAtual(), aberta: e.contaAberta },
    credito: compromissos(),
    projecao: projetar(),
    imposto: resumoImposto(),
    movimentos: e.movimentos.slice(0, 4),
  });
}

export function lerCompliance() {
  const e = estado();
  return ok({
    checklist: CHECKLIST,
    auditoria: [...e.auditoria].reverse(),
    consentimento: {
      ativo: e.consentimentoOpenFinance,
      concedidoEm: e.consentimentoConcedidoEm,
    },
  });
}

export function lerNegocio() {
  return ok({ metricas: metricas(), receita: fontesReceita(), cooperativa: cooperativa() });
}

export function zerar() {
  resetar();
  return ok({ ok: true });
}
