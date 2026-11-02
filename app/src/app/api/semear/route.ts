import { NextResponse } from "next/server";
import { semear } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Deixa a demonstração no mesmo ponto do build estático: conta aberta e crédito contratado. */
export async function POST() {
  semear();
  return NextResponse.json({ ok: true });
}
