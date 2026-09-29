import { NextResponse } from "next/server";
import { analise, CASOS } from "@/lib/inteligencia";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const caso = new URL(req.url).searchParams.get("caso") ?? "menegat";
  return NextResponse.json({ casos: CASOS.map(({ extrato, ...c }) => c), ...analise(caso) });
}
