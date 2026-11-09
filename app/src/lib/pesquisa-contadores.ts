import { celularE164, limparNome } from "./pesquisa-envio";
import { ID_PADRAO, novoId } from "./pesquisa-registro";

/**
 * Pesquisa com escritórios de contabilidade (página /pesquisa-contadores).
 *
 * Mesmo princípio da pesquisa com produtores: medir como o escritório trabalha
 * hoje, o que já faz, já paga e já sofre, e nunca mostrar ou sugerir um produto.
 * Nenhuma pergunta cita a Coope nem pergunta se a pessoa "usaria" algo.
 *
 * Só respostas fechadas. Cada pergunta vira uma coluna `pNN_id`: escolha única
 * guarda a chave da opção; múltipla guarda as chaves separadas por ";", na
 * ordem dos toques (nas ordenadas, a primeira é a maior).
 *
 * Mudou opção ou ordem? Suba VERSAO, rode `npm run regras` e publique as regras.
 */

export const PESQUISA_CONTADORES = { colecao: "pesquisa_contadores", versao: 1 } as const;

export interface OpcaoC {
  v: string;
  rotulo: string;
  /** Vale sozinha: marcá-la desmarca as outras. */
  exclusiva?: boolean;
}

export interface PerguntaC {
  id: string;
  titulo: string;
  dica?: string;
  tipo: "unica" | "multipla";
  max?: number;
  /** A ordem dos toques é a resposta: o primeiro é o maior. */
  ordenada?: boolean;
  colunas?: 1 | 2 | 3;
  opcoes: OpcaoC[];
}

const o = (v: string, rotulo: string, exclusiva?: boolean): OpcaoC => ({ v, rotulo, exclusiva });

