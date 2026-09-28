import { NextResponse } from "next/server";
import { lerCompliance } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = lerCompliance();
  return NextResponse.json(r.corpo, { status: r.status });
}
