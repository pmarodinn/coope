"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Broadcast,
  Buildings,
  CurrencyCircleDollar,
  FileText,
  Lightning,
  Lock,
  Plant,
  Receipt,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { asset } from "@/lib/asset";
import { Fluxo } from "@/components/site/fluxo";
import { GrassField } from "@/components/site/grass-field";
import { Marquise, TextoScroll } from "@/components/site/texto-scroll";
import {
  BarraProgresso,
  CartaoVivo,
  Contador,
  Magnetico,
  MOLA_SUAVE,
  Reveal,
  RevealText,
} from "@/components/site/motion-bits";

/* ================================================================
   Dados. Tudo aqui sai do White Paper e do Relatório Técnico v2.
   ================================================================ */

const SINAIS = [
  { valor: 25.13, sufixo: "%", casas: 2, legenda: "do PIB brasileiro veio do agro em 2025", fonte: "Cepea/Esalq-USP e CNA" },
  { valor: 8.8, sufixo: "%", casas: 1, legenda: "de inadimplência rural, recorde da série", fonte: "Serasa Experian, 1T2026" },
  { valor: 1990, sufixo: "", casas: 0, legenda: "recuperações judiciais no agro em um ano", fonte: "Monitoramento 2025" },
];

const LACUNAS = [
  {
    id: "fiscal",
    icone: FileText,
    titulo: "Fiscal",
    frase: "A conformidade chega tarde demais.",
    corpo:
      "O Livro Caixa Digital é obrigatório acima de R$ 4,8 milhões de receita, mas a escrituração é terceirizada e retroativa. Quando o número aparece, o exercício já fechou — e a janela de planejamento passou.",
    numero: "20%",
    numeroLegenda: "Arbitramento sobre a receita bruta quando a escrituração é considerada inidônea.",
  },
  {
    id: "credito",
    icone: CurrencyCircleDollar,
    titulo: "Crédito",
    frase: "O capital já é privado. A originação não acompanhou.",
    corpo:
      "Dos R$ 516,2 bilhões do Plano Safra empresarial, apenas R$ 113,8 bilhões tinham equalização do Tesouro. O mercado de capitais do agro move R$ 534 bilhões — e o produtor chega nele sem dado estruturado.",
    numero: "204%",
    numeroLegenda: "Crescimento dos Fiagros entre março de 2023 e março de 2025.",
  },
  {
    id: "protecao",
    icone: ShieldCheck,
    titulo: "Proteção",
    frase: "O risco climático fica inteiro dentro da porteira.",
    corpo:
      "O seguro rural subvencionado cobriu 3,3% da área cultivada em 2025, com execução 47,3% menor que em 2024. Para 2026, a projeção recua para 2,78%. O risco não sai da propriedade — e nem do balanço de quem a financia.",
    numero: "3,3%",
    numeroLegenda: "Da área plantada nacional teve seguro subvencionado em 2025.",
  },
];

const JANELA = [
  {
    icone: Broadcast,
    titulo: "Open Finance maduro",
    corpo:
      "154 milhões de consentimentos ativos em fevereiro de 2026, o maior ecossistema do mundo. APIs FAPI padronizadas, com portabilidade de crédito 100% digital.",
    destaque: "154 mi",
    destaqueLegenda: "consentimentos ativos",
  },
  {
    icone: Receipt,
    titulo: "Nota fiscal na origem",
    corpo:
      "O web service NFeDistribuicaoDFe entrega ao titular todo documento emitido contra o CPF dele. A base de custeio da fazenda já existe estruturada — do lado do Fisco, antes de qualquer digitação.",
    destaque: "90 dias",
    destaqueLegenda: "de janela de distribuição",
  },
  {
    icone: Lock,
    titulo: "BaaS com marco próprio",
    corpo:
      "A Resolução Conjunta nº 16, de novembro de 2025, é o primeiro marco de Banking as a Service do país. Exige conta de titularidade do cliente final e veda contas-bolsão.",
    destaque: "31/12/2026",
    destaqueLegenda: "prazo de adequação dos contratos",
  },
];

