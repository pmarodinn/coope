import { PESQUISA } from "./pesquisa-config";

/**
 * Contato do produtor, modo de teste, fila de reenvio e o envio para o Firestore.
 *
 * O contato (nome e celular) fica em campos próprios do registro e nunca entra no
 * código das respostas: o código continua sendo só o que a pessoa respondeu.
 */

/* ---------------- contato ---------------- */

// DDDs que existem. Um celular com DDD inventado é erro de digitação ou lixo.
const DDDS = new Set(
  (
    "11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 " +
    "51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 " +
    "91 92 93 94 95 96 97 98 99"
  ).split(" "),
);

export const MAX_NOME = 60;

/** Enquanto digita: letras (com acento), espaço, hífen e apóstrofo. Número e símbolo não entram. */
export function filtrarNome(s: string): string {
  return s
    .replace(/[^\p{L} '\-]/gu, "")
    .replace(/ {2,}/g, " ")
    .replace(/^[ '\-]+/, "")
    .slice(0, MAX_NOME);
}

/** Forma que vai no envio: sem espaço nas pontas e com a primeira letra de cada nome em maiúscula. */
export function limparNome(s: string): string {
  const base = filtrarNome(s).replace(/[ '\-]+$/, "");
  return base.replace(/(^|[ \-'])(\p{L})(\p{L}*)/gu, (_, ini, a, resto) => ini + a.toUpperCase() + resto.toLowerCase());
}

/** Ao menos duas letras e mais de um caractere diferente: barra "a", "aaaa" e afins. */
export function nomeValido(s: string): boolean {
  const letras = (limparNome(s).match(/\p{L}/gu) ?? []).join("").toLowerCase();
  return letras.length >= 2 && new Set(letras).size >= 2;
}

/** Só os dígitos do celular, sem o +55 caso venha colado junto. Máximo 11. */
export function celularLocal(s: string): string {
  let d = s.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d.slice(0, 11);
}

/** (65) 99999-9999, formatado aos poucos enquanto a pessoa digita. */
export function formatarCelular(s: string): string {
  const d = celularLocal(s);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Celular brasileiro: 11 dígitos, DDD que existe, começa em 9 e não é tudo igual. */
export function celularValido(s: string): boolean {
  const d = celularLocal(s);
  return d.length === 11 && DDDS.has(d.slice(0, 2)) && d[2] === "9" && !/^(\d)\1+$/.test(d);
}

export const celularE164 = (s: string) => `+55${celularLocal(s)}`;

export interface Contato {
  nome: string;
  celular: string;
}

/* ---------------- endereço e modo ---------------- */

const hostLocal = (h: string) => h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";

/** Só https (ou http em máquina local): dado pessoal não viaja em texto aberto. */
export function enderecoValido(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || (u.protocol === "http:" && hostLocal(u.hostname));
  } catch {
    return false;
  }
}

export interface Modo {
  /** Há para onde enviar. */
  configurado: boolean;
  /** Nada é enviado: fica só neste aparelho, para conferir o formulário. */
  teste: boolean;
}

/**
 * Teste é pedido com ?teste=1, ou acontece sozinho em máquina local quando o
 * destino seria o banco de verdade. Assim ninguém grava registro de mentira na
 * base real enquanto desenvolve ou testa.
 */
export function calcularModo(): Modo {
  const { projectId, apiKey, host } = PESQUISA.firebase;
  const configurado = !!projectId && !!apiKey && enderecoValido(host);
  const pedido = new URLSearchParams(window.location.search).get("teste") === "1";
  const local = hostLocal(window.location.hostname);
  const destinoLocal = configurado && hostLocal(new URL(host).hostname);
  return { configurado, teste: pedido || (local && !destinoLocal) };
}

/* ---------------- armazenamento ---------------- */
// Tocar em localStorage lança exceção em navegadores que bloqueiam armazenamento.

export const K_RASCUNHO = "coope:pesquisa:rascunho";
export const K_ENVIADO = "coope:pesquisa:enviado";
const K_PENDENTE = "coope:pesquisa:pendente";
const K_TESTE = "coope:pesquisa:teste";

export const ler = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
export const gravar = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* sem armazenamento: só não há como guardar */
  }
};
export const apagar = (k: string) => {
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* segue */
  }
};

/** O que vai para o banco: o identificador do documento e os campos. */
export interface Pacote {
  id: string;
  registro: Record<string, string | number>;
}

const pacoteValido = (c: unknown): c is Pacote => {
  const p = c as Pacote | null;
  if (!p || typeof p !== "object" || typeof p.id !== "string" || !p.registro || typeof p.registro !== "object") return false;
  return Object.values(p.registro).every((v) => typeof v === "string" || (typeof v === "number" && Number.isFinite(v)));
};

/** Resposta que não chegou ao banco: fica guardada no aparelho até conseguir enviar. */
export function lerPendente(): Pacote | null {
  const bruto = ler(K_PENDENTE);
  if (!bruto) return null;
  try {
    const c = JSON.parse(bruto);
    return pacoteValido(c) ? c : null;
  } catch {
    return null;
  }
}
export const guardarPendente = (c: Pacote) => gravar(K_PENDENTE, JSON.stringify(c));
export const limparPendente = () => apagar(K_PENDENTE);

/** Modo de teste: o envio vira uma linha guardada aqui, para conferir depois. */
export function guardarTeste(c: Pacote) {
  let lista: Pacote[] = [];
  try {
    lista = JSON.parse(ler(K_TESTE) ?? "[]");
  } catch {
    /* recomeça */
  }
  gravar(K_TESTE, JSON.stringify([...lista, c]));
}

/* ---------------- envio ---------------- */

/** Campo do Firestore: só texto (`stringValue`) e número decimal (`doubleValue`). */
const campoFirestore = (v: string | number) => (typeof v === "number" ? { doubleValue: v } : { stringValue: v });

/**
 * Grava o registro no Firestore pela API REST, sem biblioteca: um POST com o
 * identificador já definido. Se a resposta se perdeu no caminho e a página
 * reenvia, o banco responde "já existe" e isso conta como enviado, então reenviar
 * nunca duplica.
 */
export async function enviar(pacote: Pacote): Promise<"ok" | "falhou"> {
  const { projectId, apiKey, colecao, host } = PESQUISA.firebase;
  const url =
    `${host}/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${colecao}` +
    `?documentId=${encodeURIComponent(pacote.id)}&key=${encodeURIComponent(apiKey)}`;

  const fields: Record<string, ReturnType<typeof campoFirestore>> = {};
  for (const [k, v] of Object.entries(pacote.registro)) fields[k] = campoFirestore(v);

  const ctl = new AbortController();
  const espera = setTimeout(() => ctl.abort(), 15_000); // rede no campo é lenta
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
      signal: ctl.signal,
    });
    if (r.ok) return "ok";
    if (r.status === 409) {
      try {
        const j = await r.json();
        if (j?.error?.status === "ALREADY_EXISTS") return "ok";
      } catch {
        /* sem corpo legível: conta como falha */
      }
    }
    return "falhou";
  } catch {
    return "falhou";
  } finally {
    clearTimeout(espera);
  }
}
