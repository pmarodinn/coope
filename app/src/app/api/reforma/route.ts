import { NextResponse } from "next/server";
import { lerReforma } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Situação do produtor na reforma tributária e simulação de 2027. */
export async function GET() {
  const r = lerReforma();
  return NextResponse.json(r.corpo, { status: r.status });
}
