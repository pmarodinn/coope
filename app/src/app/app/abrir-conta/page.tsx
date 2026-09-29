"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Botao, Chip, Icone, Tile } from "@/components/ui";
import { PRODUTOR } from "@/lib/seed";

const BANCOS = ["Banco do Brasil", "Sicredi Celeiro MT", "Itaú Unibanco"];

const ACEITES = [
  {
    chave: "termos" as const,
    titulo: "Termos de uso",
    texto: "Li e aceito as regras de uso da conta e do aplicativo.",
  },
  {
    chave: "privacidade" as const,
    titulo: "Uso dos meus dados",
    texto:
      "Autorizo ler minhas notas fiscais e meus extratos para calcular meu imposto e montar meu crédito. Posso cancelar quando quiser.",
  },
  {
    chave: "correspondente" as const,
    titulo: "Quem é a Coope nessa história",
    texto:
      "Entendi que a Coope não é banco e não empresta. Ela representa bancos e fundos, e minha conta fica em uma instituição autorizada, no meu CPF.",
  },
];

export default function AbrirConta() {
  const router = useRouter();
  const [etapa, setEtapa] = useState(1);
  const [conectado, setConectado] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [certificado, setCertificado] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [aceites, setAceites] = useState({
    termos: false,
    privacidade: false,
    correspondente: false,
  });
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((r) => {
        if (r.contaAberta) router.replace("/app/conta");
        if (r.consentimentoOpenFinance) {
          setConectado(true);
          setEtapa(2);
        }
      });
  }, [router]);

  async function conectar() {
    setConectando(true);
    await fetch("/api/openfinance/consent", { method: "POST" });
    setConectado(true);
    setConectando(false);
    setEtapa(2);
  }

  async function vincularCertificado() {
    setVinculando(true);
    await fetch("/api/certificado", { method: "POST" });
    setCertificado(true);
    setVinculando(false);
    setEtapa(3);
  }

  async function abrir() {
    setAbrindo(true);
    setErro(null);
    const r = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aceites }),
    }).then((x) => x.json());
    setAbrindo(false);
    if (r.ok) router.push("/app/conta");
    else setErro(r.mensagem ?? "Não deu para abrir a conta.");
  }

  const todosAceites = aceites.termos && aceites.privacidade && aceites.correspondente;

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center gap-2 px-1">
        <Link href="/app/conta" className="-ml-1 text-muted" aria-label="Voltar">
          <Icone nome="voltar" tamanho={20} />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight">Abrir sua conta</h1>
      </div>

      {/* Passos */}
      <div className="flex gap-2 px-1">
        {["Conectar bancos", "Autorizar notas", "Aceitar e abrir"].map((rotulo, k) => {
          const n = k + 1;
          return (
            <div key={rotulo} className="flex-1">
              <div className={`h-1 rounded-full ${etapa >= n ? "bg-brand" : "bg-line"}`} />
              <p
                className={`mt-1.5 text-[11px] font-medium leading-tight ${etapa >= n ? "text-brand" : "text-faint"}`}
              >
                {rotulo}
              </p>
            </div>
          );
        })}
      </div>

      {/* Etapa 1 — Open Finance, obrigatório */}
      <Tile className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                conectado ? "bg-brand-soft text-brand" : "bg-raised text-muted"
              }`}
            >
              <Icone nome={conectado ? "check" : "conta"} tamanho={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">Conecte seus bancos</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                É por aqui que a gente vê o que entra e o que sai, para conferir com suas notas e
                calcular seu imposto certo.
              </p>
            </div>
          </div>
          <Chip tom={conectado ? "bom" : "atencao"}>{conectado ? "Pronto" : "Obrigatório"}</Chip>
        </div>

        <div className="mt-4 space-y-2">
          {BANCOS.map((b) => (
            <div
              key={b}
              className="flex items-center justify-between gap-3 rounded-xl bg-raised px-3.5 py-2.5"
            >
              <span className="text-[13.5px] font-medium">{b}</span>
              {conectado ? (
                <span className="text-brand">
                  <Icone nome="check" tamanho={16} />
                </span>
              ) : (
                <span className="text-[12px] text-faint">aguardando</span>
              )}
            </div>
          ))}
        </div>

        {!conectado && (
          <div className="mt-4">
            <Botao onClick={conectar} carregando={conectando} largura="cheia">
              Conectar pelo Open Finance
            </Botao>
            <p className="mt-3 text-center text-[12px] leading-relaxed text-faint">
              Sem isso a conta não abre. Você autoriza no app do seu banco e pode desligar quando
              quiser.
            </p>
          </div>
        )}
      </Tile>

      {/* Etapa 2 — Certificado digital, a fricção que não tem atalho */}
      <Tile className={`p-5 ${conectado ? "" : "pointer-events-none opacity-45"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                certificado ? "bg-brand-soft text-brand" : "bg-raised text-muted"
              }`}
            >
              <Icone nome={certificado ? "check" : "nota"} tamanho={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">Autorize a busca das suas notas</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                A Receita só entrega suas notas para quem você autorizar. Isso é feito com seu
                certificado digital ou uma procuração eletrônica.
              </p>
            </div>
          </div>
          <Chip tom={certificado ? "bom" : "atencao"}>{certificado ? "Pronto" : "Obrigatório"}</Chip>
        </div>

        <div className="mt-4 rounded-xl bg-raised px-3.5 py-3">
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-muted">Certificado</span>
            <span className="font-medium">{PRODUTOR.certificadoDigital.tipo}</span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3 text-[13px]">
            <span className="text-muted">Vence em</span>
            <span className="tnum font-medium">{PRODUTOR.certificadoDigital.validade}</span>
          </div>
        </div>

        {!certificado && (
          <div className="mt-4">
            <Botao onClick={vincularCertificado} carregando={vinculando} largura="cheia">
              Autorizar com meu certificado
            </Botao>
            <p className="mt-3 text-center text-[12px] leading-relaxed text-faint">
              Não tem certificado? A gente ajuda a tirar. Sem isso, as notas teriam que ser digitadas
              uma a uma.
            </p>
          </div>
        )}
      </Tile>

      {/* Etapa 3 — Aceites */}
      <Tile className={`p-5 ${certificado ? "" : "pointer-events-none opacity-45"}`}>
        <p className="text-[15px] font-semibold">Confirme três coisas</p>
        <div className="mt-3.5 space-y-2.5">
          {ACEITES.map((a) => {
            const marcado = aceites[a.chave];
            return (
              <button
                key={a.chave}
                type="button"
                onClick={() => setAceites((s) => ({ ...s, [a.chave]: !s[a.chave] }))}
                className={`flex w-full gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  marcado ? "border-brand bg-brand-soft" : "border-line bg-surface"
                }`}
                aria-pressed={marcado}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                    marcado ? "border-brand bg-brand text-brand-ink" : "border-line"
                  }`}
                >
                  {marcado && <Icone nome="check" tamanho={12} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold">{a.titulo}</span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">
                    {a.texto}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-line pt-3.5">
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-muted">Titular</span>
            <span className="font-medium">{PRODUTOR.nome}</span>
          </div>
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-muted">CPF</span>
            <span className="tnum font-medium">{PRODUTOR.cpf}</span>
          </div>
        </div>

        {erro && (
          <p className="mt-3 rounded-xl bg-bad-soft px-3.5 py-2.5 text-[12.5px] text-bad">{erro}</p>
        )}

        <div className="mt-4">
          <Botao onClick={abrir} carregando={abrindo} disabled={!todosAceites} largura="cheia">
            Abrir conta com Pix
          </Botao>
        </div>
      </Tile>

      <p className="px-1 pb-2 text-[11.5px] leading-relaxed text-faint">
        A conta é aberta em uma instituição de pagamento autorizada, no seu nome. Seu aceite fica
        guardado com data e hora.
      </p>
    </div>
  );
}
