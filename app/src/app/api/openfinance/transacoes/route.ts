import { NextResponse } from "next/server";
import { lerTransacoes } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Leitura de extratos multi-instituição sob consentimento vigente. */
export async function GET() {
  const r = await lerTransacoes();
  return NextResponse.json(r.corpo, { status: r.status });
}
