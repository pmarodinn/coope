"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Atalho, Barra, Botao, Chip, Divisor, Icone, Linha, Tile, Titulo, Vazio } from "@/components/ui";
import type { ContaIndividualizada, TravaFinalidade } from "@/lib/domain";
import { brl } from "@/lib/engine";
import type { Movimento } from "@/lib/store";
import { PRODUTOR } from "@/lib/seed";

export default function Conta() {
  const [conta, setConta] = useState<ContaIndividualizada | null>(null);
  const [pagamentos, setPagamentos] = useState<TravaFinalidade[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [aberta, setAberta] = useState(false);
  const [oferta, setOferta] = useState<string | null>(null);
  const [recebendo, setRecebendo] = useState(false);
  const [pagando, setPagando] = useState<string | null>(null);

  // envio de Pix
  const [pixAberto, setPixAberto] = useState(false);
  const [chave, setChave] = useState("");
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recibo, setRecibo] = useState<{ nome: string; e2e: string; valor: number } | null>(null);
  const [erroPix, setErroPix] = useState<string | null>(null);

  async function carregar() {
    const r = await fetch("/api/baas/conta").then((x) => x.json());
    setConta(r.conta);
    setPagamentos(r.travas);
    setMovimentos(r.movimentos ?? []);
    setAberta(r.aberta);
    setOferta(r.ofertaContratada);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function receber() {
    setRecebendo(true);
    await fetch("/api/baas/conta", { method: "POST" });
    await carregar();
    setRecebendo(false);
  }

  async function pagar(id: string) {
    setPagando(id);
    await fetch("/api/baas/liquidacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ travaId: id }),
    });
    await carregar();
    setPagando(null);
  }

  async function enviarPix() {
    const v = Number(valor.replace(/\./g, "").replace(",", "."));
    setErroPix(null);
    if (!chave.trim() || !v || v <= 0) {
      setErroPix("Preencha a chave e o valor.");
      return;
    }
    setEnviando(true);
    const r = await fetch("/api/baas/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chave: chave.trim(), valor: v }),
    }).then((x) => x.json());
    setEnviando(false);

    if (r.ok) {
      setRecibo({ nome: r.nome, e2e: r.e2e, valor: v });
      setChave("");
      setValor("");
      await carregar();
    } else {
      setErroPix(
        r.erro === "SALDO_INSUFICIENTE" ? "Saldo não dá para esse valor." : "Não deu para enviar.",
      );
    }
  }

  if (!conta) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-40 animate-pulse rounded-card bg-surface" />
        <div className="h-52 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  const total = pagamentos.reduce((s, p) => s + p.valor, 0);
  const pago = pagamentos.filter((p) => p.status === "liquidado").reduce((s, p) => s + p.valor, 0);
  const faltam = pagamentos.filter((p) => p.status === "pendente").length;

  /* ---------- conta ainda não aberta ---------- */
  if (!aberta) {
    return (
      <div className="space-y-5 pt-1">
        <h1 className="px-1 text-[22px] font-bold tracking-tight">Sua conta</h1>

        <Tile className="rise p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icone nome="conta" tamanho={21} />
          </span>
          <p className="mt-3.5 text-[17px] font-bold tracking-tight">
            Uma conta no seu CPF, com Pix
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
            É pra ela que o dinheiro do crédito cai, e é dela que você paga os fornecedores.
          </p>

          <ul className="mt-4 space-y-2.5">
            {[
              "Receber e enviar Pix na hora",
              "O dinheiro do crédito cai direto aqui",
              "Comprovante de tudo que entra e sai",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-brand">
                  <Icone nome="check" tamanho={16} />
                </span>
                <span className="text-[13.5px] leading-snug">{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <Link href="/app/abrir-conta">
              <Botao largura="cheia">Abrir minha conta</Botao>
            </Link>
          </div>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-faint">
            Você vai conectar seus bancos e confirmar três coisas. Leva 2 minutos.
          </p>
        </Tile>
      </div>
    );
  }

  /* ---------- conta aberta ---------- */
  return (
    <div className="space-y-5 pt-1">
      <h1 className="px-1 text-[22px] font-bold tracking-tight">Sua conta</h1>

      {/* Saldo */}
      <Tile className="rise p-5">
        <p className="text-[13px] font-medium text-muted">Saldo</p>
        <p className="figure mt-1.5 text-ink">{brl(conta.saldo)}</p>
        <div className="mt-3 flex items-center gap-2">
          <Chip tom="bom">Pix ativo</Chip>
          <span className="text-[12px] text-faint">
            {conta.agencia} · {conta.numero}
          </span>
        </div>
      </Tile>

      {/* Ações Pix */}
      <div className="no-bar flex gap-2 overflow-x-auto px-1 pb-1">
        <Atalho
          icone="enviar"
          rotulo="Enviar Pix"
          onClick={() => {
            setPixAberto((v) => !v);
            setRecibo(null);
          }}
        />
        <Atalho icone="mais" rotulo="Receber" onClick={() => setPixAberto(false)} ativo={false} />
        <Atalho icone="nota" rotulo="Extrato" onClick={() => setPixAberto(false)} ativo={false} />
        {oferta && conta.saldo === 0 && movimentos.length === 0 && (
          <Atalho icone="credito" rotulo="Receber crédito" onClick={receber} />
        )}
      </div>

      {/* Formulário de Pix */}
      {pixAberto && (
        <Tile className="pop p-5">
          {recibo ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icone nome="check" tamanho={24} />
              </span>
              <p className="mt-3 text-[17px] font-bold tracking-tight">Pix enviado</p>
              <p className="tnum mt-1 text-[15px] font-semibold">{brl(recibo.valor)}</p>
              <p className="mt-0.5 text-[13px] text-muted">para {recibo.nome}</p>
              <p className="mt-3 break-all rounded-lg bg-raised px-3 py-2 font-mono text-[10.5px] text-faint">
                {recibo.e2e}
              </p>
              <div className="mt-4">
                <Botao variante="suave" largura="cheia" onClick={() => setRecibo(null)}>
                  Enviar outro
                </Botao>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[15px] font-semibold">Enviar Pix</p>
              <label className="mt-3.5 block">
                <span className="text-[12.5px] font-medium text-muted">Chave do recebedor</span>
                <input
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  placeholder="CPF, CNPJ, telefone ou e-mail"
                  className="mt-1.5 w-full rounded-xl border border-line bg-raised px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-brand"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-[12.5px] font-medium text-muted">Valor</span>
                <input
                  value={valor}
                  onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="tnum mt-1.5 w-full rounded-xl border border-line bg-raised px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-brand"
                />
              </label>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {["33931486000112", "11987654321"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChave(c)}
                    className="rounded-full bg-raised px-3 py-1.5 text-[11.5px] font-medium text-muted"
                  >
                    {c === "11987654321" ? "Maria Menegat" : "Mosaic"}
                  </button>
                ))}
              </div>

              {erroPix && (
                <p className="mt-3 rounded-xl bg-bad-soft px-3.5 py-2.5 text-[12.5px] text-bad">
                  {erroPix}
                </p>
              )}

              <div className="mt-4">
                <Botao onClick={enviarPix} carregando={enviando} largura="cheia">
                  Enviar
                </Botao>
              </div>
            </>
          )}
        </Tile>
      )}

      {/* A conta é sua */}
      <Tile className="p-5">
        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 text-brand">
            <Icone nome="cadeado" tamanho={19} />
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-semibold">A conta é sua</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Está no seu nome e no seu CPF, em um banco autorizado. O dinheiro vai direto de quem
              emprestou para você. A Coope organiza e avisa, mas nunca segura o seu dinheiro.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-line pt-3.5">
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-muted">No nome de</span>
            <span className="font-medium">{PRODUTOR.nome}</span>
          </div>
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-muted">CPF</span>
            <span className="tnum font-medium">{conta.cpfTitular}</span>
          </div>
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-muted">Bancos conectados</span>
            <span className="font-medium">3</span>
          </div>
        </div>
      </Tile>

      {/* Fornecedores */}
      <section>
        <Titulo
          acao={faltam > 0 ? <span className="text-[12.5px] text-muted">{faltam} a pagar</span> : null}
        >
          Pagar fornecedores
        </Titulo>

        <div className="mb-3 px-1">
          <div className="mb-1.5 flex justify-between text-[12.5px]">
            <span className="text-muted">Já pago</span>
            <span className="tnum font-medium">
              {brl(pago)} de {brl(total)}
            </span>
          </div>
          <Barra valor={total ? pago / total : 0} altura={6} />
        </div>

        <Tile className="overflow-hidden">
          {pagamentos.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Divisor />}
              <Linha
                icone={p.status === "liquidado" ? "check" : "enviar"}
                titulo={p.beneficiario}
                sub={p.finalidade}
                valor={brl(p.valor)}
                tom={p.status === "liquidado" ? "brand" : "ink"}
                acao={
                  p.status === "liquidado" ? (
                    <Chip tom="bom">Pago</Chip>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pagar(p.id)}
                      disabled={conta.saldo < p.valor || pagando === p.id}
                      className="shrink-0 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-brand-ink transition-transform active:scale-95 disabled:opacity-35"
                    >
                      {pagando === p.id ? "…" : "Pagar"}
                    </button>
                  )
                }
              />
            </div>
          ))}
        </Tile>
      </section>

      {/* Extrato */}
      <section>
        <Titulo>Extrato</Titulo>
        <Tile className="overflow-hidden">
          {movimentos.length === 0 ? (
            <Vazio>Nada movimentado ainda.</Vazio>
          ) : (
            movimentos.map((m, i) => (
              <div key={m.id}>
                {i > 0 && <Divisor />}
                <Linha
                  icone={m.tipo === "entrada" ? "mais" : "enviar"}
                  titulo={m.contraparte}
                  sub={`${m.descricao} · ${new Date(m.quando).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                  valor={`${m.tipo === "entrada" ? "+" : "−"} ${brl(m.valor)}`}
                  tom={m.tipo === "entrada" ? "brand" : "ink"}
                />
              </div>
            ))
          )}
        </Tile>
      </section>

      {faltam === 0 && total > 0 && (
        <Tile className="rise bg-brand-soft p-5">
          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-brand">
              <Icone nome="check" tamanho={19} />
            </span>
            <div>
              <p className="text-[14.5px] font-semibold text-brand">Tudo pago</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Quem te emprestou consegue ver que o dinheiro foi para os insumos combinados. Isso
                barateia o seu próximo crédito.
              </p>
            </div>
          </div>
        </Tile>
      )}
    </div>
  );
}
