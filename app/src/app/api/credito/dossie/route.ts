import { NextResponse } from "next/server";
import { empacotarDossie, lerDossie } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await lerDossie();
  return NextResponse.json(r.corpo, { status: r.status });
}

/** Empacota o dossiê para submissão a financiadores. */
export async function POST() {
  const r = await empacotarDossie();
  return NextResponse.json(r.corpo, { status: r.status });
}
