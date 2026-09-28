import { NextResponse } from "next/server";
import { zerar } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Zera o estado para reapresentar a demo do início. */
export async function POST() {
  const r = zerar();
  return NextResponse.json(r.corpo, { status: r.status });
}
