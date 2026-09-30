/**
 * Para onde vão as respostas da pesquisa. Edite aqui e publique.
 *
 * Sem nada configurado a pesquisa já funciona: no fim o produtor toca em
 * "Enviar pelo WhatsApp" e escolhe a conversa. Configurar qualquer um dos dois
 * abaixo só deixa o caminho mais curto.
 */
export const PESQUISA = {
  /**
   * WhatsApp que recebe as respostas, só dígitos, com país e DDD.
   * Exemplo: "5565999998888". Vazio: o produtor escolhe a conversa.
   */
  whatsapp: "",

  /**
   * Endereço que recebe as respostas por POST em JSON, sem ninguém precisar
   * tocar em nada (Formspree, Web3Forms, FormSubmit, um Worker próprio).
   * Vazio: só o caminho do WhatsApp.
   */
  endpoint: process.env.NEXT_PUBLIC_PESQUISA_ENDPOINT ?? "",

  /** Campos fixos enviados junto, como a chave pública do Web3Forms. */
  camposExtras: {} as Record<string, string>,
};

export function linkWhatsapp(texto: string) {
  const numero = PESQUISA.whatsapp.replace(/\D/g, "");
  const base = numero ? `https://wa.me/${numero}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(texto)}`;
}

/** Indicar a pesquisa a outro produtor: sempre escolhe a conversa. */
export function linkIndicar(url: string) {
  const texto = `Pesquisa rápida para quem produz, leva uns 2 minutos e não pede nome nem CPF: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
