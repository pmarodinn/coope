import { NextResponse } from "next/server";
import { lerConta, receberDesembolso } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = lerConta();
  return NextResponse.json(r.corpo, { status: r.status });
}

/** Desembolso do financiador direto na conta do produtor. */
export async function POST() {
  const r = await receberDesembolso();
  return NextResponse.json(r.corpo, { status: r.status });
}
