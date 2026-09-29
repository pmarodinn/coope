import type { Resposta } from "./servicos";
import * as s from "./servicos";
import { estado, semear } from "./store";

/**
 * Atendimento local das rotas de API, para o build estático.
 *
 * O GitHub Pages serve arquivos, não executa servidor. Em vez de reescrever as
 * telas, interceptamos `fetch` e respondemos `/api/*` com as mesmas funções de
 * `servicos.ts` que as rotas do Next usam. O estado, que já vivia na memória
 * do processo, passa a viver na memória da aba, espelhado em sessionStorage
 * para sobreviver a um recarregamento.
 */

type Manipulador = (corpo: unknown) => Resposta | Promise<Resposta>;

const ROTAS: Record<string, Manipulador> = {
  "GET /api/resumo": () => s.lerResumo(),
  "GET /api/compliance": () => s.lerCompliance(),
  "GET /api/negocio": () => s.lerNegocio(),
  "GET /api/onboarding": () => s.lerOnboarding(),
  "GET /api/baas/conta": () => s.lerConta(),
  "GET /api/fiscal/lcdpr": () => s.lerLCDPR(),
  "GET /api/credito/dossie": () => s.lerDossie(),
  "GET /api/recomendacoes": () => s.lerRecomendacoes(),
  "GET /api/originacao": () => s.listarOfertas(),
  "GET /api/openfinance/transacoes": () => s.lerTransacoes(),

  "POST /api/reset": () => s.zerar(),
  "POST /api/semear": () => {
    semear();
    return { status: 200, corpo: { ok: true } };
  },
  "POST /api/certificado": () => s.vincularCertificado(),
  "POST /api/fiscal/lcdpr": () => s.gerarArquivoLCDPR(),
  "POST /api/credito/dossie": () => s.empacotarDossie(),
  "POST /api/sefaz/nfe": () => s.consultarNFe(),
  "POST /api/openfinance/consent": () => s.consentirOpenFinance(),
  "DELETE /api/openfinance/consent": () => s.revogarConsentimento(),
  "POST /api/baas/conta": () => s.receberDesembolso(),

  "POST /api/onboarding": (c) =>
    s.abrirConta((c as { aceites?: Record<string, boolean> } | undefined)?.aceites),
  "POST /api/originacao": (c) => s.escolherOferta((c as { ofertaId: string }).ofertaId),
  "POST /api/baas/liquidacao": (c) => s.liquidarTrava((c as { travaId: string }).travaId),
  "POST /api/baas/pix": (c) => {
    const p = c as { chave: string; valor: number; descricao?: string };
    return s.enviarPix(p.chave, p.valor, p.descricao);
  },
};

/**
 * O estado vive na memória da aba. Sem isto, recarregar a página no meio de
 * uma apresentação zeraria a conta — e um link compartilhado para uma tela
 * interna abriria vazio. A sessão guarda o progresso; fechar a aba limpa.
 */
const CHAVE = "coope:estado";

function salvar() {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(estado()));
  } catch {
    /* cota cheia ou modo restrito: a demo segue sem persistir */
  }
}

function restaurar() {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    if (bruto) Object.assign(estado(), JSON.parse(bruto));
  } catch {
    /* estado corrompido: começa do zero */
  }
}

let instalado = false;

export function instalarApiLocal() {
  if (instalado || typeof window === "undefined") return;
  instalado = true;

  // Primeira visita da sessão abre com a jornada já andada; "R$ 0" na abertura
  // faz um app financeiro parecer vazio.
  if (sessionStorage.getItem(CHAVE)) restaurar();
  else {
    semear();
    salvar();
  }

  const original = window.fetch.bind(window);

  window.fetch = async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof entrada === "string"
        ? entrada
        : entrada instanceof URL
          ? entrada.pathname
          : entrada.url;

    const caminho = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0];

    if (!caminho.includes("/api/")) return original(entrada, init);

    // Remove o basePath do Pages para casar com as chaves acima.
    const rota = caminho.slice(caminho.indexOf("/api/"));
    const metodo = (init?.method ?? "GET").toUpperCase();
    const manipulador = ROTAS[`${metodo} ${rota}`];

    if (!manipulador) {
      return new Response(JSON.stringify({ erro: "ROTA_NAO_ENCONTRADA", rota }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let corpo: unknown;
    if (typeof init?.body === "string") {
      try {
        corpo = JSON.parse(init.body);
      } catch {
        corpo = undefined;
      }
    }

    const r = await manipulador(corpo);
    if (rota === "/api/reset") sessionStorage.removeItem(CHAVE);
    else salvar();

    return new Response(JSON.stringify(r.corpo), {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  };
}
