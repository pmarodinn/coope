/**
 * Baixa as respostas da pesquisa com escritórios (/pesquisa-contadores) e
 * escreve `exportados/pesquisa-contadores.csv` (fora do git), uma linha por
 * escritório, com as respostas por extenso. Nas perguntas em que a ordem
 * importa, a resposta sai numerada: 1 é a maior.
 *
 * Uso:  npm run exportar:pesquisa-contadores
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PESQUISA } from "../src/lib/pesquisa-config";
import { colunaC, conferirC, esquemaC, PERGUNTAS_C, PESQUISA_CONTADORES, rotuloC } from "../src/lib/pesquisa-contadores";
import { carregarCliente, celularLegivel, planilha, valor, type Doc } from "./comum";

const { projectId } = PESQUISA.firebase;

(async () => {
  const { requireAuth, configstore, Client, api } = carregarCliente();
  await requireAuth({ user: configstore.get("user"), tokens: configstore.get("tokens"), project: projectId });
  const origem = typeof api.firestoreOrigin === "function" ? api.firestoreOrigin() : api.firestoreOrigin;
  const cliente = new Client({ urlPrefix: origem, auth: true, apiVersion: "v1" });

  const docs: Doc[] = [];
  let pagina: string | undefined;
  do {
    const r = await cliente.get(`/projects/${projectId}/databases/(default)/documents/${PESQUISA_CONTADORES.colecao}`, {
      queryParams: { pageSize: "300", ...(pagina ? { pageToken: pagina } : {}) },
    });
    docs.push(...(r.body.documents ?? []));
    pagina = r.body.nextPageToken;
  } while (pagina);

  const boas: Record<string, string | number>[] = [];
  const ruins: { id: string; motivo: string }[] = [];
  for (const d of docs) {
    const linha: Record<string, string | number> = {};
    for (const [k, c] of Object.entries(d.fields ?? {})) linha[k] = valor(c);
    const id = d.name.split("/").pop()!;
    const motivo = conferirC(linha);
    if (motivo === "ok") boas.push({ id, ...linha });
    else ruins.push({ id, motivo });
  }
  boas.sort((a, b) => String(b.envio_em).localeCompare(String(a.envio_em)));
  console.log(`${docs.length} respostas no banco: ${boas.length} conferem, ${ruins.length} não.`);

  const colunas = esquemaC().map((c) => c.nome);
  const titulo = (c: string) => PERGUNTAS_C.find((p) => colunaC(p) === c)?.titulo ?? c;
  const saida = resolve(__dirname, "../../exportados");
  mkdirSync(saida, { recursive: true });
  writeFileSync(
    resolve(saida, "pesquisa-contadores.csv"),
    planilha(
      ["id", ...colunas.map(titulo)],
      boas.map((r) => [
        String(r.id),
        ...colunas.map((c) =>
          c === "contato_celular" ? celularLegivel(String(r[c])) : typeof r[c] === "string" ? rotuloC(c, String(r[c])) : r[c],
        ),
      ]),
    ),
  );
  console.log(`Escrito em ${resolve(saida, "pesquisa-contadores.csv")}`);
  if (ruins.length) {
    console.log("\nFora da planilha:");
    for (const x of ruins) console.log(`  ${x.id}  (campo: ${x.motivo})`);
  }
})().catch((e) => {
  console.error("Erro:", e.message ?? e);
  process.exit(1);
});
