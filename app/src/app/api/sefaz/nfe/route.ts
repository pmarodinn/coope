import { NextResponse } from "next/server";
import { consultarNFe } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Web service NFeDistribuicaoDFe do Ambiente Nacional da NF-e. */
export async function POST() {
  const r = await consultarNFe();
  return NextResponse.json(r.corpo, { status: r.status });
}
