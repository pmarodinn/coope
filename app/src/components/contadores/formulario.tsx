"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle, ShareNetwork, Warning, WhatsappLogo } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  errosDaEtapa,
  formatarCnpj,
  LEAD,
  LEAD_VAZIO,
  lerUtm,
  MAX_DORES,
  OPCOES,
  pacoteDoLead,
  UFS,
  UTM_VAZIO,
  type Erros,
  type Lead,
  type Opcao,
  type Utm,
} from "@/lib/contador-lead";
import {
  apagar,
  calcularModo,
  enviar,
  filtrarNome,
  formatarCelular,
  gravar,
  guardarTeste,
  ler,
  type Modo,
} from "@/lib/pesquisa-envio";

const ETAPAS = ["Você", "Escritório", "Carteira rural", "Rotina", "Reforma"];

const K_RASCUNHO = "coope:contadores:rascunho";
const K_UTM = "coope:contadores:utm";

/* ---------------- peças do formulário ---------------- */

const classeEntrada =
  "h-12 w-full rounded-xl border border-[--lp-linha] bg-[--lp-superficie] px-4 text-[15px] text-[--lp-tinta] outline-none transition-colors placeholder:text-[--lp-tinta-3] focus:border-[--lp-acento] focus:ring-2 focus:ring-[--lp-acento-suave] aria-[invalid=true]:border-[--lp-erro]";

