import { NextResponse } from "next/server";
import { vincularCertificado } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function POST() {
  const r = await vincularCertificado();
  return NextResponse.json(r.corpo, { status: r.status });
}
