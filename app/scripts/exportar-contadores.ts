/**
 * Baixa os pré-cadastros de escritórios (página /contadores) e escreve
 * `exportados/contadores.csv` na raiz do repositório, fora do git: uma linha por
 * escritório, com os rótulos legíveis, pronta para o comercial.
 *
 * Linha que não confere com o esquema (forjada, de outra versão) fica de fora
 * e é listada no fim.
 *
 * Uso:  npm run exportar:contadores
 * Precisa de `firebase login` na máquina.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { conferirLead, esquemaLead, LEAD, rotuloDe } from "../src/lib/contador-lead";
import { PESQUISA } from "../src/lib/pesquisa-config";
import { carregarCliente, celularLegivel, planilha, valor, type Doc } from "./comum";

const { projectId } = PESQUISA.firebase;

const CABECALHO: Record<string, string> = {
  contato_nome: "Nome",
  contato_cargo: "Papel",
  contato_celular: "WhatsApp",
  contato_email: "E-mail",
  contato_horario: "Melhor horário",
  escritorio_nome: "Escritório",
  escritorio_cnpj: "CNPJ",
  escritorio_crc: "CRC",
  escritorio_cidade: "Cidade",
  escritorio_uf: "UF",
  escritorio_equipe: "Equipe",
  carteira_produtores: "Produtores rurais",
  carteira_contribuintes: "Acima de R$ 3,6 mi",
  carteira_atividades: "Atividades",
  carteira_lcdpr: "Faz LCDPR",
  rotina_software: "Sistema",
  rotina_software_outro: "Sistema (outro)",
  rotina_notas: "Como chegam as notas",
  rotina_extratos: "Como chegam os extratos",
  reforma_preparo: "Preparo para 2027",
  reforma_dores: "Preocupações",
  proximo_interesse: "Quer",
  proximo_prazo: "Decide",
  origem: "Como conheceu",
  observacao: "Observação",
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
  utm_content: "utm_content",
  aceite: "Aceite",
  envio_em: "Enviado em (UTC)",
  envio_versao: "Versão",
};

const cnpjLegivel = (d: string) =>
  d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : d;

(async () => {
  const { requireAuth, configstore, Client, api } = carregarCliente();
  await requireAuth({ user: configstore.get("user"), tokens: configstore.get("tokens"), project: projectId });
  const origem = typeof api.firestoreOrigin === "function" ? api.firestoreOrigin() : api.firestoreOrigin;
  const cliente = new Client({ urlPrefix: origem, auth: true, apiVersion: "v1" });

  const docs: Doc[] = [];
  let pagina: string | undefined;
  do {
    const r = await cliente.get(`/projects/${projectId}/databases/(default)/documents/${LEAD.colecao}`, {
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
    const motivo = conferirLead(linha);
    if (motivo === "ok") boas.push({ id, ...linha });
    else ruins.push({ id, motivo });
  }
  boas.sort((a, b) => String(b.envio_em).localeCompare(String(a.envio_em)));
  console.log(`${docs.length} pré-cadastros no banco: ${boas.length} conferem, ${ruins.length} não.`);

  const colunas = esquemaLead().map((c) => c.nome);
  const celulaDe = (c: string, v: string | number) => {
    if (c === "contato_celular") return celularLegivel(String(v));
    if (c === "escritorio_cnpj") return cnpjLegivel(String(v));
    return typeof v === "string" ? rotuloDe(c, v) : v;
  };

  const saida = resolve(__dirname, "../../exportados");
  mkdirSync(saida, { recursive: true });
  writeFileSync(
    resolve(saida, "contadores.csv"),
    planilha(
      ["id", ...colunas.map((c) => CABECALHO[c] ?? c)],
      boas.map((r) => [String(r.id), ...colunas.map((c) => celulaDe(c, r[c]))]),
    ),
  );
  console.log(`Escrito em ${resolve(saida, "contadores.csv")}`);

  if (ruins.length) {
    console.log("\nFora da planilha:");
    for (const x of ruins) console.log(`  ${x.id}  (campo: ${x.motivo})`);
  }
})().catch((e) => {
  console.error("Erro:", e.message ?? e);
  process.exit(1);
});
