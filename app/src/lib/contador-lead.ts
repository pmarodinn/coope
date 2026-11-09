import { celularE164, celularValido, limparNome, nomeValido } from "./pesquisa-envio";
import { ID_PADRAO, novoId } from "./pesquisa-registro";

/**
 * Pré-cadastro de escritórios de contabilidade (página /contadores).
 *
 * Um documento plano por escritório na coleção `contadores` do mesmo Firestore
 * da pesquisa. O esquema abaixo é a fonte única: dele saem o registro enviado,
 * as regras de segurança (`npm run regras`) e a conferência da exportação
 * (`npm run exportar:contadores`). Mudou uma opção? Suba VERSAO, regere as
 * regras e publique.
 */

export const LEAD = { colecao: "contadores", versao: 1 } as const;

export interface Opcao {
  v: string;
  rotulo: string;
  nota?: string;
}

const op = (v: string, rotulo: string, nota?: string): Opcao => ({ v, rotulo, nota });

export const OPCOES = {
  cargo: [
    op("socio", "Sócio ou titular"),
    op("contador", "Contador responsável"),
    op("gerente", "Gerente ou coordenador"),
    op("analista", "Analista ou assistente"),
    op("outro", "Outro"),
  ],
  horario: [op("manha", "Manhã"), op("tarde", "Tarde"), op("qualquer", "Qualquer horário")],
  equipe: [
    op("1", "Só eu"),
    op("2a5", "2 a 5 pessoas"),
    op("6a15", "6 a 15 pessoas"),
    op("16a40", "16 a 40 pessoas"),
    op("mais40", "Mais de 40"),
  ],
  produtores: [
    op("ate10", "Até 10"),
    op("11a30", "11 a 30"),
    op("31a80", "31 a 80"),
    op("81a200", "81 a 200"),
    op("mais200", "Mais de 200"),
  ],
  contribuintes: [
    op("nenhum", "Nenhum"),
    op("1a5", "1 a 5"),
    op("6a15", "6 a 15"),
    op("16a40", "16 a 40"),
    op("mais40", "Mais de 40"),
    op("nao_sei", "Ainda não sei"),
  ],
  atividades: [
    op("graos", "Soja e milho"),
    op("algodao", "Algodão"),
    op("cafe", "Café"),
    op("cana", "Cana"),
    op("pecuaria", "Pecuária de corte"),
    op("leite", "Leite"),
    op("hortifruti", "Hortifrúti"),
    op("outras", "Outras"),
  ],
  lcdpr: [op("todos", "Sim, para todos"), op("alguns", "Para alguns"), op("nenhum", "Não fazemos")],
  software: [
    op("dominio", "Domínio"),
    op("alterdata", "Alterdata"),
    op("questor", "Questor"),
    op("fortes", "Fortes"),
    op("sci", "SCI"),
    op("contmatic", "Contmatic"),
    op("mastermaq", "Mastermaq"),
    op("prosoft", "Prosoft"),
    op("nasajon", "Nasajon"),
    op("proprio", "Sistema próprio"),
    op("planilha", "Planilha"),
    op("outro", "Outro"),
  ],
  notas: [
    op("cliente_envia", "O cliente manda XML ou PDF"),
    op("sefaz_certificado", "Baixamos na SEFAZ com o certificado do cliente"),
    op("cnpj_escritorio", "Pelo CNPJ do escritório autorizado na nota"),
    op("misto", "Cada cliente de um jeito"),
  ],
  extratos: [
    op("pdf", "PDF, foto ou print"),
    op("ofx", "Arquivo do banco (OFX)"),
    op("acesso_banco", "Entramos no banco do cliente"),
    op("nao_recebe", "Não recebemos com regularidade"),
  ],
  preparo: [
    op("comecou", "Já começamos", "A carteira está mapeada"),
    op("planejando", "Sabemos o que fazer", "Falta executar"),
    op("nao_comecou", "Ainda não começamos"),
    op("sem_saber", "Não sabemos por onde começar"),
  ],
  dores: [
    op("volume", "Volume de trabalho a partir de janeiro"),
    op("cnpj", "CNPJ dos produtores pessoa física"),
    op("notas", "Notas de venda sem IBS e CBS"),
    op("regime", "Decidir quem entra no regime regular"),
    op("extrato", "Conferir extrato e livro caixa"),
    op("cobranca", "Cobrar o trabalho novo do cliente"),
    op("equipe", "Falta gente na equipe"),
    op("credito", "Clientes pedindo ajuda com crédito"),
  ],
  interesse: [
    op("diagnostico", "Diagnóstico 2027 da carteira", "Sem custo, com as notas reais"),
    op("piloto", "Testar com alguns clientes", "Piloto acompanhado"),
    op("demonstracao", "Ver uma demonstração", "Conversa de 40 minutos"),
    op("conteudo", "Por enquanto, só conteúdo", "Checklist e calendário da reforma"),
  ],
  prazo: [
    op("2026", "Ainda em 2026"),
    op("tri1", "Entre janeiro e março"),
    op("depois", "Depois de março"),
    op("conhecendo", "Só estou conhecendo"),
  ],
  origem: [
    op("instagram", "Instagram"),
    op("indicacao", "Indicação de colega"),
    op("evento", "Evento, curso ou CRC"),
    op("whatsapp", "Grupo de WhatsApp"),
    op("google", "Google"),
    op("outro", "Outro"),
  ],
} as const;

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export const MAX_DORES = 3;