export const PERGUNTAS_C: PerguntaC[] = [
  /* ---------- universo do escritório ---------- */
  {
    id: "uf",
    titulo: "Em qual estado fica o escritório?",
    tipo: "unica",
    colunas: 3,
    opcoes: ["MT", "MS", "GO", "PR", "RS", "SP", "MG", "BA", "SC", "TO", "MA", "PI", "PA", "RO", "Outro"].map((u) =>
      o(u.toLowerCase(), u),
    ),
  },
  {
    id: "equipe",
    titulo: "Quantas pessoas trabalham no escritório, contando você?",
    tipo: "unica",
    opcoes: [o("1", "Só eu"), o("2a5", "2 a 5"), o("6a15", "6 a 15"), o("16a40", "16 a 40"), o("mais40", "Mais de 40")],
  },
  {
    id: "clientes",
    titulo: "Quantos clientes o escritório atende hoje?",
    dica: "Somando todas as áreas. Pode ser aproximado.",
    tipo: "unica",
    opcoes: [
      o("ate30", "Até 30"),
      o("31a100", "31 a 100"),
      o("101a300", "101 a 300"),
      o("301a800", "301 a 800"),
      o("mais800", "Mais de 800"),
    ],
  },
  {
    id: "areas",
    titulo: "Que tipo de cliente o escritório atende?",
    dica: "Toque em ordem: primeiro onde está a maior parte dos clientes. Até 4.",
    tipo: "multipla",
    ordenada: true,
    max: 4,
    opcoes: [
      o("produtor", "Produtor rural"),
      o("empresa_agro", "Empresas do agro (revenda, cerealista, agroindústria)"),
      o("comercio", "Comércio"),
      o("servicos", "Serviços"),
      o("industria", "Indústria"),
      o("construcao", "Construção"),
      o("pessoa_fisica", "Pessoa física (IRPF, autônomos)"),
      o("terceiro_setor", "Associações e cooperativas"),
      o("outros", "Outros"),
    ],
  },
  {
    id: "produtores",
    titulo: "Quantos desses clientes são produtores rurais?",
    tipo: "unica",
    opcoes: [
      o("nenhum", "Nenhum"),
      o("ate10", "Até 10"),
      o("11a30", "11 a 30"),
      o("31a100", "31 a 100"),
      o("mais100", "Mais de 100"),
    ],
  },
  {
    id: "acima36",
    titulo: "Quantos produtores da carteira faturam mais de R$ 3,6 milhões por ano?",
    tipo: "unica",
    opcoes: [
      o("sem_produtor", "Não atendemos produtor rural"),
      o("nenhum", "Nenhum"),
      o("1a5", "1 a 5"),
      o("6a15", "6 a 15"),
      o("mais15", "Mais de 15"),
      o("nao_sabe", "Ainda não levantamos"),
    ],
  },

  /* ---------- rotina e gargalos ---------- */
  {
    id: "tempo",
    titulo: "Onde a equipe mais perde tempo hoje?",
    dica: "Escolha até 3.",
    tipo: "multipla",
    max: 3,
    opcoes: [
      o("cobrar_docs", "Cobrar documento do cliente"),
      o("lancar_notas", "Lançar e conferir notas"),
      o("conciliar", "Conciliar extrato bancário"),
      o("apurar", "Apurar impostos e emitir guias"),
      o("acessorias", "Obrigações acessórias (SPED, DCTFWeb, ECF)"),
      o("folha", "Folha de pagamento"),
      o("atender", "Responder dúvidas de cliente no WhatsApp"),
      o("retrabalho", "Corrigir erro que veio do cliente"),
    ],
  },
  {
    id: "notas",
    titulo: "Como as notas fiscais dos clientes chegam ao escritório?",
    tipo: "unica",
    opcoes: [
      o("cliente_manda", "O cliente manda o XML ou o PDF"),
      o("portal_sefaz", "Baixamos no portal da SEFAZ, uma a uma"),
      o("automatico", "Um sistema baixa sozinho"),
      o("misto", "Cada cliente de um jeito"),
    ],
  },
  {
    id: "extratos",
    titulo: "E os extratos bancários?",
    tipo: "unica",
    opcoes: [
      o("pdf_whats", "PDF ou print, pelo WhatsApp ou e-mail"),
      o("ofx", "Arquivo do banco (OFX)"),
      o("acesso_banco", "Entramos no banco com a senha do cliente"),
      o("automatico", "Chegam sozinhos por uma integração"),
      o("nao_mandam", "Muitos clientes não mandam"),
    ],
  },

  /* ---------- ferramentas ---------- */
  {
    id: "sistema",
    titulo: "Qual é o sistema contábil principal do escritório?",
    tipo: "unica",
    colunas: 2,
    opcoes: [
      o("dominio", "Domínio"),
      o("alterdata", "Alterdata"),
      o("questor", "Questor"),
      o("fortes", "Fortes"),
      o("sci", "SCI"),
      o("contmatic", "Contmatic"),
      o("mastermaq", "Mastermaq"),
      o("prosoft", "Prosoft"),
      o("nasajon", "Nasajon"),
      o("proprio", "Sistema próprio"),
      o("outro", "Outro"),
    ],
  },
  {
    id: "ferramentas",
    titulo: "Além do sistema contábil, o escritório usa ferramenta para quê?",
    dica: "Marque todas que usam hoje.",
    tipo: "multipla",
    opcoes: [
      o("captura_notas", "Baixar notas automaticamente"),
      o("conciliacao", "Conciliação bancária"),
      o("portal_cliente", "Portal ou app para o cliente mandar documentos"),
      o("atendimento", "Atendimento por WhatsApp em equipe"),
      o("tarefas", "Controle de tarefas e prazos"),
      o("rural", "Gestão do produtor rural ou LCDPR"),
      o("ia", "Inteligência artificial (ChatGPT ou parecido)"),
      o("planilhas", "Planilhas próprias"),
      o("nenhuma", "Só o sistema contábil", true),
    ],
  },
  {
    id: "gasto",
    titulo: "Quanto o escritório gasta por mês com sistemas e ferramentas?",
    dica: "Somando tudo. Pode ser aproximado.",
    tipo: "unica",
    opcoes: [
      o("ate500", "Até R$ 500"),
      o("500a2000", "R$ 500 a 2 mil"),
      o("2a5mil", "R$ 2 mil a 5 mil"),
      o("5a15mil", "R$ 5 mil a 15 mil"),
      o("mais15mil", "Mais de R$ 15 mil"),
      o("nao_sabe", "Não sei"),
    ],
  },

  /* ---------- crescimento ---------- */
  {
    id: "crescer",
    titulo: "Nos próximos 12 meses, o escritório quer aumentar a carteira?",
    tipo: "unica",
    opcoes: [
      o("bastante", "Sim, crescer bastante"),
      o("pouco", "Sim, crescer um pouco"),
      o("manter", "Manter como está"),
      o("enxugar", "Reduzir e ficar com os melhores clientes"),
    ],
  },
  {
    id: "como_crescer",
    titulo: "Como o escritório pretende conseguir clientes novos?",
    dica: "Escolha até 3.",
    tipo: "multipla",
    max: 3,
    opcoes: [
      o("indicacao", "Indicação de clientes"),
      o("parcerias", "Parceria com cooperativa, revenda, sindicato ou banco"),
      o("redes", "Instagram e redes sociais"),
      o("google", "Google e site"),
      o("eventos", "Palestras e eventos"),
      o("novo_servico", "Oferecer um serviço novo"),
      o("aquisicao", "Comprar ou juntar com outro escritório"),
      o("nao_busca", "Não estamos buscando clientes", true),
    ],
  },
  {
    id: "trava",
    titulo: "O que mais trava o crescimento do escritório?",
    dica: "Escolha até 2.",
    tipo: "multipla",
    max: 2,
    opcoes: [
      o("gente", "Falta gente qualificada"),
      o("rotina", "A rotina toma o tempo da equipe"),
      o("preco", "O cliente não aceita pagar mais"),
      o("concorrencia", "Concorrência de escritórios maiores ou online"),
      o("desorganizado", "Cliente desorganizado gera retrabalho"),
      o("vender", "Falta tempo para vender"),
      o("nada", "Nada trava hoje", true),
    ],
  },
  {
    id: "honorario_rural",
    titulo: "Quanto o escritório cobra, em média, por mês de um produtor rural?",
    tipo: "unica",
    opcoes: [
      o("sem_produtor", "Não atendemos produtor rural"),
      o("ate300", "Até R$ 300"),
      o("300a800", "R$ 300 a 800"),
      o("800a1500", "R$ 800 a 1.500"),
      o("1500a3000", "R$ 1.500 a 3 mil"),
      o("mais3000", "Mais de R$ 3 mil"),
    ],
  },

  /* ---------- reforma tributária ---------- */
  {
    id: "reforma_feito",
    titulo: "O que o escritório já fez para a reforma tributária?",
    dica: "Marque tudo o que já foi feito.",
    tipo: "multipla",
    opcoes: [
      o("curso", "Curso ou treinamento da equipe"),
      o("mapeou", "Levantou quais clientes viram contribuintes de IBS e CBS"),
      o("conversou", "Conversou com os clientes sobre 2027"),
      o("emissor", "Ajustou sistema ou emissor de notas"),
      o("cnpj", "Começou a tirar CNPJ de produtores pessoa física"),
      o("honorarios", "Revisou o valor dos honorários"),
      o("nada", "Nada ainda", true),
    ],
  },
  {
    id: "reforma_preocupa",
    titulo: "Sobre a reforma, o que mais preocupa o escritório?",
    dica: "Escolha até 2.",
    tipo: "multipla",
    max: 2,
    opcoes: [
      o("volume", "Mais trabalho todo mês"),
      o("cobrar", "Cobrar o trabalho a mais do cliente"),
      o("notas_erradas", "Clientes emitindo nota errada"),
      o("sistemas", "Sistemas que não ficam prontos a tempo"),
      o("regras", "Regras que ainda mudam"),
      o("responsabilidade", "Multa ou responsabilidade sobre o escritório"),
      o("tranquilo", "Não estamos preocupados", true),
    ],
  },
];

