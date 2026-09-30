import { MAX_NOME, celularE164, formatarCelular, limparNome, type Contato } from "./pesquisa-envio";
import { PERGUNTAS, VERSAO, codificar, decodificar, resumir, type Pergunta, type Respostas } from "./pesquisa";

/**
 * O registro: o que fica guardado no banco para cada produtor que responde.
 *
 * É um documento plano, uma linha por produtor, e só tem dois tipos de campo:
 * texto e número. Nada de listas nem objetos dentro de objetos, então ele vira
 * uma linha de planilha sem nenhuma conversão.
 *
 * Os campos se ordenam sozinhos no console do Firebase (que lista em ordem
 * alfabética): primeiro quem respondeu (`contato_`), depois o envio (`envio_`),
 * depois as perguntas na ordem do questionário (`p01_`, `p02_`…).
 *
 *   contato_nome, contato_celular, contato_aceite      texto
 *   envio_em (data e hora UTC), envio_codigo           texto
 *   envio_versao                                       número
 *
 *   Pergunta de escolha única, como `p03_area`:
 *     p03_area        número  posição da opção escolhida (0 é a primeira)
 *     p03_area_txt    texto   a opção, com as palavras da tela
 *
 *   Pergunta de múltipla escolha, como `p01_uf`: uma coluna por opção
 *     p01_uf_mt       número  0 se não marcou; se marcou, a ordem do toque
 *                             (1 é o maior) quando a ordem importa, ou 1 quando não
 *     p01_uf_txt      texto   as marcadas, na ordem, separadas por vírgula
 *
 *   Campo de escrita ("Outras" culturas): `p02_culturas_outras_txt`, em texto.
 *
 * Toda coluna existe em todo registro, marcada ou não: assim não há célula
 * vazia e média, soma e contagem funcionam direto.
 */

export type Registro = Record<string, string | number>;

export interface Campo {
  nome: string;
  tipo: "texto" | "numero";
  /** Número: menor e maior valor. Texto: menor e maior tamanho. */
  min: number;
  max: number;
  /** Texto: formato exigido (RE2, o mesmo dialeto das regras do Firestore). */
  padrao?: string;
  /**
   * As regras do banco conferem faixa, tamanho e formato deste campo. Nos demais
   * conferem só o tipo: o Firestore recusa regra que gaste mais de 1.000
   * expressões por pedido, e com 75 campos não há espaço para tudo. A conferência
   * dos valores é feita na exportação (ver `registroValido` e o selo do código).
   */
  estrito?: boolean;
}

/** Nome dos campos de cada pergunta: `p` + posição com dois dígitos + id. */
export const prefixo = (p: Pergunta) => `p${String(PERGUNTAS.indexOf(p) + 1).padStart(2, "0")}_${p.id}`;

/** Maior tamanho do código: prefixo, texto livre e selo cabem folgadamente em 200. */
const MAX_CODIGO = 200;

/** Todos os campos de um registro, na ordem em que aparecem. É a única definição: o registro, as regras do banco e a exportação saem daqui. */
export function esquema(): Campo[] {
  const campos: Campo[] = [
    { nome: "contato_nome", tipo: "texto", min: 2, max: MAX_NOME, estrito: true },
    { nome: "contato_celular", tipo: "texto", min: 14, max: 14, padrao: "^\\+55[0-9]{11}$", estrito: true },
    { nome: "contato_aceite", tipo: "texto", min: 3, max: 3, padrao: "^sim$", estrito: true },
    {
      nome: "envio_em",
      tipo: "texto",
      min: 20,
      max: 20,
      padrao: "^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$",
      estrito: true,
    },
    { nome: "envio_versao", tipo: "numero", min: VERSAO, max: VERSAO, estrito: true },
    { nome: "envio_codigo", tipo: "texto", min: 10, max: MAX_CODIGO, padrao: "^COOPE[0-9]-[0-9A-Z-]+$", estrito: true },
  ];

  for (const p of PERGUNTAS) {
    const base = prefixo(p);
    if (p.tipo === "unica") {
      campos.push({ nome: base, tipo: "numero", min: 0, max: p.opcoes.length - 1 });
    } else {
      const topo = p.ordenada ? p.max! : 1;
      for (const o of p.opcoes) campos.push({ nome: `${base}_${o.chave}`, tipo: "numero", min: 0, max: topo });
    }
    if (p.escreve) {
      campos.push({
        nome: `${base}_${p.opcoes[p.escreve.opcao].chave}_txt`,
        tipo: "texto",
        min: 0,
        max: p.escreve.max,
        estrito: true,
      });
    }
    const maiorRotulo = Math.max(...p.opcoes.map((o) => o.rotulo.length));
    const tamanho = p.tipo === "unica" ? maiorRotulo : p.opcoes.reduce((s, o) => s + o.rotulo.length + 2, 0);
    campos.push({ nome: `${base}_txt`, tipo: "texto", min: 1, max: tamanho });
  }
  return campos;
}