/* ---------------- o que a pessoa preenche ---------------- */

export interface Lead {
  nome: string;
  cargo: string;
  celular: string;
  email: string;
  horario: string;
  escritorio: string;
  cnpj: string;
  crc: string;
  cidade: string;
  uf: string;
  equipe: string;
  produtores: string;
  contribuintes: string;
  atividades: string[];
  lcdpr: string;
  software: string;
  softwareOutro: string;
  notas: string;
  extratos: string;
  preparo: string;
  dores: string[];
  interesse: string;
  prazo: string;
  origem: string;
  observacao: string;
  aceite: boolean;
}

export const LEAD_VAZIO: Lead = {
  nome: "",
  cargo: "",
  celular: "",
  email: "",
  horario: "qualquer",
  escritorio: "",
  cnpj: "",
  crc: "",
  cidade: "",
  uf: "",
  equipe: "",
  produtores: "",
  contribuintes: "",
  atividades: [],
  lcdpr: "",
  software: "",
  softwareOutro: "",
  notas: "",
  extratos: "",
  preparo: "",
  dores: [],
  interesse: "",
  prazo: "",
  origem: "",
  observacao: "",
  aceite: false,
};

/* ---------------- validação ---------------- */

export const emailValido = (s: string) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s.trim()) && s.trim().length <= 120;

export const soDigitos = (s: string) => s.replace(/\D/g, "");

