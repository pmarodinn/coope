/**
 * Para onde vão as respostas da pesquisa.
 *
 * Ao terminar, o formulário grava sozinho um documento no Firestore do projeto
 * "Pesquisa Dores - Coope", na coleção `respostas`. A chave abaixo é a chave
 * *web* do Firebase: ela só identifica o projeto e é pública por desenho (está
 * em todo site que usa Firebase). Quem protege os dados são as regras de
 * segurança em `firebase/firestore.rules`, que deixam o site apenas criar
 * registros no formato certo, sem ler, alterar nem apagar.
 *
 * NEXT_PUBLIC_FIRESTORE_HOST troca o servidor (usado nos testes, apontando para
 * um servidor local que imita o Firestore).
 */
export const PESQUISA = {
  firebase: {
    projectId: "pesquisa-dores---coope",
    apiKey: "AIzaSyAiEVgfCJ4hTUoU9RLnGPPALU1CTmQ-c8s",
    colecao: "respostas",
    host: process.env.NEXT_PUBLIC_FIRESTORE_HOST ?? "https://firestore.googleapis.com",
  },
};

/** Indicar a pesquisa a outro produtor: sempre escolhe a conversa. */
export function linkIndicar(url: string) {
  const texto = `Pesquisa rápida para quem produz, leva uns 3 minutos: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
