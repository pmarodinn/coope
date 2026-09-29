"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

/** Telas que já viveram na raiz, antes de o produto ir para /app. */
const ROTAS_ANTIGAS = [
  "imposto",
  "credito",
  "conta",
  "conversa",
  "cooperativa",
  "negocio",
  "seguranca",
  "abrir-conta",
];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function NaoEncontrado() {
  const [indo, setIndo] = useState<string | null>(null);

  // Links compartilhados antes da mudança apontam para /conversa, /credito e
  // afins. Em vez de entregar um beco sem saída, leva para a tela equivalente.
  useEffect(() => {
    const caminho = window.location.pathname
      .replace(BASE, "")
      .replace(/^\/+|\/+$/g, "");

    const primeiro = caminho.split("/")[0];

    if (caminho === "investidores") {
      setIndo("a apresentação");
      window.location.replace(asset("/"));
      return;
    }

    if (ROTAS_ANTIGAS.includes(primeiro)) {
      setIndo("o app");
      window.location.replace(asset(`/app/${primeiro}/`));
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[420px] text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("/coope-mark.png")}
          alt=""
          className="mx-auto h-9 w-9 rounded-lg opacity-70"
        />

        {indo ? (
          <>
            <p className="mt-7 text-[17px] font-semibold tracking-tight">
              Esse endereço mudou de lugar.
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[--tinta-2]">
              Levando você para {indo}…
            </p>
          </>
        ) : (
          <>
            <p className="mt-7 text-[17px] font-semibold tracking-tight">
              Não achamos essa página.
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[--tinta-2]">
              Ela pode ter mudado de endereço. Os dois caminhos abaixo funcionam.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="rounded-full bg-[--acento] px-6 py-3 text-[14.5px] font-semibold text-[#04130b]"
              >
                Ver a apresentação
              </Link>
              <Link
                href="/app"
                className="rounded-full border border-[--linha] px-6 py-3 text-[14.5px] font-medium transition-colors hover:border-[--acento] hover:text-[--acento]"
              >
                Abrir o app
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
