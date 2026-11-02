import { NextResponse } from "next/server";
import { lerCarteira } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Carteira rural do escritório de contabilidade. */
export async function GET() {
  const r = lerCarteira();
  return NextResponse.json(r.corpo, { status: r.status });
}
