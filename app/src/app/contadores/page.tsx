import { ArrowRight, ArrowUpRight, Bank, CaretDown, HandCoins, Receipt, Scales, Tractor } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Contagem } from "@/components/contadores/contagem";
import { Formulario } from "@/components/contadores/formulario";
import { Revelar } from "@/components/contadores/revelar";
import { asset } from "@/lib/asset";

const CTA = "Fazer pré-cadastro";

function BotaoCadastro({ grande = false }: { grande?: boolean }) {
  return (
    <a
      href="#cadastro"
      className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[--lp-acento] font-semibold text-[--lp-acento-tinta] transition-all hover:bg-[--lp-acento-forte] active:translate-y-px ${
        grande ? "h-[52px] px-7 text-[16px]" : "h-10 px-5 text-[14px]"
      }`}
    >
      {CTA}
      {grande && <ArrowRight size={18} weight="bold" />}
    </a>
  );
}

const MUDANCAS = [
  {
    data: "Desde 01/08/2026",
    titulo: "Nota sem IBS e CBS já é autuável",
    texto: "Venda emitida sem o grupo novo pode ser rejeitada e autuada.",
  },
  {
    data: "31/12/2026",
    titulo: "A receita de 2026 decide 2027",
    texto: "Acima de R$ 3,6 milhões no ano, o produtor vira contribuinte.",
  },
  {
    data: "01/01/2027",
    titulo: "CNPJ para o produtor pessoa física",
    texto: "Sem ele, a primeira nota de janeiro não sai.",
  },
  {
    data: "Todo mês",
    titulo: "Doze apurações em vez de uma",
    texto: "Quem é contribuinte passa a apurar IBS e CBS mês a mês.",
  },
];

const PASSOS = [
  { quando: "Dia 0", titulo: "Conversa de 40 minutos", texto: "Sua carteira, as horas por cliente e o plano para janeiro." },
  { quando: "Dia 1", titulo: "Acesso às notas", texto: "Termo de dados e o CNPJ do escritório autorizado, ou o certificado." },
  { quando: "Dias 1 a 5", titulo: "Diagnóstico 2027", texto: "As notas de cada produtor cruzadas com as regras da reforma." },
  { quando: "Dia 6", titulo: "Devolução", texto: "O que vence primeiro e quanto vale, cliente por cliente." },
  { quando: "Dias 7 a 30", titulo: "Piloto com cinco clientes", texto: "Você usa no dia a dia antes de decidir pela carteira inteira." },
];

const PERGUNTAS = [
  {
    p: "Quanto custa?",
    r: "O diagnóstico da carteira não tem custo. Os planos são cobrados por produtor atendido, com valor diferente para quem é contribuinte e quem não é. Mostramos na conversa, com os números da sua carteira.",
  },
  {
    p: "Preciso trocar meu sistema contábil?",
    r: "Não. A Coope trabalha ao lado do sistema que o escritório já usa e cuida do que é específico do produtor rural: reforma, livro caixa e LCDPR.",
  },
  {
    p: "O produtor precisa instalar alguma coisa?",
    r: "Não. As notas vêm da SEFAZ pelo acesso que o escritório já tem. O app é opcional, para o produtor autorizar o Open Finance pelo celular.",
  },
  {
    p: "A Coope vai atender meus clientes diretamente?",
    r: "Não. A Coope vende a ferramenta ao escritório. Escriturar, apurar e assinar continuam com o contador responsável.",
  },
  {
    p: "Como ficam os dados dos meus clientes?",
    r: "Só entram com termo de dados assinado pelo escritório, conforme a LGPD, e com autorização do produtor. A Coope lê; não movimenta conta nem emite nota.",
  },
  {
    p: "Isso já está funcionando?",
    r: "A Coope está formando o primeiro grupo de escritórios piloto. O pré-cadastro é a porta de entrada: conversamos com cada escritório, entendemos a carteira e combinamos o diagnóstico.",
  },
];

export default function Contadores() {
  return (
    <div className="lp min-h-[100dvh] antialiased">
      {/* Navegação */}
      <header className="sticky top-0 z-40 border-b border-[--lp-linha] bg-[--lp-fundo]">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/coope-mark.png")} alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-lg bg-[--lp-acento] p-1" />
            <span className="text-[17px] font-semibold tracking-tight">Coope</span>
          </Link>
          <nav className="flex items-center gap-7">
            <a href="#como-funciona" className="hidden text-[14px] text-[--lp-tinta-2] hover:text-[--lp-tinta] md:block">
              Como funciona
            </a>
            <a href="#perguntas" className="hidden text-[14px] text-[--lp-tinta-2] hover:text-[--lp-tinta] md:block">
              Perguntas
            </a>
            <BotaoCadastro />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:pb-24">
          <div className="rise">
            <p className="text-[14px] font-medium text-[--lp-acento]">Para escritórios de contabilidade rural</p>
            <h1 className="text-balance mt-4 max-w-[18ch] text-[42px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[54px] lg:text-[58px]">
              Sua carteira rural pronta para 2027.
            </h1>
            <p className="mt-6 max-w-[42ch] text-[18px] leading-relaxed text-[--lp-tinta-2]">
              A Coope lê notas e extratos dos seus produtores e entrega a carteira conferida. Você revisa e assina.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <BotaoCadastro grande />
              <a
                href={asset("/contador/")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[52px] items-center gap-2 rounded-full border border-[--lp-linha] px-6 text-[16px] font-semibold text-[--lp-tinta] transition-colors hover:border-[--lp-tinta-3]"
              >
                Ver o portal <ArrowUpRight size={17} weight="bold" />
              </a>
            </div>
          </div>

          <div className="rise relative [animation-delay:120ms]">
            <div className="overflow-hidden rounded-3xl border border-[--lp-linha] bg-[--lp-superficie] shadow-[--lp-sombra]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("/contadores/portal.jpg")}
                alt="Visão geral do portal do contador: carteira pronta para 2027, pendências e prazos"
                width={2880}
                height={1800}
                fetchPriority="high"
                className="block h-auto w-full"
              />
            </div>
            <div className="absolute -bottom-10 -left-6 hidden w-[30%] overflow-hidden rounded-[28px] border-[6px] border-[--lp-superficie] shadow-[--lp-sombra] sm:block lg:-left-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("/contadores/convite.jpg")}
                alt="Convite do escritório aberto no celular do produtor"
                width={1170}
                height={2532}
                className="block aspect-[9/16] h-auto w-full object-cover object-top"
              />
            </div>
          </div>
        </section>

        {/* O que muda em janeiro */}
        <section className="border-y border-[--lp-linha] bg-[--lp-superficie]">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Revelar>
              <h2 className="text-balance max-w-[18ch] text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
                Em janeiro, a carteira inteira muda de uma vez.
              </h2>
              <p className="mt-8 text-[88px] font-semibold leading-none tracking-[-0.05em] text-[--lp-acento] sm:text-[120px]">
                <Contagem />
              </p>
              <p className="mt-3 max-w-[34ch] text-[16px] leading-relaxed text-[--lp-tinta-2]">
                dias até a CBS começar a ser cobrada e o CNPJ do produtor virar obrigatório.
              </p>
            </Revelar>

            <div className="grid gap-x-10 gap-y-10 self-center sm:grid-cols-2">
              {MUDANCAS.map((m, i) => (
                <Revelar key={m.titulo} atraso={i * 0.06}>
                  <p className="text-[13px] font-medium tabular-nums text-[--lp-tinta-3]">{m.data}</p>
                  <h3 className="mt-2 text-[19px] font-semibold leading-snug tracking-tight">{m.titulo}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[--lp-tinta-2]">{m.texto}</p>
                </Revelar>
              ))}
            </div>
          </div>
        </section>

        {/* O que a Coope faz */}
        <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <Revelar>
            <h2 className="text-balance max-w-[20ch] text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
              O trabalho pesado sai da sua mesa.
            </h2>
          </Revelar>

          <div className="mt-12 grid gap-4 lg:grid-cols-6">
            {/* Diagnóstico: o cartão grande, com a ficha do cliente */}
            <Revelar className="lg:col-span-4 lg:row-span-2">
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[--lp-linha] bg-[--lp-superficie]">
                <div className="p-6 sm:p-8">
                  <h3 className="text-[22px] font-semibold tracking-tight">Diagnóstico 2027 da carteira, sem custo</h3>
                  <p className="mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-[--lp-tinta-2]">
                    Em cinco dias úteis: quem vira contribuinte, quem ainda não tem CNPJ, que nota saiu sem IBS e CBS e quem
                    precisa decidir o regime. Com as notas reais de cada cliente.
                  </p>
                </div>
                <div className="mt-auto px-6 sm:px-8">
                  <div className="overflow-hidden rounded-t-2xl border border-b-0 border-[--lp-linha]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset("/contadores/ficha.jpg")}
                      alt="Ficha de um cliente no portal, com as pendências para janeiro e os botões para resolver cada uma"
                      width={2880}
                      height={1800}
                      loading="lazy"
                      className="block aspect-[16/10] w-full object-cover object-right-top"
                    />
                  </div>
                </div>
              </article>
            </Revelar>

            <Revelar className="lg:col-span-2" atraso={0.06}>
              <article className="h-full rounded-3xl border border-[--lp-linha] bg-[--lp-superficie] p-6 sm:p-7">
                <Receipt size={26} className="text-[--lp-acento]" />
                <h3 className="mt-5 text-[19px] font-semibold tracking-tight">Notas direto da SEFAZ</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[--lp-tinta-2]">
                  Pelo certificado ou pelo CNPJ do escritório na nota. O produtor não instala nada.
                </p>
              </article>
            </Revelar>

            <Revelar className="lg:col-span-2" atraso={0.12}>
              <article className="flex h-full overflow-hidden rounded-3xl bg-[--lp-acento-suave]">
                <div className="flex-1 p-6 sm:p-7">
                  <Bank size={26} className="text-[--lp-acento]" />
                  <h3 className="mt-5 text-[19px] font-semibold tracking-tight">Extrato sem pedir extrato</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[--lp-tinta-2]">
                    O produtor autoriza o Open Finance uma vez, pelo celular, e os bancos mandam sozinhos.
                  </p>
                </div>
                <div className="relative hidden w-[38%] shrink-0 sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset("/contadores/autorizacoes.jpg")}
                    alt="Tela do produtor autorizando notas na SEFAZ e extratos pelo Open Finance"
                    width={1170}
                    height={2532}
                    loading="lazy"
                    className="absolute left-0 top-6 w-full rounded-t-2xl border-[5px] border-b-0 border-[--lp-superficie] object-cover object-top shadow-[--lp-sombra]"
                  />
                </div>
              </article>
            </Revelar>

            <Revelar className="lg:col-span-2">
              <article className="h-full rounded-3xl border border-[--lp-linha] bg-[--lp-superficie] p-6 sm:p-7">
                <Scales size={26} className="text-[--lp-acento]" />
                <h3 className="mt-5 text-[19px] font-semibold tracking-tight">Conferência da pré-apuração</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[--lp-tinta-2]">
                  Todo mês, a lista do que a apuração pré-preenchida do Fisco deixou de fora ou classificou errado.
                </p>
              </article>
            </Revelar>

            <Revelar className="lg:col-span-2" atraso={0.06}>
              <article className="h-full rounded-3xl border border-[--lp-linha] bg-[--lp-superficie] p-6 sm:p-7">
                <Tractor size={26} className="text-[--lp-acento]" />
                <h3 className="mt-5 text-[19px] font-semibold tracking-tight">Feito para o produtor pessoa física</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[--lp-tinta-2]">
                  Livro caixa e LCDPR, resultado ou presunção de 20%, Funrural e a opção pelo regime regular.
                </p>
              </article>
            </Revelar>

            <Revelar className="lg:col-span-2" atraso={0.12}>
              <article className="h-full rounded-3xl bg-[--lp-acento] p-6 text-[--lp-acento-tinta] sm:p-7">
                <HandCoins size={26} />
                <h3 className="mt-5 text-[19px] font-semibold tracking-tight">Parte do crédito volta ao escritório</h3>
                <p className="mt-2 text-[15px] leading-relaxed opacity-90">
                  Quando o crédito da Coope abrir, o escritório que trouxe o produtor recebe 20% da nossa comissão.
                </p>
              </article>
            </Revelar>
          </div>
        </section>

        {/* A assinatura continua sua */}
        <section className="border-y border-[--lp-linha] bg-[--lp-superficie]">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
            <Revelar>
              <h2 className="text-balance max-w-[20ch] text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[52px]">
                A assinatura continua sendo sua.
              </h2>
              <p className="mt-6 max-w-[60ch] text-[18px] leading-relaxed text-[--lp-tinta-2]">
                Escriturar e apurar para terceiros é atividade do contador. A Coope aponta, compara e prepara. Quem decide,
                assina e cobra do cliente é o escritório.
              </p>
            </Revelar>
            <div className="mt-12 grid gap-8 border-t border-[--lp-linha] pt-10 md:grid-cols-2 md:gap-16">
              <Revelar>
                <h3 className="text-[19px] font-semibold tracking-tight">Mais fazendas com a mesma equipe</h3>
                <p className="mt-2 max-w-[48ch] text-[15.5px] leading-relaxed text-[--lp-tinta-2]">
                  A conferência chega pronta. O tempo da equipe vai para o que precisa de contador, não para baixar nota e
                  pedir extrato.
                </p>
              </Revelar>
              <Revelar atraso={0.08}>
                <h3 className="text-[19px] font-semibold tracking-tight">Um serviço novo para cobrar</h3>
                <p className="mt-2 max-w-[48ch] text-[15.5px] leading-relaxed text-[--lp-tinta-2]">
                  O acompanhamento mensal da reforma e o planejamento de IR antes de 31/12, com relatório pronto para o
                  cliente.
                </p>
              </Revelar>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
          <Revelar>
            <h2 className="text-balance max-w-[22ch] text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
              Do primeiro contato ao piloto, em um mês.
            </h2>
          </Revelar>
          <ol className="mt-12 grid gap-0 lg:grid-cols-5 lg:gap-6">
            {PASSOS.map((s, i) => (
              <li key={s.titulo} className="relative border-l border-[--lp-linha] pb-10 pl-7 last:pb-0 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-7">
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-1 h-[9px] w-[9px] rounded-full bg-[--lp-acento] lg:-top-[5px] lg:left-0"
                />
                <Revelar atraso={i * 0.06}>
                  <p className="text-[13px] font-medium text-[--lp-acento]">{s.quando}</p>
                  <h3 className="mt-2 text-[18px] font-semibold leading-snug tracking-tight">{s.titulo}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[--lp-tinta-2]">{s.texto}</p>
                </Revelar>
              </li>
            ))}
          </ol>
        </section>

        {/* Pré-cadastro */}
        <section id="cadastro" className="scroll-mt-16 border-t border-[--lp-linha] bg-[--lp-elevado]">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
                Pré-cadastro do escritório
              </h2>
              <p className="mt-5 max-w-[44ch] text-[16.5px] leading-relaxed text-[--lp-tinta-2]">
                Estamos formando o primeiro grupo de escritórios piloto. Com estas respostas, a conversa já começa pela sua
                carteira.
              </p>
              <dl className="mt-10 flex flex-col gap-6">
                {[
                  ["Depois do envio", "Chamamos você no WhatsApp ou por e-mail para marcar a conversa."],
                  ["Se fizer sentido", "Combinamos o diagnóstico 2027 com as notas reais da carteira."],
                  ["Seus dados", "Ficam com a Coope e servem só para este contato."],
                ].map(([t, d]) => (
                  <div key={t} className="border-l-2 border-[--lp-acento] pl-4">
                    <dt className="text-[15px] font-semibold">{t}</dt>
                    <dd className="mt-1 text-[15px] leading-relaxed text-[--lp-tinta-2]">{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Formulario />
          </div>
        </section>

        {/* Perguntas */}
        <section id="perguntas" className="mx-auto max-w-[860px] scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">Perguntas frequentes</h2>
          <div className="mt-10 flex flex-col gap-3">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group rounded-2xl border border-[--lp-linha] bg-[--lp-superficie] px-5 open:pb-5 sm:px-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-[16.5px] font-medium">
                  {q.p}
                  <CaretDown size={18} className="shrink-0 text-[--lp-tinta-3] transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-[68ch] text-[15.5px] leading-relaxed text-[--lp-tinta-2]">{q.r}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[--lp-acento-suave] p-6 sm:p-8">
            <p className="max-w-[30ch] text-[20px] font-semibold leading-snug tracking-tight">
              Janeiro chega para a carteira inteira. Comece pela conversa.
            </p>
            <BotaoCadastro grande />
          </div>
        </section>
      </main>

      <footer className="border-t border-[--lp-linha]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[14px] text-[--lp-tinta-3] sm:px-6">
          <p>Coope. A reforma tributária do campo, pronta para o contador.</p>
          <Link href="/" className="hover:text-[--lp-tinta]">
            Conheça a Coope
          </Link>
        </div>
      </footer>
    </div>
  );
}
