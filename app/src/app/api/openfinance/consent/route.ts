import { NextResponse } from "next/server";
import { consentirOpenFinance, revogarConsentimento } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function POST() {
  const r = await consentirOpenFinance();
  return NextResponse.json(r.corpo, { status: r.status });
}

export async function DELETE() {
  const r = await revogarConsentimento();
  return NextResponse.json(r.corpo, { status: r.status });
}