export function formatarCnpj(s: string) {
  const d = soDigitos(s).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Dígitos verificadores do CNPJ: barra erro de digitação antes de virar contato perdido. */
export function cnpjValido(s: string) {
  const d = soDigitos(s);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const dv = (base: string) => {
    let soma = 0;
    let peso = base.length - 7;
    for (const c of base) {
      soma += Number(c) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(d.slice(0, 12)) === Number(d[12]) && dv(d.slice(0, 13)) === Number(d[13]);
}

const textoLimpo = (s: string, max: number) =>
  s
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);

export type Erros = Partial<Record<keyof Lead, string>>;

/** Erros de uma etapa do formulário. Etapas: 0 você, 1 escritório, 2 carteira, 3 rotina, 4 reforma. */
export function errosDaEtapa(l: Lead, etapa: number): Erros {
  const e: Erros = {};
  if (etapa === 0) {
    if (!nomeValido(l.nome)) e.nome = "Escreva seu nome.";
    if (!l.cargo) e.cargo = "Escolha uma opção.";
    if (!celularValido(l.celular)) e.celular = "Celular com DDD, 11 dígitos.";
    if (!emailValido(l.email)) e.email = "Confira o e-mail.";
  }
  if (etapa === 1) {
    if (textoLimpo(l.escritorio, 100).length < 2) e.escritorio = "Nome do escritório.";
    if (textoLimpo(l.cidade, 60).length < 2) e.cidade = "Cidade do escritório.";
    if (!UFS.includes(l.uf)) e.uf = "Escolha o estado.";
    if (l.cnpj && !cnpjValido(l.cnpj)) e.cnpj = "CNPJ inválido. Confira ou deixe em branco.";
    if (!l.equipe) e.equipe = "Escolha uma opção.";
  }
  if (etapa === 2) {
    if (!l.produtores) e.produtores = "Escolha uma opção.";
    if (!l.contribuintes) e.contribuintes = "Escolha uma opção.";
    if (l.atividades.length === 0) e.atividades = "Marque ao menos uma.";
    if (!l.lcdpr) e.lcdpr = "Escolha uma opção.";
  }
  if (etapa === 3) {
    if (!l.software) e.software = "Escolha o sistema.";
    if (l.software === "outro" && textoLimpo(l.softwareOutro, 60).length < 2) e.softwareOutro = "Qual sistema?";
    if (!l.notas) e.notas = "Escolha uma opção.";
    if (!l.extratos) e.extratos = "Escolha uma opção.";
  }
  if (etapa === 4) {
    if (!l.preparo) e.preparo = "Escolha uma opção.";
    if (l.dores.length === 0) e.dores = `Marque até ${MAX_DORES}.`;
    if (!l.interesse) e.interesse = "Escolha uma opção.";
    if (!l.prazo) e.prazo = "Escolha uma opção.";
    if (!l.origem) e.origem = "Escolha uma opção.";
    if (!l.aceite) e.aceite = "Precisamos do seu aceite para entrar em contato.";
  }
  return e;
}

/* ---------------- esquema do documento ---------------- */

interface CampoLead {
  nome: string;
  tipo: "texto" | "numero";
  /** Valores aceitos (lista fechada). */
  valores?: readonly string[];
  /** Lista separada por ";" de valores desta lista. */
  lista?: readonly string[];
  padrao?: string;
  min?: number;
  max?: number;
}

const vals = (k: keyof typeof OPCOES) => OPCOES[k].map((o) => o.v);
const UTM_PADRAO = "^[A-Za-z0-9 _.:/+-]*$";

export function esquemaLead(): CampoLead[] {
  return [
    { nome: "contato_nome", tipo: "texto", min: 2, max: 60 },
    { nome: "contato_cargo", tipo: "texto", valores: vals("cargo") },
    { nome: "contato_celular", tipo: "texto", padrao: "^\\+55[0-9]{11}$", min: 14, max: 14 },
    { nome: "contato_email", tipo: "texto", padrao: "^[^@\\s]+@[^@\\s]+\\.[A-Za-z]{2,}$", min: 6, max: 120 },
    { nome: "contato_horario", tipo: "texto", valores: vals("horario") },
    { nome: "escritorio_nome", tipo: "texto", min: 2, max: 100 },
    { nome: "escritorio_cnpj", tipo: "texto", padrao: "^([0-9]{14})?$", min: 0, max: 14 },
    { nome: "escritorio_crc", tipo: "texto", min: 0, max: 30 },
    { nome: "escritorio_cidade", tipo: "texto", min: 2, max: 60 },
    { nome: "escritorio_uf", tipo: "texto", valores: UFS },
    { nome: "escritorio_equipe", tipo: "texto", valores: vals("equipe") },
    { nome: "carteira_produtores", tipo: "texto", valores: vals("produtores") },
    { nome: "carteira_contribuintes", tipo: "texto", valores: vals("contribuintes") },
    { nome: "carteira_atividades", tipo: "texto", lista: vals("atividades") },
    { nome: "carteira_lcdpr", tipo: "texto", valores: vals("lcdpr") },
    { nome: "rotina_software", tipo: "texto", valores: vals("software") },
    { nome: "rotina_software_outro", tipo: "texto", min: 0, max: 60 },
    { nome: "rotina_notas", tipo: "texto", valores: vals("notas") },
    { nome: "rotina_extratos", tipo: "texto", valores: vals("extratos") },
    { nome: "reforma_preparo", tipo: "texto", valores: vals("preparo") },
    { nome: "reforma_dores", tipo: "texto", lista: vals("dores") },
    { nome: "proximo_interesse", tipo: "texto", valores: vals("interesse") },
    { nome: "proximo_prazo", tipo: "texto", valores: vals("prazo") },
    { nome: "origem", tipo: "texto", valores: vals("origem") },
    { nome: "observacao", tipo: "texto", min: 0, max: 500 },
    { nome: "utm_source", tipo: "texto", padrao: UTM_PADRAO, min: 0, max: 80 },
    { nome: "utm_medium", tipo: "texto", padrao: UTM_PADRAO, min: 0, max: 80 },
    { nome: "utm_campaign", tipo: "texto", padrao: UTM_PADRAO, min: 0, max: 80 },
    { nome: "utm_content", tipo: "texto", padrao: UTM_PADRAO, min: 0, max: 80 },
    { nome: "aceite", tipo: "texto", valores: ["sim"] },
    { nome: "envio_em", tipo: "texto", padrao: "^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$", min: 20, max: 20 },
    { nome: "envio_versao", tipo: "numero", min: LEAD.versao, max: LEAD.versao },
  ];
}

export interface Utm {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

export const UTM_VAZIO: Utm = { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "" };

/** Parâmetros de campanha do link (ex.: ?utm_source=instagram&utm_content=video-12). */
export function lerUtm(busca: string): Utm {
  const p = new URLSearchParams(busca);
  const limpo = (k: string) => (p.get(k) ?? "").replace(/[^A-Za-z0-9 _.:/+-]/g, "").slice(0, 80);
  return {
    utm_source: limpo("utm_source"),
    utm_medium: limpo("utm_medium"),
    utm_campaign: limpo("utm_campaign"),
    utm_content: limpo("utm_content"),
  };
}

/** O documento que vai para o banco. */
export function pacoteDoLead(l: Lead, utm: Utm, agora = new Date()) {
  const registro: Record<string, string | number> = {
    contato_nome: limparNome(l.nome),
    contato_cargo: l.cargo,
    contato_celular: celularE164(l.celular),
    contato_email: l.email.trim().toLowerCase(),
    contato_horario: l.horario,
    escritorio_nome: textoLimpo(l.escritorio, 100),
    escritorio_cnpj: l.cnpj ? soDigitos(l.cnpj) : "",
    escritorio_crc: textoLimpo(l.crc, 30),
    escritorio_cidade: textoLimpo(l.cidade, 60),
    escritorio_uf: l.uf,
    escritorio_equipe: l.equipe,
    carteira_produtores: l.produtores,
    carteira_contribuintes: l.contribuintes,
    carteira_atividades: l.atividades.join(";"),
    carteira_lcdpr: l.lcdpr,
    rotina_software: l.software,
    rotina_software_outro: l.software === "outro" ? textoLimpo(l.softwareOutro, 60) : "",
    rotina_notas: l.notas,
    rotina_extratos: l.extratos,
    reforma_preparo: l.preparo,
    reforma_dores: l.dores.join(";"),
    proximo_interesse: l.interesse,
    proximo_prazo: l.prazo,
    origem: l.origem,
    observacao: textoLimpo(l.observacao, 500),
    ...utm,
    aceite: "sim",
    envio_em: agora.toISOString().slice(0, 19) + "Z",
    envio_versao: LEAD.versao,
  };
  return { id: novoId(agora), registro };
}

/* ---------------- conferência (exportação) ---------------- */

export function conferirLead(r: Record<string, string | number>): "ok" | string {
  const campos = esquemaLead();
  const chaves = Object.keys(r).filter((k) => k !== "id");
  if (chaves.length !== campos.length) return "número de campos";
  for (const c of campos) {
    const v = r[c.nome];
    if (c.tipo === "numero") {
      if (typeof v !== "number" || v !== c.min) return c.nome;
      continue;
    }
    if (typeof v !== "string") return c.nome;
    if (c.valores && !c.valores.includes(v)) return c.nome;
    if (c.lista) {
      const itens = v.split(";");
      if (!v || !itens.every((i) => c.lista!.includes(i))) return c.nome;
    }
    if (c.padrao && !new RegExp(c.padrao).test(v)) return c.nome;
    if (c.min !== undefined && v.length < c.min) return c.nome;
    if (c.max !== undefined && v.length > c.max) return c.nome;
  }
  return "ok";
}

/** Rótulo legível de um valor, para a planilha. */
export function rotuloDe(campo: string, v: string): string {
  const mapa: Record<string, keyof typeof OPCOES> = {
    contato_cargo: "cargo",
    contato_horario: "horario",
    escritorio_equipe: "equipe",
    carteira_produtores: "produtores",
    carteira_contribuintes: "contribuintes",
    carteira_atividades: "atividades",
    carteira_lcdpr: "lcdpr",
    rotina_software: "software",
    rotina_notas: "notas",
    rotina_extratos: "extratos",
    reforma_preparo: "preparo",
    reforma_dores: "dores",
    proximo_interesse: "interesse",
    proximo_prazo: "prazo",
    origem: "origem",
  };
  const k = mapa[campo];
  if (!k) return v;
  const lista = OPCOES[k] as readonly Opcao[];
  return v
    .split(";")
    .map((x) => lista.find((o) => o.v === x)?.rotulo ?? x)
    .join(", ");
}

/* ---------------- regras do Firestore ---------------- */

/** Bloco `match` da coleção de contadores, para entrar no mesmo arquivo de regras da pesquisa. */
export function gerarRegrasContadores(): string {
  const aspas = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  const campos = esquemaLead();

  const teste = (c: CampoLead) => {
    const x = `d.${c.nome}`;
    if (c.tipo === "numero") return `${x} is float && ${x} == ${c.min}`;
    if (c.valores) return `${x} is string && ${x} in [${c.valores.map(aspas).join(", ")}]`;
    if (c.lista) {
      const item = `(${c.lista.join("|")})`;
      return `${x} is string && ${x}.size() <= 200 && ${x}.matches(${aspas(`^${item}(;${item})*$`)})`;
    }
    const tam = c.min === c.max ? `${x}.size() == ${c.max}` : `${x}.size() >= ${c.min} && ${x}.size() <= ${c.max}`;
    return `${x} is string && ${tam}${c.padrao ? ` && ${x}.matches(${aspas(c.padrao)})` : ""}`;
  };

  const GRUPO = 8;
  const grupos: CampoLead[][] = [];
  for (let i = 0; i < campos.length; i += GRUPO) grupos.push(campos.slice(i, i + GRUPO));

  return `
    // Pré-cadastro de escritórios (página /contadores), gerado de src/lib/contador-lead.ts.
    // Mesmo princípio: o site só cria, no formato exato; ninguém lê pela internet.
    match /${LEAD.colecao}/{id} {
      allow create: if id.matches(${aspas(ID_PADRAO)}) && leadValido(request.resource.data);
      allow read, update, delete: if false;
    }

    function leadValido(d) {
      return d.size() == ${campos.length}
        && d.keys().hasOnly([${campos.map((c) => aspas(c.nome)).join(", ")}])
${grupos.map((_, i) => `        && leadGrupo${i + 1}(d)`).join("\n")};
    }
${grupos
  .map(
    (g, i) => `
    function leadGrupo${i + 1}(d) {
      return ${g.map(teste).join("\n        && ")};
    }`,
  )
  .join("\n")}
`;
}
