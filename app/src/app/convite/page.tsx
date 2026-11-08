"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Botao, Dica, Icone, Logo, Tile } from "@/components/ui";
import {
  CODIGO_ESCRITORIO,
  evento,
  FAIXAS,
  lerEstado,
  salvarEstado,
  type Cadastro,
  type Convite,
  type Faixa,
} from "@/lib/portal";

const BANCOS = ["Banco do Brasil", "Sicredi", "Sicoob", "Bradesco", "Itaú", "Caixa"];
const CULTURAS = ["Soja", "Soja e milho", "Milho", "Algodão", "Feijão", "Café", "Gado de corte", "Leite", "Hortaliças", "Outra"];

const mascaraCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const mascaraCelular = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const entrada =
  "h-12 w-full rounded-2xl bg-raised px-4 text-[15px] text-ink outline-none ring-1 ring-transparent placeholder:text-faint focus:bg-surface focus:ring-brand";

function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-outer md:items-center md:py-8">
      <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-canvas md:h-[860px] md:max-h-[92vh] md:rounded-[38px] md:shadow-float md:ring-1 md:ring-black/5">
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-5">
          <span className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="rounded-full bg-raised px-2.5 py-1 text-[11px] font-semibold text-muted">
              protótipo · dados fictícios
            </span>
          </span>
        </header>
        <main className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8">{children}</main>
      </div>
    </div>
  );
}

function Passos({ atual, total }: { atual: number; total: number }) {
  return (
    <div className="mb-5 flex gap-1.5 px-1">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i <= atual ? "bg-brand" : "bg-line"}`} />
      ))}
    </div>
  );
}

function Interruptor({
  ligado,
  alternar,
  titulo,
  sub,
  icone,
}: {
  ligado: boolean;
  alternar: () => void;
  titulo: string;
  sub: string;
  icone: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={titulo}
      onClick={alternar}
      className="flex w-full items-start gap-3.5 p-4 text-left"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icone nome={icone} tamanho={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{sub}</span>
      </span>
      <span
        className={`mt-1 flex h-[26px] w-[44px] shrink-0 items-center rounded-full p-[3px] transition-colors ${
          ligado ? "bg-brand" : "bg-line"
        }`}
      >
        <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${ligado ? "translate-x-[18px]" : ""}`} />
      </span>
    </button>
  );
}

export default function Pagina() {
  return (
    <Moldura>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-card bg-surface" />}>
        <ConviteProdutor />
      </Suspense>
    </Moldura>
  );
}

