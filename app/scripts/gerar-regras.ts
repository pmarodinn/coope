/**
 * Escreve firebase/firestore.rules a partir do esquema em src/lib/pesquisa-registro.ts.
 * Rode depois de mudar uma pergunta ou opção: `npm run regras`.
 * Para publicar: `firebase deploy --only firestore:rules` na raiz do repositório.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PESQUISA } from "../src/lib/pesquisa-config";
import { gerarRegras } from "../src/lib/pesquisa-registro";

const destino = resolve(__dirname, "../../firebase/firestore.rules");
writeFileSync(destino, gerarRegras(PESQUISA.firebase.colecao));
console.log(`Regras escritas em ${destino}`);
