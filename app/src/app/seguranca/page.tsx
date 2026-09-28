"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Botao, Chip, Divisor, Icone, Linha, Tile, Titulo, Vazio } from "@/components/ui";
import type { EventoAuditoria } from "@/lib/domain";

/** As garantias em linguagem de gente; a norma fica como nota de rodapé. */
const GARANTIAS = [
  {
    icone: "cadeado",
    titulo: "O dinheiro nunca é nosso",
    texto:
      "A conta fica no seu nome, em banco autorizado. A Coope não guarda, não mistura e não empresta o seu dinheiro.",
    norma: "Res. Conjunta BCB/CMN nº 16/2025",
  },
  {
    icone: "olho",
    titulo: "Você decide o que a gente vê",
    texto: "Só lemos seus extratos com a sua autorização, e você pode cortar o acesso quando quiser.",
    norma: "LGPD",
  },
  {
    icone: "check",
    titulo: "A gente não escolhe por você",
    texto:
      "Sugerimos crédito que combina com o seu perfil, porque somos obrigados a oferecer o que serve. Mas quem assina é você — e sobre seguro e trava de preço só explicamos.",
    norma: "Res. CMN nº 4.935/2021 · Res. CVM nº 19/2021",
  },
  {
    icone: "escudo",
    titulo: "Tudo fica registrado",
    texto:
      "Cada nota, cada pagamento e cada autorização ficam guardados por 10 anos, com comprovante.",
    norma: "Circular BCB nº 3.978/2020",
  },
];

/** O que um modelo genérico marcaria como suspeito e é rotina no campo. */
const SAZONALIDADE = [
  {
    padrao: "Tudo entra em 3 meses do ano",
    veredito: "normal" as const,
    texto: "É a janela de comercialização da safra. Um modelo de varejo leria como concentração atípica.",
  },
  {
    padrao: "Pagamento único de R$ 1,08 mi a fornecedor",
    veredito: "normal" as const,
    texto: "Compra de adubo para 2.900 hectares. O valor alto é da escala, não do risco.",
  },
  {
    padrao: "Conta parada 8 meses e depois movimenta forte",
    veredito: "normal" as const,
    texto: "Ciclo produtivo. Inatividade seguida de pico é o desenho da atividade rural.",
  },
  {
    padrao: "Saque em espécie acima de R$ 50 mil",
    veredito: "reporta" as const,
    texto: "Aí sim há comunicação obrigatória ao COAF, independentemente do setor.",
  },
  {
    padrao: "Pagamento a contraparte fora da cadeia declarada",
    veredito: "revisa" as const,
    texto: "Foge da finalidade contratada com o financiador. Vai para revisão humana.",
  },
];

export default function Seguranca() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [consentimento, setConsentimento] = useState(false);
  const [revogando, setRevogando] = useState(false);

  async function carregar() {
    const r = await fetch("/api/compliance").then((x) => x.json());
    setEventos(r.auditoria ?? []);
    setConsentimento(!!r.consentimento?.ativo);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function revogar() {
    setRevogando(true);
    await fetch("/api/openfinance/consent", { method: "DELETE" });
    await carregar();
    setRevogando(false);
  }

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center gap-2 px-1">
        <Link href="/" className="-ml-1 text-muted" aria-label="Voltar">
          <Icone nome="voltar" tamanho={20} />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight">Segurança</h1>
      </div>

      <div className="space-y-3">
        {GARANTIAS.map((g) => (
          <Tile key={g.titulo} className="p-5">
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-brand">
                <Icone nome={g.icone} tamanho={19} />
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold">{g.titulo}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{g.texto}</p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-faint">
                  {g.norma}
                </p>
              </div>
            </div>
          </Tile>
        ))}
      </div>

      {/* Seus dados — direitos do titular */}
      <section>
        <Titulo>Seus dados</Titulo>
        <Tile className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold">Acesso aos seus bancos</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {consentimento
                  ? "Ativo. Enquanto estiver ligado, lemos seus extratos para conferir com as notas e calcular seu imposto."
                  : "Desligado. Sem ele, o imposto para de ser calculado sozinho e não dá para abrir conta nova."}
              </p>
            </div>
            <Chip tom={consentimento ? "bom" : "neutro"}>{consentimento ? "Ligado" : "Desligado"}</Chip>
          </div>

          {consentimento && (
            <div className="mt-4">
              <Botao variante="suave" largura="cheia" onClick={revogar} carregando={revogando}>
                Cortar o acesso agora
              </Botao>
            </div>
          )}

          <div className="mt-4 space-y-2.5 border-t border-line pt-4">
            {[
              ["Falar com o encarregado de dados", "privacidade@coope.com.br"],
              ["Pedir cópia dos seus dados", "Em até 15 dias"],
              ["Apagar seus dados", "Respeitando a guarda de 10 anos exigida por lei"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-[13px]">
                <span className="text-muted">{k}</span>
                <span className="max-w-[55%] text-right font-medium leading-snug">{v}</span>
              </div>
            ))}
          </div>
        </Tile>
      </section>

      {/* PLD/FT calibrado ao agro */}
      <section>
        <Titulo>Como a gente separa o normal do suspeito</Titulo>
        <Tile className="p-5">
          <p className="text-[13px] leading-relaxed text-muted">
            Um sistema antifraude feito para o varejo acharia a sua conta estranha o tempo todo. O
            nosso é calibrado para o ciclo de safra.
          </p>

          <div className="mt-4 space-y-2.5">
            {SAZONALIDADE.map((s) => (
              <div
                key={s.padrao}
                className={`rounded-xl px-3.5 py-3 ${
                  s.veredito === "normal"
                    ? "bg-brand-soft"
                    : s.veredito === "reporta"
                      ? "bg-bad-soft"
                      : "bg-warn-soft"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold leading-snug text-ink">{s.padrao}</p>
                  <Chip
                    tom={
                      s.veredito === "normal" ? "bom" : s.veredito === "reporta" ? "ruim" : "atencao"
                    }
                  >
                    {s.veredito === "normal"
                      ? "normal"
                      : s.veredito === "reporta"
                        ? "comunica"
                        : "revisa"}
                  </Chip>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{s.texto}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 border-t border-line pt-3.5 text-[11.5px] leading-relaxed text-faint">
            Circular BCB nº 3.978/2020. Um modelo mal calibrado gera falso positivo em série, que
            atrapalha o produtor e ainda piora a qualidade do que é realmente comunicado.
          </p>
        </Tile>
      </section>

      {/* Trilha */}
      <section>
        <Titulo>O que aconteceu na sua conta</Titulo>
        <Tile className="overflow-hidden">
          {eventos.length === 0 ? (
            <Vazio>Nada por aqui ainda. Use o app e os registros aparecem.</Vazio>
          ) : (
            eventos.slice(0, 14).map((e, i) => (
              <div key={e.id}>
                {i > 0 && <Divisor />}
                <Linha
                  icone="check"
                  titulo={e.evento}
                  sub={e.detalhe}
                  valor={new Date(e.ts).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </div>
            ))
          )}
        </Tile>
      </section>

      <p className="px-1 pb-2 text-[11.5px] leading-relaxed text-faint">
        Demonstração com dados de exemplo. Nenhuma conta ou integração real está ativa.
      </p>
    </div>
  );
}