function Campo({
  rotulo,
  erro,
  ajuda,
  opcional,
  children,
  id,
}: {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  opcional?: boolean;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-medium text-[--lp-tinta]">
        {rotulo}
        {opcional && <span className="font-normal text-[--lp-tinta-3]"> (opcional)</span>}
      </label>
      {children}
      {ajuda && !erro && <p className="text-[13px] text-[--lp-tinta-3]">{ajuda}</p>}
      {erro && (
        <p id={`${id}-erro`} className="text-[13px] font-medium text-[--lp-erro]">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Escolha única em botões: mais rápido que select no celular e mostra todas as opções. */
function Escolha({
  rotulo,
  opcoes,
  valor,
  mudar,
  erro,
  colunas = 2,
}: {
  rotulo: string;
  opcoes: readonly Opcao[];
  valor: string;
  mudar: (v: string) => void;
  erro?: string;
  colunas?: 1 | 2 | 3;
}) {
  const id = useId();
  const grade = colunas === 1 ? "grid-cols-1" : colunas === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={erro ? `${id}-erro` : undefined}>
      <legend className="mb-2 text-[14px] font-medium text-[--lp-tinta]">{rotulo}</legend>
      <div role="radiogroup" className={`grid gap-2 ${grade}`}>
        {opcoes.map((o) => {
          const marcado = valor === o.v;
          return (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={marcado}
              onClick={() => mudar(o.v)}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[14.5px] transition-colors active:scale-[0.99] ${
                marcado
                  ? "border-[--lp-acento] bg-[--lp-acento-suave] text-[--lp-tinta]"
                  : "border-[--lp-linha] bg-[--lp-superficie] text-[--lp-tinta] hover:border-[--lp-tinta-3]"
              }`}
            >
              <span>
                <span className="block font-medium">{o.rotulo}</span>
                {o.nota && <span className="mt-0.5 block text-[13px] text-[--lp-tinta-2]">{o.nota}</span>}
              </span>
              {marcado && <Check size={18} weight="bold" className="shrink-0 text-[--lp-acento]" />}
            </button>
          );
        })}
      </div>
      {erro && (
        <p id={`${id}-erro`} className="text-[13px] font-medium text-[--lp-erro]">
          {erro}
        </p>
      )}
    </fieldset>
  );
}

function Multipla({
  rotulo,
  ajuda,
  opcoes,
  valores,
  mudar,
  erro,
  maximo,
}: {
  rotulo: string;
  ajuda?: string;
  opcoes: readonly Opcao[];
  valores: string[];
  mudar: (v: string[]) => void;
  erro?: string;
  maximo?: number;
}) {
  const id = useId();
  const cheio = maximo !== undefined && valores.length >= maximo;
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={erro ? `${id}-erro` : undefined}>
      <legend className="mb-1 text-[14px] font-medium text-[--lp-tinta]">{rotulo}</legend>
      {ajuda && <p className="mb-1 text-[13px] text-[--lp-tinta-3]">{ajuda}</p>}
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => {
          const marcado = valores.includes(o.v);
          const travado = !marcado && cheio;
          return (
            <button
              key={o.v}
              type="button"
              role="checkbox"
              aria-checked={marcado}
              disabled={travado}
              onClick={() => mudar(marcado ? valores.filter((x) => x !== o.v) : [...valores, o.v])}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[14.5px] transition-colors disabled:opacity-40 ${
                marcado
                  ? "border-[--lp-acento] bg-[--lp-acento-suave] font-medium text-[--lp-tinta]"
                  : "border-[--lp-linha] bg-[--lp-superficie] text-[--lp-tinta] hover:border-[--lp-tinta-3]"
              }`}
            >
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${
                  marcado ? "border-[--lp-acento] bg-[--lp-acento] text-[--lp-acento-tinta]" : "border-[--lp-tinta-3]"
                }`}
              >
                {marcado && <Check size={12} weight="bold" />}
              </span>
              {o.rotulo}
            </button>
          );
        })}
      </div>
      {erro && (
        <p id={`${id}-erro`} className="text-[13px] font-medium text-[--lp-erro]">
          {erro}
        </p>
      )}
    </fieldset>
  );
}

function Botao({
  children,
  onClick,
  variante = "primario",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[15px] font-semibold transition-all active:translate-y-px disabled:opacity-50 ${
        variante === "primario"
          ? "bg-[--lp-acento] text-[--lp-acento-tinta] hover:bg-[--lp-acento-forte]"
          : "border border-[--lp-linha] bg-transparent text-[--lp-tinta] hover:border-[--lp-tinta-3]"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- formulário ---------------- */

type Estado = "preenchendo" | "enviando" | "enviado" | "falhou";

export function Formulario() {
  const [lead, setLead] = useState<Lead>(LEAD_VAZIO);
  const [etapa, setEtapa] = useState(0);
  const [erros, setErros] = useState<Erros>({});
  const [estado, setEstado] = useState<Estado>("preenchendo");
  const [modo, setModo] = useState<Modo>({ configurado: true, teste: false });
  const [utm, setUtm] = useState<Utm>(UTM_VAZIO);
  const topo = useRef<HTMLDivElement>(null);
  const ids = {
    nome: useId(),
    celular: useId(),
    email: useId(),
    escritorio: useId(),
    cnpj: useId(),
    crc: useId(),
    cidade: useId(),
    uf: useId(),
    software: useId(),
    softwareOutro: useId(),
    observacao: useId(),
  };

  // Rascunho e campanha: quem fecha o Instagram no meio volta de onde parou,
  // e o vídeo que trouxe a pessoa fica guardado mesmo se ela voltar sem o link.
  useEffect(() => {
    setModo(calcularModo());
    let salvo: Partial<Lead> = {};
    try {
      salvo = JSON.parse(ler(K_RASCUNHO) ?? "{}");
    } catch {
      /* recomeça */
    }
    const daUrl = lerUtm(window.location.search);
    let u = daUrl;
    if (!daUrl.utm_source) {
      try {
        u = { ...UTM_VAZIO, ...JSON.parse(ler(K_UTM) ?? "{}") };
      } catch {
        /* sem campanha */
      }
    } else gravar(K_UTM, JSON.stringify(daUrl));
    setUtm(u);
    const veioDoInsta = /insta|^ig$/i.test(u.utm_source);
    setLead({ ...LEAD_VAZIO, ...salvo, aceite: false, origem: salvo.origem || (veioDoInsta ? "instagram" : "") });
  }, []);

  useEffect(() => {
    if (estado === "preenchendo") gravar(K_RASCUNHO, JSON.stringify({ ...lead, aceite: false }));
  }, [lead, estado]);

  const muda = <K extends keyof Lead>(k: K, v: Lead[K]) => {
    setLead((l) => ({ ...l, [k]: v }));
    if (erros[k]) setErros((e) => ({ ...e, [k]: undefined }));
  };

  const irPara = (n: number) => {
    setEtapa(n);
    setErros({});
    requestAnimationFrame(() => topo.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const avancar = () => {
    const e = errosDaEtapa(lead, etapa);
    if (Object.keys(e).length) {
      setErros(e);
      return;
    }
    if (etapa < ETAPAS.length - 1) irPara(etapa + 1);
    else void mandar();
  };

  async function mandar() {
    setEstado("enviando");
    const pacote = pacoteDoLead(lead, utm);
    if (modo.teste || !modo.configurado) {
      guardarTeste(pacote);
      await new Promise((r) => setTimeout(r, 600));
      concluir();
      return;
    }
    const r = await enviar(pacote, LEAD.colecao);
    if (r === "ok") concluir();
    else setEstado("falhou");
  }

  function concluir() {
    apagar(K_RASCUNHO);
    setEstado("enviado");
    requestAnimationFrame(() => topo.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const invalido = (k: keyof Lead) => (erros[k] ? { "aria-invalid": true, "aria-describedby": `${ids[k as keyof typeof ids]}-erro` } : {});

  if (estado === "enviado") return <Enviado nome={lead.nome} celular={lead.celular} topo={topo} teste={modo.teste} />;

  return (
    <div ref={topo} className="scroll-mt-24 rounded-3xl border border-[--lp-linha] bg-[--lp-superficie] p-5 shadow-[--lp-sombra] sm:p-8">
      {modo.teste && (
        <p className="mb-5 rounded-xl bg-[--lp-elevado] px-4 py-2.5 text-[13px] text-[--lp-tinta-2]">
          Modo de teste: o envio fica só neste aparelho.
        </p>
      )}

      <div className="mb-7">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-semibold text-[--lp-tinta]">{ETAPAS[etapa]}</p>
          <p className="text-[13px] tabular-nums text-[--lp-tinta-3]">
            {etapa + 1} de {ETAPAS.length}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
          {ETAPAS.map((e, i) => (
            <span
              key={e}
              className={`h-1 rounded-full transition-colors duration-500 ${i <= etapa ? "bg-[--lp-acento]" : "bg-[--lp-linha]"}`}
            />
          ))}
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          avancar();
        }}
        className="flex flex-col gap-6"
      >
        {etapa === 0 && (
          <>
            <Campo id={ids.nome} rotulo="Seu nome" erro={erros.nome}>
              <input
                id={ids.nome}
                value={lead.nome}
                onChange={(e) => muda("nome", filtrarNome(e.target.value))}
                autoComplete="name"
                className={classeEntrada}
                {...invalido("nome")}
              />
            </Campo>
            <Escolha rotulo="Seu papel no escritório" opcoes={OPCOES.cargo} valor={lead.cargo} mudar={(v) => muda("cargo", v)} erro={erros.cargo} />
            <div className="grid gap-6 sm:grid-cols-2">
              <Campo id={ids.celular} rotulo="WhatsApp" erro={erros.celular}>
                <input
                  id={ids.celular}
                  value={lead.celular}
                  onChange={(e) => muda("celular", formatarCelular(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(65) 99999-0000"
                  className={classeEntrada}
                  {...invalido("celular")}
                />
              </Campo>
              <Campo id={ids.email} rotulo="E-mail" erro={erros.email}>
                <input
                  id={ids.email}
                  value={lead.email}
                  onChange={(e) => muda("email", e.target.value.trim())}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={classeEntrada}
                  {...invalido("email")}
                />
              </Campo>
            </div>
            <Escolha
              rotulo="Melhor horário para falar"
              opcoes={OPCOES.horario}
              valor={lead.horario}
              mudar={(v) => muda("horario", v)}
              colunas={3}
            />
          </>
        )}

        {etapa === 1 && (
          <>
            <Campo id={ids.escritorio} rotulo="Nome do escritório" erro={erros.escritorio}>
              <input
                id={ids.escritorio}
                value={lead.escritorio}
                onChange={(e) => muda("escritorio", e.target.value.slice(0, 100))}
                autoComplete="organization"
                className={classeEntrada}
                {...invalido("escritorio")}
              />
            </Campo>
            <div className="grid grid-cols-[1fr_96px] gap-4">
              <Campo id={ids.cidade} rotulo="Cidade" erro={erros.cidade}>
                <input
                  id={ids.cidade}
                  value={lead.cidade}
                  onChange={(e) => muda("cidade", e.target.value.slice(0, 60))}
                  autoComplete="address-level2"
                  className={classeEntrada}
                  {...invalido("cidade")}
                />
              </Campo>
              <Campo id={ids.uf} rotulo="UF" erro={erros.uf}>
                <select
                  id={ids.uf}
                  value={lead.uf}
                  onChange={(e) => muda("uf", e.target.value)}
                  className={`${classeEntrada} px-3`}
                  {...invalido("uf")}
                >
                  <option value="" />
                  {UFS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </Campo>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Campo id={ids.cnpj} rotulo="CNPJ do escritório" opcional erro={erros.cnpj}>
                <input
                  id={ids.cnpj}
                  value={lead.cnpj}
                  onChange={(e) => muda("cnpj", formatarCnpj(e.target.value))}
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  className={classeEntrada}
                  {...invalido("cnpj")}
                />
              </Campo>
              <Campo id={ids.crc} rotulo="CRC do responsável" opcional>
                <input
                  id={ids.crc}
                  value={lead.crc}
                  onChange={(e) => muda("crc", e.target.value.slice(0, 30))}
                  placeholder="MT-000000/O"
                  className={classeEntrada}
                />
              </Campo>
            </div>
            <Escolha rotulo="Quantas pessoas trabalham no escritório" opcoes={OPCOES.equipe} valor={lead.equipe} mudar={(v) => muda("equipe", v)} erro={erros.equipe} colunas={3} />
          </>
        )}

        {etapa === 2 && (
          <>
            <Escolha
              rotulo="Quantos produtores rurais o escritório atende"
              opcoes={OPCOES.produtores}
              valor={lead.produtores}
              mudar={(v) => muda("produtores", v)}
              erro={erros.produtores}
              colunas={3}
            />
            <Escolha
              rotulo="Quantos faturam mais de R$ 3,6 milhões por ano"
              opcoes={OPCOES.contribuintes}
              valor={lead.contribuintes}
              mudar={(v) => muda("contribuintes", v)}
              erro={erros.contribuintes}
              colunas={3}
            />
            <Multipla
              rotulo="O que esses produtores fazem"
              ajuda="Marque todas que aparecem na carteira."
              opcoes={OPCOES.atividades}
              valores={lead.atividades}
              mudar={(v) => muda("atividades", v)}
              erro={erros.atividades}
            />
            <Escolha rotulo="O escritório faz o LCDPR dos clientes?" opcoes={OPCOES.lcdpr} valor={lead.lcdpr} mudar={(v) => muda("lcdpr", v)} erro={erros.lcdpr} colunas={3} />
          </>
        )}

        {etapa === 3 && (
          <>
            <Campo id={ids.software} rotulo="Sistema contábil principal" erro={erros.software}>
              <select
                id={ids.software}
                value={lead.software}
                onChange={(e) => muda("software", e.target.value)}
                className={classeEntrada}
                {...invalido("software")}
              >
                <option value="">Escolha</option>
                {OPCOES.software.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            {lead.software === "outro" && (
              <Campo id={ids.softwareOutro} rotulo="Qual sistema?" erro={erros.softwareOutro}>
                <input
                  id={ids.softwareOutro}
                  value={lead.softwareOutro}
                  onChange={(e) => muda("softwareOutro", e.target.value.slice(0, 60))}
                  className={classeEntrada}
                  {...invalido("softwareOutro")}
                />
              </Campo>
            )}
            <Escolha rotulo="Como as notas dos produtores chegam hoje" opcoes={OPCOES.notas} valor={lead.notas} mudar={(v) => muda("notas", v)} erro={erros.notas} colunas={1} />
            <Escolha rotulo="E os extratos bancários" opcoes={OPCOES.extratos} valor={lead.extratos} mudar={(v) => muda("extratos", v)} erro={erros.extratos} />
          </>
        )}

        {etapa === 4 && (
          <>
            <Escolha rotulo="Como o escritório está para 2027" opcoes={OPCOES.preparo} valor={lead.preparo} mudar={(v) => muda("preparo", v)} erro={erros.preparo} />
            <Multipla
              rotulo="O que mais preocupa"
              ajuda={`Até ${MAX_DORES}.`}
              opcoes={OPCOES.dores}
              valores={lead.dores}
              mudar={(v) => muda("dores", v)}
              erro={erros.dores}
              maximo={MAX_DORES}
            />
            <Escolha rotulo="O que você quer da Coope" opcoes={OPCOES.interesse} valor={lead.interesse} mudar={(v) => muda("interesse", v)} erro={erros.interesse} />
            <Escolha rotulo="Quando pretende decidir" opcoes={OPCOES.prazo} valor={lead.prazo} mudar={(v) => muda("prazo", v)} erro={erros.prazo} />
            <Escolha rotulo="Como conheceu a Coope" opcoes={OPCOES.origem} valor={lead.origem} mudar={(v) => muda("origem", v)} erro={erros.origem} colunas={3} />
            <Campo id={ids.observacao} rotulo="Quer contar algo da sua carteira?" opcional ajuda={`${lead.observacao.length}/500`}>
              <textarea
                id={ids.observacao}
                value={lead.observacao}
                onChange={(e) => muda("observacao", e.target.value.slice(0, 500))}
                rows={3}
                className={`${classeEntrada} h-auto resize-none py-3 leading-relaxed`}
              />
            </Campo>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[--lp-elevado] px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={lead.aceite}
                  onChange={(e) => muda("aceite", e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--lp-acento)]"
                />
                <span className="text-[13.5px] leading-relaxed text-[--lp-tinta-2]">
                  Autorizo a Coope a usar estes dados para falar comigo sobre o produto, por WhatsApp, telefone ou e-mail,
                  conforme a LGPD.
                </span>
              </label>
              {erros.aceite && <p className="text-[13px] font-medium text-[--lp-erro]">{erros.aceite}</p>}
            </div>
          </>
        )}

        {estado === "falhou" && (
          <p role="alert" className="flex items-start gap-2.5 rounded-xl bg-[--lp-elevado] px-4 py-3 text-[14px] text-[--lp-tinta]">
            <Warning size={18} className="mt-0.5 shrink-0 text-[--lp-erro]" />
            Não conseguimos enviar. Confira a internet e tente de novo; suas respostas continuam aqui.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[--lp-linha] pt-6">
          {etapa > 0 ? (
            <Botao variante="secundario" onClick={() => irPara(etapa - 1)}>
              <ArrowLeft size={16} weight="bold" /> Voltar
            </Botao>
          ) : (
            <span className="text-[13px] text-[--lp-tinta-3]">Uns 4 minutos</span>
          )}
          <Botao type="submit" disabled={estado === "enviando"}>
            {etapa < ETAPAS.length - 1 ? (
              <>
                Continuar <ArrowRight size={16} weight="bold" />
              </>
            ) : estado === "enviando" ? (
              "Enviando"
            ) : (
              "Enviar pré-cadastro"
            )}
          </Botao>
        </div>
      </form>
    </div>
  );
}

/* ---------------- depois do envio ---------------- */

function Enviado({
  nome,
  celular,
  topo,
  teste,
}: {
  nome: string;
  celular: string;
  topo: React.RefObject<HTMLDivElement | null>;
  teste: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const primeiro = nome.trim().split(" ")[0];
  const link = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`;
  const texto = `Conhece a Coope? Prepara a carteira rural do escritório para a reforma de 2027. Pré-cadastro: ${link}`;

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Coope para contadores", text: texto, url: link });
        return;
      } catch {
        /* cancelou: cai na cópia */
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem área de transferência */
    }
  };

  return (
    <div ref={topo} className="scroll-mt-24 rounded-3xl border border-[--lp-linha] bg-[--lp-superficie] p-6 shadow-[--lp-sombra] sm:p-10">
      <CheckCircle size={44} weight="fill" className="text-[--lp-acento]" />
      <h3 className="mt-5 text-[26px] font-semibold leading-tight tracking-tight">Recebemos, {primeiro}.</h3>
      <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-[--lp-tinta-2]">
        Vamos chamar você no WhatsApp {celular} para marcar a conversa. Se preferir outro canal, é só responder a
        primeira mensagem.
      </p>
      {teste && <p className="mt-3 text-[13px] text-[--lp-tinta-3]">Modo de teste: nada foi enviado.</p>}

      <div className="mt-8 rounded-2xl bg-[--lp-elevado] p-5">
        <p className="text-[15px] font-semibold">Conhece outro escritório que atende produtor rural?</p>
        <p className="mt-1 text-[14px] text-[--lp-tinta-2]">Mande o link. A reforma chega para todos em janeiro.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Botao onClick={compartilhar}>
            {copiado ? (
              <>
                <Check size={16} weight="bold" /> Link copiado
              </>
            ) : (
              <>
                <ShareNetwork size={16} weight="bold" /> Enviar o link
              </>
            )}
          </Botao>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[--lp-linha] px-6 text-[15px] font-semibold text-[--lp-tinta] hover:border-[--lp-tinta-3]"
          >
            <WhatsappLogo size={18} weight="bold" /> Pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