const CAMADAS = [
  {
    n: "01",
    nome: "Ingestão",
    corpo: "Nota fiscal eletrônica pela SEFAZ e extratos multi-instituição sob consentimento.",
    fonte: "SEFAZ · Open Finance",
  },
  {
    n: "02",
    nome: "Motor fiscal",
    corpo: "Conciliação extrato ↔ nota, classificação automática e apuração em tempo real.",
    fonte: "LCDPR contínuo",
  },
  {
    n: "03",
    nome: "Dossiê de crédito",
    corpo: "Capacidade de pagamento verificável, derivada do histórico fiscal e transacional.",
    fonte: "Lastro auditável",
  },
  {
    n: "04",
    nome: "Liquidação",
    corpo: "Conta de titularidade do produtor em instituição autorizada, com Pix e trava de finalidade.",
    fonte: "Res. Conjunta 16/2025",
  },
  {
    n: "05",
    nome: "Conformidade",
    corpo: "KYC, PLD/FT calibrado à sazonalidade da safra, trilha imutável e guarda de 10 anos.",
    fonte: "Circular BCB 3.978/2020",
  },
];

const TELAS = [
  { src: "/shots/inicio.png", titulo: "Saldo e projeção", corpo: "O produtor abre no saldo, não em relatório." },
  { src: "/shots/imposto.png", titulo: "Imposto em tempo real", corpo: "R$ 666 mil de diferença entre organizar e não organizar." },
  { src: "/shots/credito.png", titulo: "Ofertas comparadas", corpo: "Custo total, não a taxa da propaganda." },
  { src: "/shots/conversa.png", titulo: "Agente no WhatsApp", corpo: "Recomenda o que pode e explica o que não pode indicar." },
  { src: "/shots/cooperativa.png", titulo: "Visão da cooperativa", corpo: "Sell-out sem carregar risco de crédito." },
];

const RECEITA = [
  { nome: "Take rate", detalhe: "1% a 3% sobre o crédito originado", peso: 47, ativo: true },
  { nome: "Success fee", detalhe: "Percentual sobre a economia tributária comprovada", peso: 46, ativo: true },
  { nome: "Rebate", detalhe: "Corretagem repassada por parceiro registrado", peso: 7, ativo: true },
  { nome: "Float", detalhe: "Zerado por desenho — com conta do produtor, o rendimento é dele", peso: 0, ativo: false },
];

const FOSSOS = [
  {
    icone: Plant,
    titulo: "Dado fiscal proprietário",
    corpo: "Exige certificado digital de cada produtor e meses de histórico. Não há atalho comprável.",
  },
  {
    icone: Buildings,
    titulo: "Posição de gatekeeper",
    corpo: "Quem controla a originação decide qual financiador vê qual operação primeiro.",
  },
  {
    icone: Lightning,
    titulo: "Canal com trava mútua",
    corpo: "A cooperativa traz o produtor; o produtor mantém a cooperativa no fluxo.",
  },
  {
    icone: ShieldCheck,
    titulo: "Conformidade desde a origem",
    corpo: "Quem desenhou conta-bolsão terá que refazer a arquitetura até dezembro de 2026.",
  },
];

const LIMITES = [
  "Nada aqui substitui validação de mercado. O protótipo demonstra a tese, não a comprova.",
  "O gargalo do cronograma não é engenharia: é credenciamento em BaaS e financiadores, de 60 a 120 dias por parceiro.",
  "A dependência de certificado digital do produtor é fricção real de aquisição, sem contorno técnico.",
  "Com contas individualizadas, a receita de float deixa de existir. O modelo precisa fechar sem ela.",
];

/* ================================================================ */