export type RespostasC = Record<string, string | string[]>;

export const porIdC = (id: string) => PERGUNTAS_C.find((p) => p.id === id)!;

export function respondidaC(p: PerguntaC, v: string | string[] | undefined): boolean {
  if (p.tipo === "unica") return typeof v === "string" && p.opcoes.some((x) => x.v === v);
  if (!Array.isArray(v) || v.length === 0) return false;
  if (p.max !== undefined && v.length > p.max) return false;
  if (new Set(v).size !== v.length) return false;
  if (!v.every((x) => p.opcoes.some((op) => op.v === x))) return false;
  const exclusivas = v.filter((x) => p.opcoes.find((op) => op.v === x)?.exclusiva);
  return exclusivas.length === 0 || v.length === 1;
}

/* ---------------- registro ---------------- */

export const colunaC = (p: PerguntaC) => `p${String(PERGUNTAS_C.indexOf(p) + 1).padStart(2, "0")}_${p.id}`;

interface CampoC {
  nome: string;
  tipo: "texto" | "numero";
  valores?: string[];
  lista?: string[];
  padrao?: string;
  min?: number;
  max?: number;
}

export function esquemaC(): CampoC[] {
  return [
    { nome: "contato_nome", tipo: "texto", min: 2, max: 60 },
    { nome: "contato_celular", tipo: "texto", padrao: "^\\+55[0-9]{11}$", min: 14, max: 14 },
    { nome: "contato_aceite", tipo: "texto", valores: ["sim"] },
    ...PERGUNTAS_C.map((p) =>
      p.tipo === "unica"
        ? { nome: colunaC(p), tipo: "texto" as const, valores: p.opcoes.map((x) => x.v) }
        : { nome: colunaC(p), tipo: "texto" as const, lista: p.opcoes.map((x) => x.v) },
    ),
    { nome: "utm_source", tipo: "texto", padrao: "^[A-Za-z0-9 _.:/+-]*$", min: 0, max: 80 },
    { nome: "utm_content", tipo: "texto", padrao: "^[A-Za-z0-9 _.:/+-]*$", min: 0, max: 80 },
    {
      nome: "envio_em",
      tipo: "texto",
      padrao: "^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$",
      min: 20,
      max: 20,
    },
    { nome: "envio_versao", tipo: "numero", min: PESQUISA_CONTADORES.versao, max: PESQUISA_CONTADORES.versao },
  ];
}

