import { NextResponse } from "next/server";
import { gerarArquivoLCDPR, lerLCDPR } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Apuração do Livro Caixa Digital do Produtor Rural no regime de caixa. */
export async function GET() {
  const r = await lerLCDPR();
  return NextResponse.json(r.corpo, { status: r.status });
}

/** Simula a geração do arquivo digital do LCDPR para transmissão à Receita. */
export async function POST() {
  const r = await gerarArquivoLCDPR();
  return NextResponse.json(r.corpo, { status: r.status });
}
