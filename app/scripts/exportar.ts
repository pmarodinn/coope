/**
 * Baixa as respostas da pesquisa do Firestore e escreve duas planilhas em
 * `exportados/` (na raiz do repositório, fora do git):
 *
 *   respostas.csv     todas as colunas, com nome e celular, para o comercial
 *   estatisticas.csv  sem nome nem celular, para as contas
 *
 * Só entram linhas que conferem com o próprio código de verificação. Linha que
 * não fecha (forjada, alterada à mão, de outra versão do questionário) fica de
 * fora e é listada no fim, com o motivo.
 *
 * Uso:  npm run exportar
 * Precisa de `firebase login` na máquina (usa o mesmo login da CLI do Firebase).
 * `--listar` só conta e mostra o que existe. `--apagar-invalidas` remove do banco
 * as linhas que não conferem (pede o login com permissão de escrita).
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { PESQUISA } from "../src/lib/pesquisa-config";
import { conferirRegistro, esquema, type Conferencia } from "../src/lib/pesquisa-registro";

const { projectId, colecao } = PESQUISA.firebase;
const require = createRequire(import.meta.url);

function carregarCliente() {
  // A pasta `lib` da CLI: achada pelo comando `firebase` do PATH, que é por onde ela foi instalada.
  const achar = () => {
    try {
      const bin = execSync("readlink -f \"$(command -v firebase)\"", { shell: "/bin/bash" }).toString().trim();
      return resolve(bin, "../..");
    } catch {
      return `${execSync("npm root -g").toString().trim()}/firebase-tools/lib`;
    }
  };
  const raiz = process.env.FIREBASE_TOOLS_DIR ?? achar();
  try {
    return {
      requireAuth: require(`${raiz}/requireAuth`).requireAuth,
      configstore: require(`${raiz}/configstore`).configstore,
      Client: require(`${raiz}/apiv2`).Client,
      api: require(`${raiz}/api`),
    };
  } catch {
    console.error("Não achei a CLI do Firebase. Instale com `npm i -g firebase-tools` e rode `firebase login`.");
    process.exit(1);
  }
}

type Campo = { stringValue?: string; doubleValue?: number; integerValue?: string };
interface Doc {
  name: string;
  fields?: Record<string, Campo>;
}

const valor = (c: Campo) => (c.stringValue !== undefined ? c.stringValue : Number(c.doubleValue ?? c.integerValue));

const celula = (v: string | number) => {
  const t = String(v);
  return /[;"\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const planilha = (cab: string[], linhas: (string | number)[][]) =>
  "﻿" + [cab, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n") + "\r\n";

/** +5511900000000 vira "+55 11 90000-0000": com o mais na frente e sem ser só dígitos, a planilha não converte em número. */
const celularLegivel = (e164: string) => `+55 ${e164.slice(3, 5)} ${e164.slice(5, 10)}-${e164.slice(10)}`;

(async () => {
  const { requireAuth, configstore, Client, api } = carregarCliente();
  await requireAuth({ user: configstore.get("user"), tokens: configstore.get("tokens"), project: projectId });
  const origem = typeof api.firestoreOrigin === "function" ? api.firestoreOrigin() : api.firestoreOrigin;
  const cliente = new Client({ urlPrefix: origem, auth: true, apiVersion: "v1" });

  const docs: Doc[] = [];
  let pagina: string | undefined;
  do {
    const r = await cliente.get(`/projects/${projectId}/databases/(default)/documents/${colecao}`, {
      queryParams: { pageSize: "300", ...(pagina ? { pageToken: pagina } : {}) },
    });
    docs.push(...(r.body.documents ?? []));
    pagina = r.body.nextPageToken;
  } while (pagina);

  const boas: Record<string, string | number>[] = [];
  const ruins: { id: string; motivo: Conferencia }[] = [];
  for (const d of docs) {
    const linha: Record<string, string | number> = {};
    for (const [k, c] of Object.entries(d.fields ?? {})) linha[k] = valor(c);
    const id = d.name.split("/").pop()!;
    const motivo = conferirRegistro(linha);
    if (motivo === "ok") boas.push({ id, ...linha });
    else ruins.push({ id, motivo });
  }
  boas.sort((a, b) => String(a.envio_em).localeCompare(String(b.envio_em)));

  console.log(`${docs.length} registros no banco: ${boas.length} conferem, ${ruins.length} não.`);

  if (process.argv.includes("--listar")) {
    for (const d of docs) console.log(" ", d.name.split("/").pop());
    return;
  }

  if (process.argv.includes("--apagar-invalidas") && ruins.length) {
    for (const x of ruins) await cliente.delete(`/projects/${projectId}/databases/(default)/documents/${colecao}/${x.id}`);
    console.log(`${ruins.length} registros que não conferiam foram apagados do banco.`);
  }

  const colunas = esquema().map((c) => c.nome);
  const comContato = ["id", ...colunas];
  const semContato = ["id", ...colunas.filter((c) => !c.startsWith("contato_"))];

  const saida = resolve(__dirname, "../../exportados");
  mkdirSync(saida, { recursive: true });
  writeFileSync(
    resolve(saida, "respostas.csv"),
    planilha(
      comContato,
      boas.map((r) => comContato.map((c) => (c === "contato_celular" ? celularLegivel(String(r[c])) : r[c]))),
    ),
  );
  writeFileSync(resolve(saida, "estatisticas.csv"), planilha(semContato, boas.map((r) => semContato.map((c) => r[c]))));
  console.log(`Escrito em ${saida}: respostas.csv (com contato) e estatisticas.csv (sem nome nem celular).`);

  if (ruins.length && !process.argv.includes("--apagar-invalidas")) {
    console.log("\nFora das planilhas:");
    for (const x of ruins) console.log(`  ${x.id}  (${x.motivo})`);
    console.log("Para removê-las do banco: npm run exportar -- --apagar-invalidas");
  }
})().catch((e) => {
  console.error("Erro:", e.message ?? e);
  process.exit(1);
});
