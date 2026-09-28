import { NextResponse } from "next/server";
import { abrirConta, lerOnboarding } from "@/lib/servicos";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = lerOnboarding();
  return NextResponse.json(r.corpo, { status: r.status });
}

/**
 * Abertura da conta de pagamento em nome do produtor. O vínculo com o Open
 * Finance e o aceite explícito são bloqueantes por desenho.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as { aceites?: Record<string, boolean> };
  const r = await abrirConta(body.aceites);
  return NextResponse.json(r.corpo, { status: r.status });
}
