/**
 * Peças comuns aos scripts que leem o Firestore com o login da CLI do Firebase.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);

export function carregarCliente() {
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

export type Campo = { stringValue?: string; doubleValue?: number; integerValue?: string };
export interface Doc {
  name: string;
  fields?: Record<string, Campo>;
}

export const valor = (c: Campo) => (c.stringValue !== undefined ? c.stringValue : Number(c.doubleValue ?? c.integerValue));

const celula = (v: string | number) => {
  const t = String(v);
  return /[;"\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
export const planilha = (cab: string[], linhas: (string | number)[][]) =>
  "﻿" + [cab, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n") + "\r\n";

/** +5511900000000 vira "+55 11 90000-0000": com o mais na frente e sem ser só dígitos, a planilha não converte em número. */
export const celularLegivel = (e164: string) => `+55 ${e164.slice(3, 5)} ${e164.slice(5, 10)}-${e164.slice(10)}`;

