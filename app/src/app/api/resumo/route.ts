import { NextResponse } from "next/server";
import { lerResumo } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Tudo que a tela inicial precisa, em uma chamada. */
export async function GET() {
  const r = lerResumo();
  return NextResponse.json(r.corpo, { status: r.status });
}
