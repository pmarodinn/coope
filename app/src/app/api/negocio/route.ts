import { NextResponse } from "next/server";
import { lerNegocio } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = lerNegocio();
  return NextResponse.json(r.corpo, { status: r.status });
}
