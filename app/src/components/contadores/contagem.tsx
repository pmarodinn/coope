"use client";

import { useEffect, useState } from "react";
import { diasAte, PRAZOS } from "@/lib/reforma";

/**
 * Dias até 01/01/2027, contados no aparelho de quem lê. O build é estático:
 * calcular no servidor congelaria o número no dia da publicação.
 */
export function Contagem() {
  const [dias, setDias] = useState<number | null>(null);
  useEffect(() => setDias(diasAte(PRAZOS.cbsECnpj)), []);
  return (
    <span className="tabular-nums" aria-live="polite">
      {dias ?? "  "}
    </span>
  );
}
