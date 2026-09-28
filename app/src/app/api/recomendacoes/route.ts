import { NextResponse } from "next/server";
import { lerRecomendacoes } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await lerRecomendacoes();
  return NextResponse.json(r.corpo, { status: r.status });
}