function ConviteProdutor() {
  const params = useSearchParams();
  const codigo = (params.get("c") ?? "").toUpperCase();
  const [convite, setConvite] = useState<Convite | null | "invalido">(null);
  const [escritorio, setEscritorio] = useState("seu escritório de contabilidade");
  const [passo, setPasso] = useState(0);

  const [dados, setDados] = useState<Cadastro>({
    nome: "",
    cpf: "",
    celular: "",
    municipio: "",
    cultura: "Soja e milho",
    faixa: "ate36",
    sefaz: true,
    openFinance: true,
    bancos: ["Sicredi"],
  });
  const [aceite, setAceite] = useState(false);

  useEffect(() => {
    fetch("/api/contador")
      .then((r) => r.json())
      .then((c) => c?.escritorio && setEscritorio(c.escritorio))
      .catch(() => {});

    const e = lerEstado();
    if (codigo === CODIGO_ESCRITORIO) {
      setConvite({
        codigo: CODIGO_ESCRITORIO,
        tipo: "cadastro",
        nome: "",
        celular: "",
        criadoEm: new Date().toISOString(),
        status: "aberto",
        avulso: true,
      });
      return;
    }
    const c = e.convites.find((x) => x.codigo === codigo);
    if (!c || c.status === "cancelado") {
      setConvite("invalido");
      return;
    }
    if (c.status === "concluido") {
      setConvite(c);
      setPasso(99);
      return;
    }
    // Abrir o link já avisa o escritório.
    if (c.status === "enviado") {
      const aberto: Convite = { ...c, status: "aberto", abertoEm: new Date().toISOString() };
      salvarEstado({
        ...e,
        convites: e.convites.map((x) => (x.codigo === c.codigo ? aberto : x)),
        eventos: [
          evento(
            `${c.nome} abriu ${c.tipo === "open_finance" ? "o pedido de Open Finance" : "o convite de pré-cadastro"}`,
            "neutro",
            c.clienteId,
          ),
          ...e.eventos,
        ],
      });
      setConvite(aberto);
    } else setConvite(c);
    setDados((d) => ({ ...d, nome: c.nome, celular: c.celular }));
  }, [codigo]);

  if (convite === null) return <div className="h-40 animate-pulse rounded-card bg-surface" />;

  if (convite === "invalido")
    return (
      <div className="rise pt-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warn-soft text-warn">
          <Icone nome="alerta" tamanho={24} />
        </span>
        <h1 className="mt-4 text-[22px] font-bold tracking-tight">Link inválido ou cancelado</h1>
        <p className="mx-auto mt-2 max-w-[30ch] text-[14px] leading-relaxed text-muted">
          Peça ao seu contador um link novo. O convite pode ter sido cancelado pelo escritório.
        </p>
      </div>
    );

  const ehOpenFinance = convite.tipo === "open_finance";
  const total = ehOpenFinance ? 2 : 3;

  const concluir = () => {
    const e = lerEstado();
    const agora = new Date().toISOString();
    const final: Convite = {
      ...convite,
      codigo: convite.avulso ? `L${Date.now().toString(36).slice(-5).toUpperCase()}` : convite.codigo,
      nome: dados.nome || convite.nome,
      celular: dados.celular || convite.celular,
      status: "concluido",
      concluidoEm: agora,
      cadastro: ehOpenFinance ? undefined : dados,
    };
    const convites = convite.avulso
      ? [final, ...e.convites]
      : e.convites.map((x) => (x.codigo === convite.codigo ? final : x));
    const ajustes =
      ehOpenFinance && convite.clienteId
        ? { ...e.ajustes, [convite.clienteId]: { ...e.ajustes[convite.clienteId], extratos: "open_finance" as const } }
        : e.ajustes;
    salvarEstado({
      ...e,
      convites,
      ajustes,
      eventos: [
        evento(
          ehOpenFinance
            ? `${final.nome} autorizou o Open Finance (${dados.bancos.join(", ")})`
            : `${final.nome} concluiu o pré-cadastro${final.avulso ? " pelo link do escritório" : ""} e entrou na carteira`,
          "bom",
          ehOpenFinance ? convite.clienteId : `novo-${final.codigo}`,
        ),
        ...e.eventos,
      ],
    });
    setConvite(final);
    setPasso(99);
  };

  const primeiro = (dados.nome || convite.nome).split(" ")[0];

  /* ---------- concluído ---------- */
  if (passo === 99)
    return (
      <div className="rise pt-8 text-center">
        <span className="pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-brand-ink">
          <Icone nome="check" tamanho={30} />
        </span>
        <h1 className="mt-5 text-[24px] font-bold tracking-tight">
          {ehOpenFinance ? "Autorização feita" : `Pronto${primeiro ? `, ${primeiro}` : ""}!`}
        </h1>
        <p className="mx-auto mt-2 max-w-[32ch] text-[14.5px] leading-relaxed text-muted">
          {ehOpenFinance
            ? "Seus extratos vão direto para o escritório. Você não precisa mais mandar arquivo do banco todo mês."
            : `Seu cadastro chegou ao ${escritorio}. O contador confere e avisa o que falta para 2027.`}
        </p>
        <div className="mt-8 space-y-3 text-left">
          <Dica icone="cadeado">
            Você pode desfazer qualquer autorização no app, em Segurança, quando quiser. A Coope lê, não movimenta.
          </Dica>
          <Link href="/app" className="block">
            <Botao largura="cheia">Abrir o app da Coope</Botao>
          </Link>
        </div>
      </div>
    );

  /* ---------- passo 0: boas-vindas ---------- */
  if (passo === 0)
    return (
      <div className="rise pt-2">
        <Passos atual={0} total={total} />
        <p className="px-1 text-[13px] font-semibold text-brand">{convite.avulso ? "Pré-cadastro" : "Convite do seu contador"}</p>
        <h1 className="mt-1.5 px-1 text-[26px] font-bold leading-tight tracking-tight">
          {ehOpenFinance
            ? `${primeiro}, autorize seus extratos`
            : convite.avulso
              ? "Prepare sua fazenda para a reforma de 2027"
              : `${primeiro}, seu contador chamou você para a Coope`}
        </h1>
        <p className="mt-3 px-1 text-[14.5px] leading-relaxed text-muted">
          {ehOpenFinance
            ? `O ${escritorio} pediu acesso de leitura aos seus extratos pelo Open Finance. Assim o livro caixa fecha sozinho todo mês.`
            : `O ${escritorio} usa a Coope para cuidar das suas notas, do livro caixa e da reforma tributária. Leva 3 minutos.`}
        </p>

        <Tile className="mt-6 overflow-hidden">
          {(ehOpenFinance
            ? [
                ["banco", "Só leitura", "Ninguém faz Pix nem pagamento com essa autorização."],
                ["relogio", "Vale por 12 meses", "Você renova ou cancela quando quiser."],
                ["escudo", "Regulado pelo Banco Central", "Feito por instituição autorizada do Open Finance."],
              ]
            : [
                ["nota", "Notas organizadas", "As notas da SEFAZ chegam sozinhas ao escritório."],
                ["calendario", "Reforma 2027", "Você sabe se vira contribuinte de IBS/CBS e o que falta."],
                ["credito", "Imposto de renda", "A forma mais barata entre resultado e presunção de 20%."],
              ]
          ).map(([i, t, s], k) => (
            <div key={t} className={`flex gap-3.5 p-4 ${k ? "border-t border-line" : ""}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-brand">
                <Icone nome={i} tamanho={18} />
              </span>
              <span>
                <span className="block text-[14.5px] font-semibold">{t}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{s}</span>
              </span>
            </div>
          ))}
        </Tile>

        <div className="mt-6">
          <Botao largura="cheia" onClick={() => setPasso(1)}>
            {ehOpenFinance ? "Escolher os bancos" : "Começar"}
          </Botao>
        </div>
      </div>
    );

  /* ---------- open finance: bancos e consentimento ---------- */
  if (ehOpenFinance)
    return (
      <div className="rise pt-2">
        <Passos atual={1} total={total} />
        <h1 className="px-1 text-[22px] font-bold tracking-tight">Em quais bancos você tem conta?</h1>
        <p className="mt-1.5 px-1 text-[13.5px] text-muted">Marque todos. O escritório vê só o extrato.</p>
        <Bancos dados={dados} setDados={setDados} />
        <Aceite aceite={aceite} setAceite={setAceite} escritorio={escritorio} />
        <div className="mt-6 flex gap-2">
          <Botao variante="suave" onClick={() => setPasso(0)}>
            Voltar
          </Botao>
          <Botao largura="cheia" disabled={!aceite || dados.bancos.length === 0} onClick={concluir}>
            Autorizar
          </Botao>
        </div>
      </div>
    );

  /* ---------- cadastro: dados ---------- */
  if (passo === 1) {
    const ok =
      dados.nome.trim().length > 2 &&
      dados.cpf.replace(/\D/g, "").length === 11 &&
      dados.celular.replace(/\D/g, "").length >= 10 &&
      dados.municipio.trim().length > 1;
    return (
      <div className="rise pt-2">
        <Passos atual={1} total={total} />
        <h1 className="px-1 text-[22px] font-bold tracking-tight">Seus dados</h1>
        <p className="mt-1.5 px-1 text-[13.5px] text-muted">Protótipo: use dados fictícios.</p>
        <div className="mt-5 space-y-3.5">
          <input
            value={dados.nome}
            onChange={(e) => setDados({ ...dados, nome: e.target.value })}
            placeholder="Nome completo"
            className={entrada}
          />
          <input
            value={dados.cpf}
            onChange={(e) => setDados({ ...dados, cpf: mascaraCpf(e.target.value) })}
            placeholder="CPF (fictício)"
            inputMode="numeric"
            className={entrada}
          />
          <input
            value={dados.celular}
            onChange={(e) => setDados({ ...dados, celular: mascaraCelular(e.target.value) })}
            placeholder="Celular com DDD"
            inputMode="tel"
            className={entrada}
          />
          <input
            value={dados.municipio}
            onChange={(e) => setDados({ ...dados, municipio: e.target.value })}
            placeholder="Município/UF da fazenda (ex.: Sorriso/MT)"
            className={entrada}
          />
          <select
            value={dados.cultura}
            onChange={(e) => setDados({ ...dados, cultura: e.target.value })}
            className={entrada}
          >
            {CULTURAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <p className="mt-6 px-1 text-[14px] font-semibold">Quanto você vendeu em 2026, mais ou menos?</p>
        <p className="mt-0.5 px-1 text-[12.5px] text-muted">É o que define sua situação na reforma em 2027.</p>
        <div className="mt-3 space-y-2">
          {(Object.keys(FAIXAS) as Faixa[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setDados({ ...dados, faixa: f })}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[14.5px] font-medium ring-1 transition-colors ${
                dados.faixa === f ? "bg-brand-soft text-ink ring-brand" : "bg-surface ring-line"
              }`}
            >
              {FAIXAS[f].rotulo}
              {dados.faixa === f && (
                <span className="text-brand">
                  <Icone nome="check" tamanho={18} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Botao variante="suave" onClick={() => setPasso(0)}>
            Voltar
          </Botao>
          <Botao largura="cheia" disabled={!ok} onClick={() => setPasso(2)}>
            Continuar
          </Botao>
        </div>
      </div>
    );
  }

  /* ---------- cadastro: autorizações ---------- */
  return (
    <div className="rise pt-2">
      <Passos atual={2} total={total} />
      <h1 className="px-1 text-[22px] font-bold tracking-tight">O que o escritório pode ver</h1>
      <p className="mt-1.5 px-1 text-[13.5px] text-muted">Você liga e desliga quando quiser.</p>

      <Tile className="mt-5 overflow-hidden">
        <Interruptor
          ligado={dados.sefaz}
          alternar={() => setDados({ ...dados, sefaz: !dados.sefaz })}
          icone="nota"
          titulo="Notas fiscais na SEFAZ"
          sub="O escritório consulta as notas emitidas para você e por você, com o CNPJ dele autorizado."
        />
        <div className="h-px bg-line" />
        <Interruptor
          ligado={dados.openFinance}
          alternar={() => setDados({ ...dados, openFinance: !dados.openFinance })}
          icone="banco"
          titulo="Extratos pelo Open Finance"
          sub="Só leitura, por 12 meses. Fecha o livro caixa sem mandar arquivo do banco."
        />
      </Tile>

      {dados.openFinance && <Bancos dados={dados} setDados={setDados} />}

      <Aceite aceite={aceite} setAceite={setAceite} escritorio={escritorio} />

      <div className="mt-6 flex gap-2">
        <Botao variante="suave" onClick={() => setPasso(1)}>
          Voltar
        </Botao>
        <Botao
          largura="cheia"
          disabled={!aceite || (dados.openFinance && dados.bancos.length === 0)}
          onClick={concluir}
        >
          Concluir cadastro
        </Botao>
      </div>
    </div>
  );
}

function Bancos({ dados, setDados }: { dados: Cadastro; setDados: (d: Cadastro) => void }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {BANCOS.map((b) => {
        const marcado = dados.bancos.includes(b);
        return (
          <button
            key={b}
            type="button"
            onClick={() =>
              setDados({ ...dados, bancos: marcado ? dados.bancos.filter((x) => x !== b) : [...dados.bancos, b] })
            }
            className={`flex items-center gap-2 rounded-2xl px-3.5 py-3 text-left text-[14px] font-medium ring-1 transition-colors ${
              marcado ? "bg-brand-soft ring-brand" : "bg-surface ring-line"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                marcado ? "bg-brand text-brand-ink" : "bg-raised"
              }`}
            >
              {marcado && <Icone nome="check" tamanho={13} />}
            </span>
            {b}
          </button>
        );
      })}
    </div>
  );
}

function Aceite({
  aceite,
  setAceite,
  escritorio,
}: {
  aceite: boolean;
  setAceite: (v: boolean) => void;
  escritorio: string;
}) {
  return (
    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-raised px-4 py-3.5">
      <input
        type="checkbox"
        checked={aceite}
        onChange={(e) => setAceite(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]"
      />
      <span className="text-[12.5px] leading-relaxed text-muted">
        Autorizo o {escritorio} e a Coope a tratar esses dados para escrituração e planejamento tributário, conforme a
        LGPD. Posso revogar quando quiser.
      </span>
    </label>
  );
}
