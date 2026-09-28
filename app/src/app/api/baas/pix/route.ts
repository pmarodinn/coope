import { NextResponse } from "next/server";
import { enviarPix } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Iniciação de Pix a partir da conta do próprio titular. */
export async function POST(req: Request) {
  const { chave, valor, descricao } = (await req.json()) as {
    chave: string;
    valor: number;
    descricao?: string;
  };
  const r = await enviarPix(chave, valor, descricao);
  return NextResponse.json(r.corpo, { status: r.status });
}