export function montarC(
  contato: { nome: string; celular: string },
  r: RespostasC,
  utm: { utm_source: string; utm_content: string },
  agora = new Date(),
) {
  const registro: Record<string, string | number> = {
    contato_nome: limparNome(contato.nome),
    contato_celular: celularE164(contato.celular),
    contato_aceite: "sim",
  };
  for (const p of PERGUNTAS_C) {
    const v = r[p.id];
    if (!respondidaC(p, v)) throw new Error(`Resposta inválida para "${p.id}"`);
    registro[colunaC(p)] = Array.isArray(v) ? v.join(";") : (v as string);
  }
  registro.utm_source = utm.utm_source;
  registro.utm_content = utm.utm_content;
  registro.envio_em = agora.toISOString().slice(0, 19) + "Z";
  registro.envio_versao = PESQUISA_CONTADORES.versao;
  return { id: novoId(agora), registro };
}

/** Confere um registro baixado do banco. "ok" ou o nome do campo que não fecha. */
export function conferirC(reg: Record<string, string | number>): string {
  const campos = esquemaC();
  if (Object.keys(reg).filter((k) => k !== "id").length !== campos.length) return "número de campos";
  for (const c of campos) {
    const v = reg[c.nome];
    if (c.tipo === "numero") {
      if (v !== c.min) return c.nome;
      continue;
    }
    if (typeof v !== "string") return c.nome;
    if (c.valores && !c.valores.includes(v)) return c.nome;
    if (c.padrao && !new RegExp(c.padrao).test(v)) return c.nome;
    if (c.min !== undefined && v.length < c.min) return c.nome;
    if (c.max !== undefined && v.length > c.max) return c.nome;
  }
  for (const p of PERGUNTAS_C.filter((x) => x.tipo === "multipla")) {
    if (!respondidaC(p, String(reg[colunaC(p)]).split(";"))) return colunaC(p);
  }
  return "ok";
}

/** Texto legível de uma coluna, para a planilha. */
export function rotuloC(coluna: string, v: string): string {
  const p = PERGUNTAS_C.find((x) => colunaC(x) === coluna);
  if (!p) return v;
  return v
    .split(";")
    .map((x, i) => {
      const r = p.opcoes.find((op) => op.v === x)?.rotulo ?? x;
      return p.ordenada && v.includes(";") ? `${i + 1}. ${r}` : r;
    })
    .join(p.ordenada ? " | " : ", ");
}

/* ---------------- regras do Firestore ---------------- */

export function gerarRegrasPesquisaContadores(): string {
  const aspas = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  const campos = esquemaC();
  const teste = (c: CampoC) => {
    const x = `d.${c.nome}`;
    if (c.tipo === "numero") return `${x} is float && ${x} == ${c.min}`;
    if (c.valores) return `${x} is string && ${x} in [${c.valores.map(aspas).join(", ")}]`;
    if (c.lista) {
      const item = `(${c.lista.join("|")})`;
      return `${x} is string && ${x}.size() <= 300 && ${x}.matches(${aspas(`^${item}(;${item})*$`)})`;
    }
    const tam = c.min === c.max ? `${x}.size() == ${c.max}` : `${x}.size() >= ${c.min} && ${x}.size() <= ${c.max}`;
    return `${x} is string && ${tam}${c.padrao ? ` && ${x}.matches(${aspas(c.padrao)})` : ""}`;
  };
  const GRUPO = 8;
  const grupos: CampoC[][] = [];
  for (let i = 0; i < campos.length; i += GRUPO) grupos.push(campos.slice(i, i + GRUPO));

  return `
    // Pesquisa com escritórios de contabilidade (/pesquisa-contadores), gerado de
    // src/lib/pesquisa-contadores.ts. O site só cria, no formato exato.
    match /${PESQUISA_CONTADORES.colecao}/{id} {
      allow create: if id.matches(${aspas(ID_PADRAO)}) && pcValido(request.resource.data);
      allow read, update, delete: if false;
    }

    function pcValido(d) {
      return d.size() == ${campos.length}
        && d.keys().hasOnly([${campos.map((c) => aspas(c.nome)).join(", ")}])
${grupos.map((_, i) => `        && pcGrupo${i + 1}(d)`).join("\n")};
    }
${grupos
  .map(
    (g, i) => `
    function pcGrupo${i + 1}(d) {
      return ${g.map(teste).join("\n        && ")};
    }`,
  )
  .join("\n")}
`;
}
