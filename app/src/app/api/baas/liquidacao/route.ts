import { NextResponse } from "next/server";
import { liquidarTrava } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/** Pagamento de fornecedor sob trava de finalidade, a partir da conta do titular. */
export async function POST(req: Request) {
  const { travaId } = (await req.json()) as { travaId: string };
  const r = await liquidarTrava(travaId);
  return NextResponse.json(r.corpo, { status: r.status });
}