/** Sorteio de 6 caracteres [0-9a-z]. */
function sufixoAleatorio(): string {
  const alfabeto = "0123456789abcdefghijklmnopqrstuvwxyz";
  let bytes: Uint8Array;
  try {
    bytes = crypto.getRandomValues(new Uint8Array(6));
  } catch {
    bytes = Uint8Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  }
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

/** Identificador do documento: data e hora UTC + sorteio. Ordena por data no console e nunca repete. */
export const ID_PADRAO = "^[0-9]{8}T[0-9]{4}-[0-9a-z]{6}$";
export function novoId(agora: Date): string {
  const iso = agora.toISOString(); // 2026-09-30T14:32:10.123Z
  return `${iso.slice(0, 10).replace(/-/g, "")}T${iso.slice(11, 13)}${iso.slice(14, 16)}-${sufixoAleatorio()}`;
}

/** As colunas `pNN_…` de um conjunto de respostas. `outras` é o texto de "Outras", já normalizado. */
export function colunasDasRespostas(respostas: Respostas, outras: string): Registro {
  const registro: Registro = {};
  for (const p of PERGUNTAS) {
    const base = prefixo(p);
    const v = respostas[p.id];

    if (p.tipo === "unica") {
      registro[base] = v as number;
      registro[`${base}_txt`] = p.opcoes[v as number].rotulo;
      continue;
    }

    const marcadas = v as number[];
    p.opcoes.forEach((o, i) => {
      const pos = marcadas.indexOf(i);
      registro[`${base}_${o.chave}`] = pos === -1 ? 0 : p.ordenada ? pos + 1 : 1;
    });
    if (p.escreve) registro[`${base}_${p.opcoes[p.escreve.opcao].chave}_txt`] = marcadas.includes(p.escreve.opcao) ? outras : "";
    registro[`${base}_txt`] = marcadas.map((i) => p.opcoes[i].rotulo).join(", ");
  }
  return registro;
}

export interface Montado {
  /** Identificador do documento. Fica guardado junto do registro: reenviar o mesmo não duplica. */
  id: string;
  registro: Registro;
  /** O que a pessoa vê em "Ver o que enviamos". */
  linhas: string[];
}

/** Monta o registro a partir do que a pessoa digitou e respondeu. */
export function montarRegistro(contato: Contato, respostas: Respostas, escrito: string, nonce: number, agora: Date): Montado {
  const nome = limparNome(contato.nome);
  const codigo = codificar(respostas, nonce, escrito);

  // O texto de "Outras" sai do próprio código, já normalizado: é o que vai ser somado depois.
  const d = decodificar(codigo);
  const outras = d.ok ? d.escrito : "";

  const registro: Registro = {
    contato_nome: nome,
    contato_celular: celularE164(contato.celular),
    contato_aceite: "sim",
    envio_em: agora.toISOString().slice(0, 19) + "Z",
    envio_versao: VERSAO,
    envio_codigo: codigo,
  };

  Object.assign(registro, colunasDasRespostas(respostas, outras));

  return {
    id: novoId(agora),
    registro,
    linhas: [nome, formatarCelular(contato.celular), "", ...resumir(respostas, outras)],
  };
}

/** Confere um registro contra o esquema: é o que as regras do banco fazem, e por isso o teste usa a mesma régua. */
export function registroValido(r: Record<string, unknown>): boolean {
  const campos = esquema();
  if (Object.keys(r).length !== campos.length) return false;
  return campos.every((c) => {
    const v = r[c.nome];
    if (c.tipo === "numero") return typeof v === "number" && Number.isFinite(v) && v >= c.min && v <= c.max;
    return typeof v === "string" && v.length >= c.min && v.length <= c.max && (!c.padrao || new RegExp(c.padrao).test(v));
  });
}

export type Conferencia = "ok" | "esquema" | "codigo" | "diverge";

/**
 * Confere um registro que veio do banco. As regras do Firestore só garantem o
 * formato (ver `estrito`), então aqui cada linha tem de bater com o próprio
 * código de verificação: decodifica `envio_codigo`, refaz as colunas das
 * respostas e compara. Uma linha forjada ou alterada à mão não fecha.
 */
export function conferirRegistro(r: Record<string, unknown>): Conferencia {
  if (!registroValido(r)) return "esquema";
  const d = decodificar(r.envio_codigo as string);
  if (!d.ok) return "codigo";
  const esperado = colunasDasRespostas(d.respostas, d.escrito);
  for (const [k, v] of Object.entries(esperado)) if (r[k] !== v) return "diverge";
  return "ok";
}

/* ---------------- regras de segurança do Firestore ---------------- */

/**
 * O texto de `firebase/firestore.rules`. O navegador do produtor só pode CRIAR
 * um documento que tenha exatamente estes campos, com estes tipos e limites.
 * Ler, alterar e apagar ninguém pode pelo site: os dados pessoais só saem pelo
 * console do Firebase ou pelo script de exportação, com a conta do dono.
 */
export function gerarRegras(colecao: string): string {
  const campos = esquema();
  const aspas = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

  const teste = (c: Campo) => {
    const x = `d.${c.nome}`;
    if (c.tipo === "numero") return c.estrito ? `${x} is float && ${x} == ${c.min}` : `${x} is float`;
    if (!c.estrito) return `${x} is string`;
    const tam = c.min === c.max ? `${x}.size() == ${c.max}` : `${x}.size() >= ${c.min} && ${x}.size() <= ${c.max}`;
    return `${x} is string && ${tam}${c.padrao ? ` && ${x}.matches(${aspas(c.padrao)})` : ""}`;
  };

  // Grupos pequenos: o compilador das regras recusa uma só expressão com dezenas de condições.
  const GRUPO = 10;
  const grupos: Campo[][] = [];
  for (let i = 0; i < campos.length; i += GRUPO) grupos.push(campos.slice(i, i + GRUPO));

  return `rules_version = '2';

// Gerado por \`npm run regras\` a partir de src/lib/pesquisa-registro.ts. Não edite à mão.
//
// Quem abre a pesquisa só consegue CRIAR um registro com exatamente os ${campos.length} campos
// abaixo, cada um do tipo certo (texto ou decimal). Não consegue ler, alterar nem
// apagar: nome e celular só saem pelo console do Firebase ou pela exportação.
//
// O Firestore recusa regra que gaste mais de 1.000 expressões por pedido, então
// aqui só o contato e os dados do envio têm formato conferido. Os valores das
// respostas são conferidos na exportação, pelo selo do código.
service cloud.firestore {
  match /databases/{database}/documents {
    match /${colecao}/{id} {
      allow create: if id.matches(${aspas(ID_PADRAO)}) && registroValido(request.resource.data);
      allow read, update, delete: if false;
    }

    // Tamanho exato e nomes só desta lista: nenhum campo a mais, nenhum a menos.
    function registroValido(d) {
      return d.size() == ${campos.length}
        && d.keys().hasOnly([${campos.map((c) => aspas(c.nome)).join(", ")}])
${grupos.map((_, i) => `        && grupo${i + 1}(d)`).join("\n")};
    }
${grupos
  .map(
    (g, i) => `
    function grupo${i + 1}(d) {
      return ${g.map(teste).join("\n        && ")};
    }`,
  )
  .join("\n")}
  }
}
`;
}