function Secao({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative px-6 md:px-10 ${className}`}>
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}

/* ---------------- dobra ---------------- */

function Dobra() {
  const ref = useRef<HTMLDivElement>(null);
  const reduz = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div ref={ref} className="relative min-h-[100dvh] overflow-hidden">
      <GrassField className="absolute inset-x-0 bottom-0 top-0 h-full w-full" />

      {/* Duas máscaras: o topo abre espaço para o menu, a base para a
          manchete. Entre as duas fica a faixa em que a crista aparece. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,16,11,0.92)_0%,rgba(5,16,11,0.55)_12%,transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#05100b_0%,rgba(5,16,11,0.94)_30%,rgba(5,16,11,0.72)_46%,rgba(5,16,11,0.3)_58%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_95%_at_50%_52%,transparent_45%,rgba(5,16,11,0.5)_100%)]" />

      <motion.div
        style={reduz ? undefined : { y, opacity: fade }}
        className="relative flex min-h-[100dvh] flex-col justify-between px-6 pb-14 pt-8 md:px-10 md:pb-16"
      >
        <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/coope-mark.png")} alt="" className="h-7 w-7 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">Coope</span>
          </div>
          <nav className="hidden items-center gap-8 text-[13.5px] text-[--tinta-2] md:flex">
            <a href="#tese" className="transition-colors hover:text-[--tinta]">Tese</a>
            <a href="#arquitetura" className="transition-colors hover:text-[--tinta]">Arquitetura</a>
            <a href="#produto" className="transition-colors hover:text-[--tinta]">Produto</a>
            <a href="#negocio" className="transition-colors hover:text-[--tinta]">Negócio</a>
          </nav>
          <a
            href="/"
            className="rounded-full border border-[--linha] px-4 py-2 text-[13px] font-medium transition-colors hover:border-[--acento] hover:text-[--acento]"
          >
            Abrir o app
          </a>
        </header>

        <div className="mx-auto w-full max-w-[1180px]">
          <p className="rotulo mb-6">Do agro, para o agro</p>

          <h1 className="display max-w-[16ch]">
            <RevealText texto="O sistema nervoso" />
            <br />
            <RevealText texto="financeiro do campo." delay={0.18} />
          </h1>

          <motion.p
            initial={reduz ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MOLA_SUAVE, delay: 0.55 }}
            className="mt-7 max-w-[54ch] text-[16.5px] leading-relaxed text-[--tinta-2] md:text-[18px]"
          >
            Conformidade fiscal invisível e crédito em horas, sem que o produtor precise entender de
            banco ou mercado de capitais.
          </motion.p>

          <motion.div
            initial={reduz ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MOLA_SUAVE, delay: 0.68 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <a href="#produto">
              <Magnetico className="group inline-flex items-center gap-2 rounded-full bg-[--acento] px-6 py-3.5 text-[15px] font-semibold text-[#04130b]">
                Ver o produto
                <ArrowRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </Magnetico>
            </a>
            <a
              href="#tese"
              className="rounded-full border border-[--linha] px-6 py-3.5 text-[15px] font-medium text-[--tinta] transition-colors hover:border-[--acento] hover:text-[--acento]"
            >
              Ler a tese
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- sinais ---------------- */

function Sinais() {
  return (
    <Secao id="sinais" className="py-28 md:py-36">
      <div className="grid gap-12 md:grid-cols-3 md:gap-8">
        {SINAIS.map((s, i) => (
          <Reveal key={s.legenda} delay={i * 0.09}>
            <div className="border-t border-[--linha] pt-6">
              <p className="numero text-[--tinta]">
                <Contador valor={s.valor} sufixo={s.sufixo} casas={s.casas} />
              </p>
              <p className="mt-4 max-w-[26ch] text-[15px] leading-snug text-[--tinta-2]">
                {s.legenda}
              </p>
              <p className="mono mt-3 text-[11px] text-[--tinta-3]">{s.fonte}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <TextoScroll
        texto="Produtividade recorde e inadimplência recorde, ao mesmo tempo. A deterioração não é só ciclo de preço e juros — é falha de infraestrutura informacional."
        destacar={["falha", "infraestrutura", "informacional"]}
        className="mt-24 max-w-[30ch] text-[26px] font-medium leading-[1.25] tracking-[-0.025em] md:max-w-[26ch] md:text-[40px]"
      />
    </Secao>
  );
}

/* ---------------- lacunas ---------------- */

function Lacunas() {
  return (
    <Secao id="tese" className="py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="rotulo mb-5">Diagnóstico</p>
          <h2 className="display-2">Três lacunas que se reforçam.</h2>
          <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-[--tinta-2]">
            Nenhuma delas é nova. O que mudou é que a infraestrutura para resolvê-las amadureceu
            entre 2024 e 2026.
          </p>
        </div>

        <div className="space-y-5">
          {LACUNAS.map((l, i) => {
            const Icone = l.icone;
            return (
              <Reveal key={l.id} delay={i * 0.07}>
                <CartaoVivo className="group rounded-2xl border border-[--linha] bg-[--fundo-2] p-7 md:p-9">
                  <div className="relative">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[--acento-fundo] text-[--acento]">
                          <Icone size={18} weight="duotone" />
                        </span>
                        <span className="mono text-[11px] uppercase tracking-[0.18em] text-[--tinta-3]">
                          {l.titulo}
                        </span>
                      </div>
                      <span className="mono shrink-0 text-[26px] font-semibold tracking-tight text-[--acento] md:text-[32px]">
                        {l.numero}
                      </span>
                    </div>

                    <p className="mt-6 text-[20px] font-medium leading-tight tracking-tight md:text-[24px]">
                      {l.frase}
                    </p>
                    <p className="mt-4 max-w-[58ch] text-[14.5px] leading-relaxed text-[--tinta-2]">
                      {l.corpo}
                    </p>
                    <p className="mt-5 max-w-[46ch] border-t border-[--linha] pt-4 text-[12.5px] leading-relaxed text-[--tinta-3]">
                      {l.numeroLegenda}
                    </p>
                  </div>
                </CartaoVivo>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Secao>
  );
}

/* ---------------- janela ---------------- */

function Janela() {
  return (
    <Secao id="janela" className="py-24 md:py-32">
      <Reveal>
        <h2 className="display-2 max-w-[20ch]">A infraestrutura necessária já existe.</h2>
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {JANELA.map((j, i) => {
          const Icone = j.icone;
          return (
            <Reveal key={j.titulo} delay={i * 0.08}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-[--linha] bg-[linear-gradient(160deg,var(--fundo-3),var(--fundo-2))] p-7">
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--acento-fundo] text-[--acento]">
                    <Icone size={20} weight="duotone" />
                  </span>
                  <p className="mt-5 text-[17px] font-semibold tracking-tight">{j.titulo}</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-[--tinta-2]">{j.corpo}</p>
                </div>
                <div className="mt-8 border-t border-[--linha] pt-4">
                  <p className="mono text-[22px] font-semibold tracking-tight text-[--acento]">
                    {j.destaque}
                  </p>
                  <p className="mono mt-1 text-[10.5px] uppercase tracking-[0.16em] text-[--tinta-3]">
                    {j.destaqueLegenda}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-16 rounded-2xl border border-[--acento]/25 bg-[--acento-fundo] p-8 md:p-12">
          <p className="rotulo mb-5 text-[--acento]">A tese</p>
          <p className="max-w-[46ch] text-[22px] font-medium leading-snug tracking-tight md:text-[30px]">
            A oportunidade não é construir mais um banco nem mais um ERP agrícola. É construir a
            camada de orquestração que falta entre os três.
          </p>
        </div>
      </Reveal>
    </Secao>
  );
}

/* ---------------- fluxo do dinheiro ---------------- */

function OndeEntra() {
  return (
    <Secao id="fluxo" className="py-24 md:py-32">
      <div className="max-w-[46ch]">
        <h2 className="display-2">O dinheiro nunca passa por aqui.</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-[--tinta-2]">
          A conta é do produtor, numa instituição autorizada. A Coope inicia pagamento sob
          consentimento e devolve trilha ao financiador — mas não custodia, não mistura e não
          movimenta recurso em nome próprio.
        </p>
      </div>

      <div className="mt-14 rounded-2xl border border-[--linha] bg-[--fundo-2] p-6 md:p-10">
        <Fluxo />
      </div>

      <Reveal delay={0.15}>
        <p className="mono mt-6 text-[11.5px] leading-relaxed text-[--tinta-3]">
          Res. Conjunta BCB/CMN nº 16/2025 — titularidade individualizada obrigatória, contas-bolsão
          vedadas
        </p>
      </Reveal>
    </Secao>
  );
}

/* ---------------- arquitetura ---------------- */

function Camada({
  camada,
  indice,
  total,
  progresso,
}: {
  camada: (typeof CAMADAS)[number];
  indice: number;
  total: number;
  progresso: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const reduz = useReducedMotion();
  const passo = 1 / total;
  const inicio = indice * passo;
  const fim = inicio + passo * 0.85;

  const y = useTransform(progresso, [inicio, fim], [90, 0]);
  const opacidade = useTransform(progresso, [inicio, inicio + passo * 0.35], [0, 1]);
  const escala = useTransform(progresso, [inicio, fim], [0.95, 1]);

  return (
    <motion.div
      style={reduz ? undefined : { y, opacity: opacidade, scale: escala }}
      className="rounded-2xl border border-[--linha] bg-[--fundo-2] p-5 md:p-6"
    >
      <div className="flex items-baseline gap-4">
        <span className="mono text-[12px] text-[--acento]">{camada.n}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[16px] font-semibold tracking-tight">{camada.nome}</p>
            <p className="mono text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">
              {camada.fonte}
            </p>
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[--tinta-2]">{camada.corpo}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Arquitetura() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const suave = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });

  return (
    <section id="arquitetura" ref={ref} className="relative h-[420vh]">
      <div className="sticky top-0 flex min-h-[100dvh] items-center px-6 py-20 md:px-10">
        <div className="mx-auto grid w-full max-w-[1180px] gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:pt-6">
            <h2 className="display-2 max-w-[14ch]">Cinco camadas, uma ordem.</h2>
            <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-[--tinta-2]">
              O módulo fiscal precede o de crédito porque é ele que produz o insumo do segundo. A
              sequência não é arbitrária.
            </p>
            <div className="mt-8 hidden h-1 w-full max-w-[14rem] overflow-hidden rounded-full bg-[--linha] lg:block">
              <motion.div
                style={{ scaleX: suave }}
                className="h-full origin-left rounded-full bg-[--acento]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {CAMADAS.map((c, i) => (
              <Camada
                key={c.n}
                camada={c}
                indice={i}
                total={CAMADAS.length}
                progresso={suave}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- produto ---------------- */

function Produto() {
  const ref = useRef<HTMLDivElement>(null);
  const reduz = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-62%"]);
  const suave = useSpring(x, { stiffness: 80, damping: 26, restDelta: 0.001 });

  return (
    <section id="produto" ref={ref} className="relative h-[330vh]">
      <div className="sticky top-0 flex min-h-[100dvh] flex-col justify-center overflow-hidden py-20">
        <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
          <p className="rotulo mb-5">Protótipo funcional</p>
          <h2 className="display-2 max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.7rem)]">
            Não é mockup. É o produto rodando, com API e trilha de auditoria.
          </h2>
        </div>

        <motion.div
          style={reduz ? undefined : { x: suave }}
          className="mt-10 flex gap-5 px-6 md:px-10"
        >
          {TELAS.map((t) => (
            <figure key={t.src} className="w-[200px] shrink-0 md:w-[232px]">
              <div className="overflow-hidden rounded-[26px] border border-[--linha] bg-[--fundo-2] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset(t.src)}
                  alt={t.titulo}
                  loading="lazy"
                  className="block h-auto w-full"
                />
              </div>
              <figcaption className="mt-5">
                <p className="text-[15px] font-semibold tracking-tight">{t.titulo}</p>
                <p className="mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-[--tinta-2]">
                  {t.corpo}
                </p>
              </figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- negócio ---------------- */

function Negocio() {
  return (
    <Secao id="negocio" className="py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="display-2 max-w-[16ch]">Como a plataforma ganha dinheiro.</h2>
          <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-[--tinta-2]">
            A Coope não empresta, não custodia e não corre risco de balanço. A receita vem de
            originar, de comprovar economia e de corretagem repassada por parceiro registrado.
          </p>

          <div className="mt-10 space-y-5">
            {RECEITA.map((r, i) => (
              <Reveal key={r.nome} delay={i * 0.06}>
                <div className={r.ativo ? "" : "opacity-55"}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[15.5px] font-semibold tracking-tight">{r.nome}</p>
                    <p className="mono text-[13px] text-[--tinta-2]">
                      {r.ativo ? `${r.peso}%` : "zerado"}
                    </p>
                  </div>
                  <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[--linha]">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: r.peso / 100 }}
                      viewport={{ once: true, margin: "-15%" }}
                      transition={{ ...MOLA_SUAVE, delay: 0.1 + i * 0.06 }}
                      className="h-full origin-left rounded-full bg-[--acento]"
                    />
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-[--tinta-2]">{r.detalhe}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="lg:pt-4">
          <Reveal>
            <div className="rounded-2xl border border-[--linha] bg-[--fundo-2] p-8">
              <p className="rotulo mb-6">Piloto simulado · 3 cooperativas</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-9">
                {[
                  { v: 184, s: "", c: 0, l: "produtores ativos" },
                  { v: 22.5, s: " mi", c: 1, l: "crédito originado / mês", p: "R$ " },
                  { v: 11, s: " h", c: 0, l: "time-to-money médio" },
                  { v: 11.4, s: " mi", c: 1, l: "receita anualizada", p: "R$ " },
                ].map((m) => (
                  <div key={m.l}>
                    <p className="mono text-[30px] font-semibold tracking-tight text-[--tinta] md:text-[36px]">
                      <Contador valor={m.v} prefixo={m.p ?? ""} sufixo={m.s} casas={m.c} />
                    </p>
                    <p className="mt-2 text-[12.5px] leading-snug text-[--tinta-2]">{m.l}</p>
                  </div>
                ))}
              </div>
              <p className="mt-9 border-t border-[--linha] pt-5 text-[12px] leading-relaxed text-[--tinta-3]">
                Ordem de grandeza de um piloto simulado, calibrada pela média da carteira. Não é
                resultado auditado nem projeção financeira.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </Secao>
  );
}

/* ---------------- fossos ---------------- */

function Fossos() {
  return (
    <Secao id="fossos" className="py-24 md:py-32">
      <Reveal>
        <h2 className="display-2 max-w-[18ch]">Por que fica difícil copiar depois.</h2>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[--linha] bg-[--linha] md:grid-cols-2">
        {FOSSOS.map((f, i) => {
          const Icone = f.icone;
          return (
            <Reveal key={f.titulo} delay={i * 0.06}>
              <div className="h-full bg-[--fundo] p-8 transition-colors duration-500 hover:bg-[--fundo-2]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--acento-fundo] text-[--acento]">
                  <Icone size={20} weight="duotone" />
                </span>
                <p className="mt-5 text-[17px] font-semibold tracking-tight">{f.titulo}</p>
                <p className="mt-3 max-w-[44ch] text-[14px] leading-relaxed text-[--tinta-2]">
                  {f.corpo}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Secao>
  );
}

/* ---------------- normas ---------------- */

const NORMAS = [
  "Res. Conjunta BCB/CMN nº 16/2025",
  "Res. CMN nº 4.935/2021",
  "Res. CVM nº 214/2024",
  "Res. CVM nº 19/2021",
  "Circular BCB nº 3.978/2020",
  "IN RFB nº 1.848/2018",
  "Res. BCB nº 518/2025",
  "Res. CNSP/SUSEP nº 55/2025",
  "Lei nº 14.130/2021",
  "LGPD nº 13.709/2018",
];

function Normas() {
  return (
    <section className="border-y border-[--linha] py-7">
      <Marquise itens={NORMAS} />
    </section>
  );
}

/* ---------------- limites ---------------- */

function Limites() {
  return (
    <Secao id="limites" className="py-24 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-20">
        <div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[--linha] text-[--tinta-2]">
            <Warning size={19} weight="duotone" />
          </span>
          <h2 className="display-2 mt-6 max-w-[12ch]">O que ainda não está resolvido.</h2>
        </div>

        <ul className="space-y-0">
          {LIMITES.map((l, i) => (
            <Reveal key={l} delay={i * 0.06}>
              <li className="border-t border-[--linha] py-6 text-[15.5px] leading-relaxed text-[--tinta-2] first:border-t-0 first:pt-0">
                {l}
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </Secao>
  );
}

/* ---------------- fecho ---------------- */

function Fecho() {
  return (
    <Secao id="fecho" className="pb-20 pt-24 md:pb-24 md:pt-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] border border-[--linha] bg-[linear-gradient(150deg,var(--fundo-3),var(--fundo-2)_60%)] px-8 py-16 text-center md:px-16 md:py-24">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[--acento] opacity-[0.07] blur-3xl" />
          <div className="relative">
            <h2 className="display-2 mx-auto max-w-[18ch]">
              O protótipo está de pé. Falta o capital para credenciar.
            </h2>
            <p className="mx-auto mt-6 max-w-[48ch] text-[15.5px] leading-relaxed text-[--tinta-2]">
              Nove a quatorze meses até o MVP operacional, com R$ 800 mil a R$ 1,5 milhão de
              engenharia e 20% a 35% da queima em conformidade.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href="/">
                <Magnetico className="group inline-flex items-center gap-2 rounded-full bg-[--acento] px-7 py-4 text-[15px] font-semibold text-[#04130b]">
                  Abrir o protótipo
                  <ArrowUpRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Magnetico>
              </a>
              <a
                href="#tese"
                className="rounded-full border border-[--linha] px-7 py-4 text-[15px] font-medium transition-colors hover:border-[--acento] hover:text-[--acento]"
              >
                Rever a tese
              </a>
            </div>
          </div>
        </div>
      </Reveal>

      <footer className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-[--linha] pt-8 text-[12.5px] text-[--tinta-3] md:flex-row">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/coope-mark.png")} alt="" className="h-5 w-5 rounded-md opacity-70" />
          <span>Coope · Do agro, para o agro</span>
        </div>
        <p className="max-w-[52ch] text-center leading-relaxed md:text-right">
          Documento de fundamentação. Dados de exemplo, sem integração real ativa. Não constitui
          oferta de valores mobiliários.
        </p>
      </footer>
    </Secao>
  );
}

/* ================================================================ */

export default function SiteInvestidores() {
  const { scrollYProgress } = useScroll();

  return (
    <main className="grao relative">
      <BarraProgresso progresso={scrollYProgress} />
      <Dobra />
      <Sinais />
      <Lacunas />
      <Janela />
      <OndeEntra />
      <Arquitetura />
      <Produto />
      <Negocio />
      <Fossos />
      <Normas />
      <Limites />
      <Fecho />
    </main>
  );
}
