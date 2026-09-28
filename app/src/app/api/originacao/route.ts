import { NextResponse } from "next/server";
import { escolherOferta, listarOfertas } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Roteamento do dossiê para os financiadores parceiros. */
export async function GET() {
  const r = await listarOfertas();
  return NextResponse.json(r.corpo, { status: r.status });
}

/** Registra a escolha do produtor. A decisão é dele; a plataforma não recomenda. */
export async function POST(req: Request) {
  const { ofertaId } = (await req.json()) as { ofertaId: string };
  const r = await escolherOferta(ofertaId);
  return NextResponse.json(r.corpo, { status: r.status });
}
