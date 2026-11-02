"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bank,
  CalendarCheck,
  Handshake,
  Plant,
  Receipt,
  Stamp,
  Warning,
} from "@phosphor-icons/react";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { diasAte, PRAZOS } from "@/lib/reforma";
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
   Dados. Revisados em 01/11/2026 depois da análise de concorrência:
   cliente é o escritório de contabilidade, a cunha é a reforma
   tributária é a porta; o destino é o produtor sem contador, o motor
   de crédito e o marketplace.
   ================================================================ */

/** Dias até 01/01/2027 no momento da build; o navegador recalcula. */
const DIAS_NA_BUILD = diasAte(PRAZOS.cbsECnpj);

const CALENDARIO = [
  {
    data: "05/01/2026",
    titulo: "Nota eletrônica para todo produtor",
    corpo: "A nota de produtor em papel acabou. Toda venda sai em NF-e, que fica na SEFAZ.",
    fonte: "Ajuste SINIEF nº 27/2024",
    quando: "feito" as const,
  },
  {
    data: "01/08/2026",
    titulo: "Nota sem IBS e CBS pode ser autuada",
    corpo: "Para quem já é contribuinte, faltar os campos novos gera auto se não corrigir em 60 dias.",
    fonte: "Regulamentos de 30/04/2026",
    quando: "feito" as const,
  },
  {
    data: "28/10/2026",
    titulo: "TCU calcula a CBS em 11,3%",
    corpo: "É a alíquota de referência para 2027. Em 2027 e 2028 o IBS fica em 0,1%.",
    fonte: "TCU",
    quando: "feito" as const,
  },
  {
    data: "15/12/2026",
    titulo: "Senado fixa a alíquota",
    corpo: "Se não fixar, vale o cálculo do TCU.",
    fonte: "LC nº 214/2025",
    quando: "agora" as const,
  },
  {
    data: "31/12/2026",
    titulo: "A receita de 2026 decide 2027",
    corpo: "Acima de R$ 3,6 milhões, contribuinte obrigatório. Abaixo, uma escolha que não volta atrás no ano.",
    fonte: "LC nº 214/2025, art. 164",
    quando: "agora" as const,
  },
  {
    data: "01/01/2027",
    titulo: "CBS cobrada e CNPJ obrigatório",
    corpo: "PIS e Cofins acabam. Apuração mensal, pré-preenchida pelo Fisco e conferida pelo contador.",
    fonte: "Receita Federal e CGIBS",
    quando: "proximo" as const,
  },
  {
    data: "2º sem. 2027",
    titulo: "Split payment facultativo",
    corpo: "O imposto sai no próprio pagamento, entre empresas, por Pix, boleto e TED. Obrigatório em 2028.",
    fonte: "Receita Federal, set/2026",
    quando: "proximo" as const,
  },
  {
    data: "2029 a 2033",
    titulo: "O ICMS vira IBS",
    corpo: "Transição de quatro anos. O IBS fica pleno em 2033.",
    fonte: "EC nº 132/2023",
    quando: "proximo" as const,
  },
];

const DECISOES = [
  {
    n: "1",
    pergunta: "Sou contribuinte em 2027?",
    resposta: "Se a receita de 2026 passou de R$ 3,6 milhões, sim, e todo mês. São 43,6 mil produtores.",
  },
  {
    n: "2",
    pergunta: "Abaixo do limite: entro ou fico fora?",
    resposta: "Depende de quem compra e de quanto se compra com imposto. Vale do mês seguinte e não volta atrás no ano.",
  },
  {
    n: "3",
    pergunta: "Imposto de renda: resultado ou 20%?",
    resposta: "A lei dá as duas formas. Só escolhe quem tem o livro caixa em dia; sem ele, o Fisco arbitra.",
  },
];

const TESE = [
  {
    id: "cliente",
    icone: Handshake,
    titulo: "Cliente",
    frase: "O cliente é o contador, não o fazendeiro.",
    corpo:
      "Uma venda a um escritório traz trinta fazendas de uma vez. O produtor não precisa instalar nada: o contador dele já tem o certificado, a procuração e a confiança. E escriturar e apurar são atividades do contador, por lei.",
    numero: "1 = 30",
    numeroLegenda: "Uma venda, trinta produtores atendidos.",
  },
  {
    id: "cunha",
    icone: CalendarCheck,
    titulo: "Cunha",
    frase: "A entrada é fiscal, e passa a ser mensal.",
    corpo:
      "Imposto de renda e livro caixa eram um retrato por ano, tirado em abril. IBS e CBS viram doze. Quem está no fluxo mensal tem o dado mais fresco e mais conferido da fazenda.",
    numero: "12×",
    numeroLegenda: "Retratos por ano no lugar de um.",
  },
  {
    id: "credito",
    icone: Bank,
    titulo: "Crédito",
    frase: "O destino é crédito e marketplace.",
    corpo:
      "Entrar direto no crédito é brigar com quem tem capital e dado. Depois de doze meses de imposto conferido, a Coope tem o dado que eles compram de terceiros: vira motor de crédito e, em seguida, marketplace de crédito, insumo e seguro.",
    numero: "Degrau 3",
    numeroLegenda: "Depois de 12 meses de série mensal conferida.",
  },
];

const DEGRAUS = [
  {
    n: "1",
    nome: "Gatilho: a reforma",
    corpo: "Entramos pelo escritório de contabilidade, com a carteira rural conferida para 2027.",
    paga: "Escritório, por produtor",
    quando: "Agora",
  },
  {
    n: "2",
    nome: "Piloto automático",
    corpo: "O produtor faz sozinho, no app, o que hoje paga ao contador: livro caixa, IR, IBS/CBS conferido.",
    paga: "Produtor, assinatura direta",
    quando: "2027–2028",
  },
  {
    n: "3",
    nome: "Motor de crédito",
    corpo: "Doze meses de vendas, compras, caixa e dívidas conferidos viram score e limite.",
    paga: "Financiador, por crédito originado",
    quando: "Após 12 meses de série",
  },
  {
    n: "4",
    nome: "Marketplace",
    corpo: "Crédito, insumo, seguro e trava de preço pelo custo total, onde o produtor vê o próprio caixa.",
    paga: "Quem vende, por transação",
    quando: "Na sequência",
  },
];

const FONTES_DADO = [
  {
    icone: Receipt,
    titulo: "Nota fiscal: o documento",
    corpo:
      "Vem da SEFAZ pelo serviço de distribuição de documentos fiscais, com o certificado do produtor ou com o CNPJ do escritório autorizado na nota. Diz o que foi vendido e comprado, de quem, por quanto e com que imposto.",
    rodape: "NFeDistribuicaoDFe · Ajuste SINIEF 27/2024",
  },
  {
    icone: Bank,
    titulo: "Open Finance: o caixa",
    corpo:
      "Extrato de todos os bancos do produtor, com a autorização dele dada no app do banco. Diz em que dia o dinheiro entrou ou saiu e por qual conta, que é o que o livro caixa exige, e mostra o que se moveu sem nota.",
    rodape: "Consentimento por empresa parceira · Res. Conjunta 21/2026",
  },
  {
    icone: Stamp,
    titulo: "Contador: a decisão",
    corpo:
      "A Coope aponta, compara e simula. Escriturar, apurar e assinar continuam com o contador responsável. A Coope vende software ao escritório; não presta serviço contábil.",
    rodape: "Res. CFC nº 1.640/2021",
  },
];

/** O papel do Open Finance muda conforme a fase; nunca é a fonte do fosso. */
const OPEN_FINANCE_FASES = [
  {
    fase: "Agora",
    uso: "Extratos e saldos das contas do produtor",
    para: "Livro caixa pela data do pagamento, separação do pessoal, movimentações sem nota.",
  },
  {
    fase: "Fase 2",
    uso: "Operações de crédito já contratadas",
    para: "A dívida inteira do produtor aparece, em todos os bancos, para o planejamento de caixa.",
  },
  {
    fase: "Fase 3",
    uso: "Histórico levado ao financiador",
    para: "Consentimento novo para cada parceiro. A portabilidade pelo Open Finance ainda não inclui crédito rural.",
  },
  {
    fase: "Se houver conta",
    uso: "Iniciação de pagamento",
    para: "Por instituição autorizada como iniciadora. A Coope não guarda dinheiro em nenhuma fase.",
  },
];

const CAMADAS = [
  {
    n: "01",
    nome: "Captura",
    corpo: "Notas da SEFAZ e extratos do Open Finance de toda a carteira do escritório, sem digitação.",
    fonte: "DF-e · Open Finance",
  },
  {
    n: "02",
    nome: "Livro caixa contínuo",
    corpo: "Nota conferida com extrato, pessoal separado do rural e resultado real × presunção de 20% antes de 31/12.",
    fonte: "LCDPR · Lei 8.023/1990",
  },
  {
    n: "03",
    nome: "IBS e CBS mensal",
    corpo: "Débitos, créditos, diferimento e crédito presumido, conferidos contra a pré-apuração do Fisco.",
    fonte: "LC 214/2025",
  },
  {
    n: "04",
    nome: "Painel do contador",
    corpo: "A carteira inteira pelo que vence primeiro: CNPJ, notas sem campos, certificados e decisões.",
    fonte: "Fila de trabalho",
  },
  {
    n: "05",
    nome: "Histórico para crédito",
    corpo: "Fase 3. Com consentimento do produtor, a série mensal vai ao financiador parceiro.",
    fonte: "Res. CMN 4.935/2021",
  },
];

const TELAS = [
  { src: "/shots/inicio.png", titulo: "O prazo primeiro", corpo: "O produtor abre e vê o que vence." },
  { src: "/shots/reforma.png", titulo: "Reforma, mês a mês", corpo: "Situação, pendências e a conta de 2027 com as notas reais." },
  { src: "/shots/imposto.png", titulo: "Duas formas legais", corpo: "Resultado ou presunção de 20%, decidido em novembro." },
  { src: "/shots/conversa.png", titulo: "Aviso no WhatsApp", corpo: "O produtor recebe o que importa. O contador decide." },
  { src: "/shots/credito.png", titulo: "Crédito, degrau 3", corpo: "Custo total e garantia à vista, com o histórico do próprio produtor." },
];

type Marca = "sim" | "parcial" | "nao";

/** Camada por camada, com o que dá para afirmar a partir de fonte pública. */
const CONCORRENTES: { nome: string; nota: string; c: [Marca, Marca, Marca, Marca, Marca, Marca] }[] = [
  { nome: "Aegro", nota: "ERP do produtor; crédito por parceiros", c: ["sim", "sim", "parcial", "nao", "parcial", "nao"] },
  { nome: "Software contábil geral", nota: "Feito para empresa, não para o produtor PF", c: ["sim", "parcial", "parcial", "sim", "nao", "nao"] },
  { nome: "Calculadora da CNA", nota: "Gratuita, manual, um produtor por vez", c: ["nao", "nao", "parcial", "parcial", "nao", "nao"] },
  { nome: "Fisco (pré-apuração)", nota: "Calcula; não confere nem planeja", c: ["sim", "nao", "sim", "parcial", "nao", "nao"] },
  { nome: "Traive", nota: "Análise de crédito e marketplace", c: ["nao", "nao", "nao", "nao", "sim", "nao"] },
  { nome: "Tarken", nota: "Crédito para revendas e indústrias", c: ["nao", "nao", "nao", "nao", "sim", "nao"] },
  { nome: "Nagro / AgRisk", nota: "SCD desde maio de 2024", c: ["nao", "nao", "nao", "nao", "sim", "sim"] },
  { nome: "Agrolend", nota: "Carteira de R$ 968 mi em 2025", c: ["nao", "nao", "nao", "nao", "sim", "sim"] },
  { nome: "TerraMagna", nota: "Crédito com risco por satélite", c: ["nao", "nao", "nao", "nao", "sim", "sim"] },
  { nome: "Bradesco E-agro", nota: "R$ 6,3 bi em carteira em 2025", c: ["nao", "nao", "nao", "nao", "sim", "sim"] },
  { nome: "Coope (MVP proposto)", nota: "Começa pelo contador; crédito e marketplace depois", c: ["sim", "sim", "sim", "sim", "nao", "nao"] },
];

const COLUNAS = ["Nota da SEFAZ", "Livro caixa", "IBS/CBS mensal", "Para o contador", "Crédito", "Capital próprio"];

const EVIDENCIA = [
  { rotulo: "Nunca tiveram crédito negado em 3 anos", n: 7 },
  { rotulo: "Têm certificado digital válido", n: 8 },
  { rotulo: "Não usam crédito de terceiros no custeio", n: 5 },
  { rotulo: "Pagaram multa ou juros por atraso em 3 anos", n: 5 },
  { rotulo: "O crédito cai em 3 a 15 dias", n: 4 },
  { rotulo: "Pagam de R$ 1 mil a 3 mil por mês de contabilidade", n: 4 },
];

const MERCADO = [
  {
    n: "01",
    rotulo: "Produtores acima de R$ 3,6 milhões",
    valor: "43,6 mil",
    conta: "Contribuintes obrigatórios de IBS e CBS a partir de 2027, todos com apuração mensal.",
    fonte: "Receita Federal, DIRPF 2023, via CNA",
  },
  {
    n: "02",
    rotulo: "Receita possível só no núcleo",
    valor: "R$ 62,8 mi/ano",
    conta: "43,6 mil × R$ 120 por mês × 12. Sem contar quem está abaixo do limite e precisa decidir.",
    fonte: "Preço: hipótese a validar",
  },
  {
    n: "03",
    rotulo: "Meta de 12 meses",
    valor: "R$ 1,3 mi/ano",
    conta: "50 escritórios × 30 produtores ao preço do plano. É o que precisa ser provado primeiro.",
    fonte: "Hipótese, não projeção",
  },
];

const RECEITA = [
  { nome: "Produtor contribuinte", detalhe: "R$ 120 por CPF por mês, pago pelo escritório", peso: 67, ativo: true },
  { nome: "Produtor não contribuinte", detalhe: "R$ 40 por CPF por mês: CNPJ, notas, livro caixa e limite", peso: 33, ativo: true },
  { nome: "Diagnóstico de opção", detalhe: "R$ 600 avulso, em novembro e dezembro, para quem está abaixo do limite", peso: 0, ativo: false },
  { nome: "Assinatura direta do produtor", detalhe: "Degrau 2: o produtor resolve sozinho o que hoje paga ao contador", peso: 0, ativo: false },
  { nome: "Crédito originado", detalhe: "Degrau 3: 1% a 3% do crédito levado a financiadores", peso: 0, ativo: false },
  { nome: "Marketplace", detalhe: "Degrau 4: comissão em crédito, insumo e seguro", peso: 0, ativo: false },
  { nome: "Success fee sobre economia", detalhe: "Removida: a escolha entre resultado e 20% é da lei, não nossa", peso: 0, ativo: false },
  { nome: "Float", detalhe: "Removido: conta é do produtor, e conta saiu do MVP", peso: 0, ativo: false },
];

const CONTA_ESCRITORIO = [
  { rotulo: "Produtores atendidos", valor: "30" },
  { rotulo: "Contribuintes: 12 × R$ 120", valor: "R$ 1.440" },
  { rotulo: "Não contribuintes: 18 × R$ 40", valor: "R$ 720" },
  { rotulo: "Por escritório, por mês", valor: "R$ 2.160", forte: true },
  { rotulo: "Por escritório, por ano", valor: "R$ 25.920", forte: true },
  { rotulo: "× 50 escritórios", valor: "R$ 1,3 mi/ano", forte: true },
];

const NAO_E_FOSSO = [
  "Estar conforme a Res. Conjunta 16/2025: todo mundo que opera conta precisa estar até 31/12/2026.",
  "Dado do Open Finance: portável por desenho, e desde 22/10/2026 com consentimento por empresa parceira.",
  "Um app bonito: a Aegro já emite nota, baixa da SEFAZ e gera o livro caixa.",
];

const PODE_VIRAR = [
  "Estar no fluxo mensal do escritório: trocar de ferramenta é migrar a carteira inteira.",
  "A série mensal conferida de cada fazenda: doze retratos por ano, com nota e extrato.",
  "Regras rurais testadas em casos reais: diferimento, crédito presumido, Funrural, livro caixa.",
];

const PLANO = [
  {
    prazo: "03 a 14/11",
    titulo: "20 conversas",
    corpo:
      "10 produtores (5 acima e 5 abaixo de R$ 3,6 mi), 5 contadores rurais e 5 gestores de Fiagro ou crédito agro. A pergunta que fecha cada uma: o que você faria se a Coope não existisse?",
  },
  {
    prazo: "03 a 14/11",
    titulo: "5 pilotos manuais",
    corpo:
      "Por WhatsApp e planilha, com o contador do produtor assinando: livro caixa de 2026, resultado × 20%, situação em 2027 e a conta de IBS e CBS. Cobrando R$ 300 pelo diagnóstico.",
  },
  {
    prazo: "até 14/11",
    titulo: "Uma frase contra a Aegro",
    corpo:
      "Testada nas cinco conversas com contadores. Se eles não repetirem a diferença com as próprias palavras, o posicionamento está errado.",
  },
  {
    prazo: "90 dias",
    titulo: "3 escritórios pagando",
    corpo: "Cobrança desde o primeiro mês, mesmo pequena. Pagamento é a única prova que não depende de opinião.",
  },
];

const CRITERIOS = {
  passa: [
    "3 de 5 contadores descrevem 2027 como problema de capacidade, sem a gente sugerir.",
    "2 de 5 aceitam um piloto pago.",
    "3 de 5 pilotos entregam algo que o contador do produtor não tinha.",
  ],
  muda: [
    "Se os contadores disserem que o software atual e a pré-apuração do Fisco resolvem, a cunha não existe.",
    "Se os gestores de Fiagro disserem que histórico mensal não muda taxa sem garantia, crédito sai do horizonte de 12 meses.",
  ],
};

const NORMAS = [
  "LC nº 214/2025",
  "EC nº 132/2023",
  "Ajuste SINIEF nº 27/2024",
  "Lei nº 8.023/1990",
  "Lei nº 9.250/1995",
  "IN RFB nº 1.848/2018",
  "Res. Conjunta nº 21/2026",
  "Res. Conjunta nº 16/2025",
  "Res. CFC nº 1.640/2021",
  "Res. CFC nº 1.721/2024",
  "LGPD nº 13.709/2018",
  "Res. CD/ANPD nº 15/2024",
  "Res. CMN nº 4.935/2021",
];

const LIMITES = [
  "Nada está em operação: não há sistema funcionando, integração real, cliente nem receita. O que existe é um protótipo navegável da arquitetura, com dados fictícios.",
  "A pesquisa de mercado está em andamento: 11 respostas até agora, quase todas fora do perfil-alvo. Os resultados são preliminares e precisam de mais respostas.",
  "O Fisco vai pré-preencher a apuração mensal. Se conferir e planejar não valer dinheiro para o escritório, a cunha encolhe.",
  "O software contábil que o escritório já usa vai atualizar para IBS e CBS. Precisamos ser melhores no rural, não só existir.",
  "A alíquota da CBS e o crédito presumido ainda dependem de ato do governo. Toda simulação mostra as premissas.",
  "O Open Finance mudou em 22/10/2026: consentimento por empresa parceira e verificação anual por auditor. O acesso depende de uma instituição integradora.",
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
      {/* Céu: fica atrás do canvas, que é transparente. A cor do horizonte é
          a mesma da neblina do shader, então o campo dissolve no céu. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#8fbcd9_0%,#b9d4e2_42%,#dfe9ea_62%,#dfe9ea_100%)]" />

      <GrassField className="absolute inset-x-0 bottom-0 top-0 h-full w-full" />

      {/* Sol baixo à esquerda, para casar com a direção da luz no shader. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_22%_38%,rgba(255,244,214,0.5)_0%,transparent_62%)]" />

      {/* A dobra é o único trecho claro do site. Este degradê leva o dia de
          volta ao escuro do restante, sem emenda visível. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(to_top,#05100b_0%,rgba(5,16,11,0.86)_38%,rgba(5,16,11,0.42)_68%,transparent_100%)]" />

      <motion.div
        style={reduz ? undefined : { y, opacity: fade }}
        className="relative flex min-h-[100dvh] flex-col justify-between px-6 pb-14 pt-8 md:px-10 md:pb-16"
      >
        <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/coope-mark.png")} alt="" className="h-7 w-7 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight text-[#0d1f16]">Coope</span>
          </div>
          <nav className="hidden items-center gap-8 text-[13.5px] text-[#20402f] md:flex">
            <a href="#reforma" className="transition-colors hover:text-[#04130b]">Reforma</a>
            <a href="#visao" className="transition-colors hover:text-[#04130b]">Visão</a>
            <a href="#concorrencia" className="transition-colors hover:text-[#04130b]">Concorrência</a>
            <a href="#produto" className="transition-colors hover:text-[#04130b]">Produto</a>
            <a href="#plano" className="transition-colors hover:text-[#04130b]">Plano</a>
          </nav>
          <Link
            href="/app"
            className="rounded-full border border-[#0d1f16]/25 bg-white/35 px-4 py-2 text-[13px] font-medium text-[#0d1f16] backdrop-blur-md transition-colors hover:border-[#0d1f16]/50"
          >
            Abrir o app
          </Link>
        </header>

        <div className="mx-auto w-full max-w-[1180px]">
          {/* Vidro fosco escuro: mantém o texto claro legível sobre a lavoura
              iluminada, sem precisar escurecer a cena inteira. */}
          <div className="max-w-[780px] rounded-[26px] border border-white/15 bg-[rgba(6,20,13,0.42)] px-7 py-9 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl md:px-10 md:py-11">
            <p className="rotulo rotulo-dobra mb-6">Do agro, para o agro</p>

            <h1 className="display max-w-[17ch]">
              <RevealText texto="A reforma tributária do campo," />
              <br />
              <RevealText texto="pronta para o contador." delay={0.18} />
            </h1>

            <motion.p
              initial={reduz ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...MOLA_SUAVE, delay: 0.55 }}
              className="mt-7 max-w-[56ch] text-[16.5px] leading-relaxed text-[--tinta-2] md:text-[18px]"
            >
              Em 1º de janeiro de 2027 a CBS começa a ser cobrada e todo produtor pessoa física passa a
              precisar de CNPJ. A Coope lê as notas que já estão na SEFAZ e os extratos do Open Finance,
              e entrega ao escritório a carteira rural conferida, mês a mês.
            </motion.p>

            <motion.div
              initial={reduz ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...MOLA_SUAVE, delay: 0.68 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link href="/contador">
                <Magnetico className="group inline-flex items-center gap-2 rounded-full bg-[--acento] px-6 py-3.5 text-[15px] font-semibold text-[#04130b]">
                  Ver o painel do contador
                  <ArrowRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </Magnetico>
              </Link>
              <a
                href="#tese"
                className="rounded-full border border-[--linha] px-6 py-3.5 text-[15px] font-medium text-[--tinta] transition-colors hover:border-[--acento] hover:text-[--acento]"
              >
                Ler a tese
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- sinais ---------------- */

function Sinais() {
  const [dias, setDias] = useState(DIAS_NA_BUILD);
  useEffect(() => setDias(diasAte(PRAZOS.cbsECnpj)), []);

  const sinais = [
    {
      valor: 43.6,
      sufixo: " mil",
      casas: 1,
      legenda: "produtores acima de R$ 3,6 milhões passam a recolher IBS e CBS todo mês",
      fonte: "Receita Federal, via CNA, 2026",
    },
    {
      valor: 11.3,
      sufixo: "%",
      casas: 1,
      legenda: "de CBS de referência para 2027, calculada pelo TCU. O Senado fixa até 15/12",
      fonte: "TCU, 28/10/2026",
    },
    {
      valor: dias,
      sufixo: " dias",
      casas: 0,
      legenda: "até a CBS ser cobrada e o CNPJ do produtor pessoa física virar obrigatório",
      fonte: "LC nº 214/2025 · Receita Federal",
    },
  ];

  return (
    <Secao id="sinais" className="py-28 md:py-36">
      <div className="grid gap-12 md:grid-cols-3 md:gap-8">
        {sinais.map((s, i) => (
          <Reveal key={s.legenda} delay={i * 0.09}>
            <div className="border-t border-[--linha] pt-6">
              <p className="numero text-[--tinta]">
                <Contador valor={s.valor} sufixo={s.sufixo} casas={s.casas} />
              </p>
              <p className="mt-4 max-w-[28ch] text-[15px] leading-snug text-[--tinta-2]">{s.legenda}</p>
              <p className="mono mt-3 text-[11px] text-[--tinta-3]">{s.fonte}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <TextoScroll
        texto="O imposto do campo era anual. Em 2027 vira mensal. E quem carrega isso é o contador."
        destacar={["vira", "mensal.", "contador."]}
        className="mt-24 max-w-[30ch] text-[26px] font-medium leading-[1.25] tracking-[-0.025em] md:max-w-[26ch] md:text-[40px]"
      />
    </Secao>
  );
}

/* ---------------- reforma ---------------- */

function Reforma() {
  return (
    <Secao id="reforma" className="py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="rotulo mb-5">Por que agora</p>
          <h2 className="display-2">Um calendário que não espera.</h2>
          <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-[--tinta-2]">
            Obrigatório, com data e confuso: é o melhor tipo de problema para começar. Ninguém precisa ser
            convencido de que ele existe.
          </p>
        </div>

        <ol className="relative space-y-3 border-l border-[--linha] pl-6">
          {CALENDARIO.map((c, i) => (
            <Reveal key={c.data} delay={i * 0.04}>
              <li className="relative">
                <span
                  className={`absolute -left-[31px] top-2 h-3 w-3 rounded-full border-2 ${
                    c.quando === "feito"
                      ? "border-[--tinta-3] bg-[--tinta-3]"
                      : c.quando === "agora"
                        ? "border-[--acento] bg-[--acento]"
                        : "border-[--acento] bg-[--fundo]"
                  }`}
                />
                <div
                  className={`rounded-2xl border p-5 ${
                    c.quando === "agora" ? "border-[--acento]/40 bg-[--acento-fundo]" : "border-[--linha] bg-[--fundo-2]"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="mono text-[12px] text-[--acento]">{c.data}</p>
                    <p className="mono text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">{c.fonte}</p>
                  </div>
                  <p className="mt-2 text-[16px] font-semibold tracking-tight">{c.titulo}</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[--tinta-2]">{c.corpo}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {DECISOES.map((d, i) => (
          <Reveal key={d.n} delay={i * 0.07}>
            <div className="h-full rounded-2xl border border-[--linha] bg-[linear-gradient(160deg,var(--fundo-3),var(--fundo-2))] p-7">
              <span className="mono text-[12px] text-[--acento]">Decisão {d.n}</span>
              <p className="mt-3 text-[18px] font-semibold leading-snug tracking-tight">{d.pergunta}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-[--tinta-2]">{d.resposta}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Secao>
  );
}

/* ---------------- tese ---------------- */

function Tese() {
  return (
    <Secao id="tese" className="py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="rotulo mb-5">A tese</p>
          <h2 className="display-2">A reforma é a porta. Não é o destino.</h2>
          <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-[--tinta-2]">
            Ela dá um motivo urgente para entrar agora em milhares de fazendas. O que se constrói lá
            dentro é o que vale.
          </p>
        </div>

        <div className="space-y-5">
          {TESE.map((l, i) => {
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
                      <span className="tnum shrink-0 text-[24px] font-semibold tracking-tight text-[--acento] md:text-[30px]">
                        {l.numero}
                      </span>
                    </div>

                    <p className="mt-6 text-[20px] font-medium leading-tight tracking-tight md:text-[24px]">
                      {l.frase}
                    </p>
                    <p className="mt-4 max-w-[60ch] text-[14.5px] leading-relaxed text-[--tinta-2]">{l.corpo}</p>
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

/* ---------------- escada ---------------- */

function Escada() {
  return (
    <Secao id="visao" className="py-24 md:py-32">
      <div className="max-w-[52ch]">
        <p className="rotulo mb-5">A visão</p>
        <h2 className="display-2">Quatro degraus, do imposto ao marketplace.</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-[--tinta-2]">
          Cada degrau gera o dado e a confiança de que o próximo precisa. Os concorrentes de crédito
          compram dado de terceiros a cada pedido; a Coope produz o dado todo mês, resolvendo o imposto.
        </p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {DEGRAUS.map((d, i) => (
          <Reveal key={d.n} delay={i * 0.07}>
            <div
              className={`flex h-full flex-col justify-between rounded-2xl border p-6 ${
                i === 0 ? "border-[--acento]/40 bg-[--acento-fundo]" : "border-[--linha] bg-[--fundo-2]"
              }`}
            >
              <div>
                <p className="mono text-[12px] text-[--acento]">Degrau {d.n}</p>
                <p className="mt-3 text-[18px] font-semibold tracking-tight">{d.nome}</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[--tinta-2]">{d.corpo}</p>
              </div>
              <div className="mt-6 border-t border-[--linha] pt-4">
                <p className="text-[12.5px] text-[--tinta-2]">{d.paga}</p>
                <p className="mono mt-1 text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">{d.quando}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Secao>
  );
}

/* ---------------- dados ---------------- */

function Dados() {
  return (
    <Secao id="dados" className="py-24 md:py-32">
      <Reveal>
        <h2 className="display-2 max-w-[22ch]">Três fontes, três papéis.</h2>
        <p className="mt-5 max-w-[60ch] text-[15px] leading-relaxed text-[--tinta-2]">
          A nota diz o que aconteceu. O extrato diz quando o dinheiro passou. O contador diz o que isso
          significa para o imposto. O livro caixa do produtor exige os três.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {FONTES_DADO.map((f, i) => {
          const Icone = f.icone;
          return (
            <Reveal key={f.titulo} delay={i * 0.08}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-[--linha] bg-[linear-gradient(160deg,var(--fundo-3),var(--fundo-2))] p-7">
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--acento-fundo] text-[--acento]">
                    <Icone size={20} weight="duotone" />
                  </span>
                  <p className="mt-5 text-[17px] font-semibold tracking-tight">{f.titulo}</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-[--tinta-2]">{f.corpo}</p>
                </div>
                <p className="mono mt-8 border-t border-[--linha] pt-4 text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">
                  {f.rodape}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-6 overflow-hidden rounded-2xl border border-[--linha] bg-[--fundo-2]">
          <div className="border-b border-[--linha] px-6 py-5 md:px-8">
            <p className="text-[15px] font-semibold tracking-tight">O Open Finance em cada fase</p>
            <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-[--tinta-2]">
              A Coope não é instituição autorizada: recebe os dados por uma instituição integradora regulada,
              como entidade parceira, com consentimento do produtor dado especificamente para a Coope. Sem
              consentimento, o escritório envia o arquivo do banco e o resto funciona igual.
            </p>
          </div>
          <div className="grid md:grid-cols-4">
            {OPEN_FINANCE_FASES.map((f, i) => (
              <div
                key={f.fase}
                className={`px-6 py-5 md:px-7 ${i > 0 ? "border-t border-[--linha] md:border-l md:border-t-0" : ""}`}
              >
                <p className="mono text-[11px] uppercase tracking-[0.14em] text-[--acento]">{f.fase}</p>
                <p className="mt-2 text-[14px] font-semibold leading-snug">{f.uso}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[--tinta-2]">{f.para}</p>
              </div>
            ))}
          </div>
        </div>
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
            <p className="mono text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">{camada.fonte}</p>
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
    <section id="arquitetura" ref={ref} className="relative h-[240vh]">
      <div className="sticky top-0 flex min-h-[100dvh] items-center px-6 py-20 md:px-10">
        <div className="mx-auto grid w-full max-w-[1180px] gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:pt-6">
            <h2 className="display-2 max-w-[16ch]">Da nota fiscal até a decisão do contador.</h2>
            <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-[--tinta-2]">
              O módulo fiscal vem primeiro porque é ele que gera o histórico. Crédito só entra quando esse
              histórico tiver doze meses.
            </p>
            <div className="mt-8 hidden h-1 w-full max-w-[14rem] overflow-hidden rounded-full bg-[--linha] lg:block">
              <motion.div style={{ scaleX: suave }} className="h-full origin-left rounded-full bg-[--acento]" />
            </div>
          </div>

          <div className="space-y-3">
            {CAMADAS.map((c, i) => (
              <Camada key={c.n} camada={c} indice={i} total={CAMADAS.length} progresso={suave} />
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
  const trilho = useRef<HTMLDivElement>(null);
  const reduz = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Quanto o trilho excede a tela, medido de verdade. Com porcentagem fixa o
  // carrossel parava no meio em telas largas e passava do fim no celular.
  const [excesso, setExcesso] = useState(0);
  useEffect(() => {
    const medir = () => {
      const el = trilho.current;
      if (!el) return;
      setExcesso(Math.max(0, el.scrollWidth - el.clientWidth));
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (trilho.current) ro.observe(trilho.current);
    window.addEventListener("resize", medir);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], [0, -excesso]);
  const suave = useSpring(x, { stiffness: 80, damping: 26, restDelta: 0.001 });

  return (
    <>
      <Secao id="produto" className="pb-10 pt-24 md:pt-32">
        <p className="rotulo mb-5">Protótipo de arquitetura</p>
        <h2 className="display-2 max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.7rem)]">
          Como seria: o painel do escritório e o app do produtor.
        </h2>
        <Reveal delay={0.1}>
          <Link href="/contador" className="group mt-10 block">
            <div className="overflow-hidden rounded-[22px] border border-[--linha] bg-[--fundo-2] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("/shots/contador.png")}
                alt="Painel do contador com a carteira rural ordenada por prazo"
                loading="lazy"
                className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </div>
            <p className="mt-4 flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Painel do contador
              <ArrowUpRight size={15} weight="bold" className="text-[--acento]" />
            </p>
            <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-[--tinta-2]">
              Protótipo navegável com escritório e produtores fictícios, sem integração real. Mostra a tela
              que o cliente pagante usaria.
            </p>
          </Link>
        </Reveal>
      </Secao>

      <section ref={ref} className="relative h-[220vh]">
        <div className="sticky top-0 flex min-h-[100dvh] flex-col justify-center overflow-hidden py-20">
          <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
            <p className="text-[15px] font-semibold tracking-tight">E o que o produtor vê</p>
            <p className="mt-1.5 max-w-[56ch] text-[13px] leading-relaxed text-[--tinta-2]">
              O produtor não precisa usar nada. Se quiser, vê o que o contador vê, em linguagem dele.
            </p>
          </div>

          <motion.div ref={trilho} style={reduz ? undefined : { x: suave }} className="mt-10 flex w-max gap-5 px-6 md:px-10">
            {TELAS.map((t) => (
              <figure key={t.src} className="w-[200px] shrink-0 md:w-[232px]">
                <div className="overflow-hidden rounded-[26px] border border-[--linha] bg-[--fundo-2] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(t.src)} alt={t.titulo} loading="lazy" className="block h-auto w-full" />
                </div>
                <figcaption className="mt-5">
                  <p className="text-[15px] font-semibold tracking-tight">{t.titulo}</p>
                  <p className="mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-[--tinta-2]">{t.corpo}</p>
                </figcaption>
              </figure>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}

/* ---------------- concorrência ---------------- */

function Marcador({ m }: { m: Marca }) {
  if (m === "sim")
    return <span aria-label="sim" className="inline-block h-3 w-3 rounded-full bg-[--acento]" />;
  if (m === "parcial")
    return (
      <span
        aria-label="parcial"
        className="inline-block h-3 w-3 rounded-full border-2 border-[--acento] bg-[linear-gradient(90deg,var(--acento)_50%,transparent_50%)]"
      />
    );
  return <span aria-label="não" className="inline-block h-3 w-3 rounded-full border border-[--tinta-3] opacity-50" />;
}

function Concorrencia() {
  return (
    <Secao id="concorrencia" className="py-24 md:py-32">
      <div className="max-w-[52ch]">
        <p className="rotulo mb-5">Concorrência</p>
        <h2 className="display-2">Não é oceano azul. É uma brecha.</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-[--tinta-2]">
          Camada por camada, com o que dá para afirmar a partir de fonte pública. O crédito está lotado e
          bem capitalizado. O que ninguém faz por inteiro é a reforma do produtor pessoa física, do jeito
          que o contador precisa.
        </p>
      </div>

      <Reveal delay={0.08}>
        <div className="mt-12 overflow-x-auto rounded-2xl border border-[--linha] bg-[--fundo-2]">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[--linha]">
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[--tinta-3]">Quem</th>
                {COLUNAS.map((c) => (
                  <th key={c} className="px-3 py-4 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[--tinta-3]">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONCORRENTES.map((r) => {
                const nos = r.nome.startsWith("Coope");
                return (
                  <tr key={r.nome} className={`border-b border-[--linha] last:border-b-0 ${nos ? "bg-[--acento-fundo]" : ""}`}>
                    <td className="px-6 py-3.5">
                      <p className={`text-[14px] font-semibold ${nos ? "text-[--acento]" : ""}`}>{r.nome}</p>
                      <p className="mt-0.5 text-[11.5px] text-[--tinta-3]">{r.nota}</p>
                    </td>
                    {r.c.map((m, i) => (
                      <td key={COLUNAS[i]} className="px-3 py-3.5 text-center">
                        <Marcador m={m} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mono mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[--tinta-3]">
          <span className="flex items-center gap-1.5"><Marcador m="sim" /> faz</span>
          <span className="flex items-center gap-1.5"><Marcador m="parcial" /> faz em parte</span>
          <span className="flex items-center gap-1.5"><Marcador m="nao" /> não faz ou não verificado</span>
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <Reveal>
          <div className="h-full rounded-2xl border border-[--acento]/30 bg-[--acento-fundo] p-7">
            <p className="rotulo mb-4 text-[--acento]">A frase contra a Aegro</p>
            <p className="text-[18px] font-medium leading-snug tracking-tight">
              A Aegro pede que cada produtor adote um sistema de gestão. A Coope não pede nada ao produtor:
              trabalha para o contador dele, com as notas que já estão na SEFAZ, e cobre a carteira inteira
              de uma vez.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="h-full rounded-2xl border border-[--linha] bg-[--fundo-2] p-7">
            <p className="rotulo mb-4">Onde não competimos</p>
            <p className="text-[14px] leading-relaxed text-[--tinta-2]">
              Traive, Tarken, Nagro, Agrolend, TerraMagna e os bancos disputam crédito, onde o gargalo é
              garantia e funding. Não entramos aí agora. Se um dia entrarmos, é como canal para eles, com o
              consentimento do produtor, e não como concorrente.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="h-full rounded-2xl border border-[--linha] bg-[--fundo-2] p-7">
            <p className="rotulo mb-4">O que ameaça de verdade</p>
            <p className="text-[14px] leading-relaxed text-[--tinta-2]">
              O Fisco pré-preenchendo a apuração, a calculadora gratuita da CNA e o software contábil que o
              escritório já usa. Nosso valor precisa estar em conferir e planejar com as notas reais, não em
              calcular o que o governo já calcula.
            </p>
          </div>
        </Reveal>
      </div>
    </Secao>
  );
}

/* ---------------- evidência ---------------- */

function Evidencia() {
  return (
    <Secao id="evidencia" className="py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="rotulo mb-5">O que ouvimos</p>
          <h2 className="display-2 max-w-[18ch]">Pesquisa em andamento: o que 11 respostas já sugerem.</h2>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[--tinta-2]">
            A pesquisa mede o que o produtor já vive, não o interesse num produto, e continua recebendo
            respostas. Das 11 primeiras, 8 são de Minas Gerais e 7 faturam até R$ 1 milhão: não é o
            perfil-alvo. Os resultados são preliminares, mas já colocam em dúvida duas certezas.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "A dor de crédito não apareceu: o crédito cai em dias, não em 45 a 60, e quase ninguém teve pedido negado.",
              "O certificado digital não é a barreira que supúnhamos: 8 de 11 têm um válido.",
              "Imposto e contador, sim: 5 de 11 pagaram multa ou juros por atraso em três anos.",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-[14.5px] leading-relaxed text-[--tinta-2]">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[--acento]" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <Reveal>
          <div className="rounded-2xl border border-[--linha] bg-[--fundo-2] p-7 md:p-8">
            <p className="rotulo mb-6">De 11 respostas</p>
            <div className="space-y-5">
              {EVIDENCIA.map((e, i) => (
                <div key={e.rotulo}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[13.5px] leading-snug">{e.rotulo}</p>
                    <p className="tnum shrink-0 text-[14px] font-semibold text-[--acento]">{e.n}/11</p>
                  </div>
                  <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-[--linha]">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: e.n / 11 }}
                      viewport={{ once: true, margin: "-15%" }}
                      transition={{ ...MOLA_SUAVE, delay: 0.1 + i * 0.05 }}
                      className="h-full origin-left rounded-full bg-[--acento]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-7 border-t border-[--linha] pt-5 text-[12px] leading-relaxed text-[--tinta-3]">
              Pesquisa própria em andamento desde outubro de 2026, respostas fechadas. Resultado preliminar de
              amostra pequena e de conveniência: precisa de mais respostas e não estima o mercado.
            </p>
          </div>
        </Reveal>
      </div>
    </Secao>
  );
}

/* ---------------- mercado ---------------- */

function Mercado() {
  return (
    <Secao id="mercado" className="py-24 md:py-32">
      <div className="max-w-[48ch]">
        <p className="rotulo mb-5">Tamanho de mercado</p>
        <h2 className="display-2">Uma cunha pequena, de propósito.</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-[--tinta-2]">
          Contado de baixo para cima, a partir de quem é obrigado. Cada linha traz a conta e a fonte, para
          você refazer com as suas premissas.
        </p>
      </div>

      <div className="mt-14 space-y-3">
        {MERCADO.map((m, i) => (
          <Reveal key={m.n} delay={i * 0.07}>
            <div
              className={`grid items-baseline gap-x-6 gap-y-3 rounded-2xl border px-6 py-6 md:grid-cols-[auto_1fr_auto] md:px-8 ${
                i === MERCADO.length - 1 ? "border-[--acento] bg-[--acento-fundo]" : "border-[--linha] bg-[--fundo-2]"
              }`}
            >
              <span className="mono text-[12px] text-[--acento]">{m.n}</span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-tight">{m.rotulo}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[--tinta-2]">{m.conta}</p>
                <p className="mono mt-2 text-[10.5px] uppercase tracking-[0.14em] text-[--tinta-3]">{m.fonte}</p>
              </div>
              <p
                className={`tnum text-[28px] font-semibold leading-none tracking-tight md:text-[34px] ${
                  i === MERCADO.length - 1 ? "text-[--acento]" : "text-[--tinta]"
                }`}
              >
                {m.valor}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <p className="mt-6 max-w-[70ch] text-[13.5px] leading-relaxed text-[--tinta-2]">
          O mercado grande é o crédito: R$ 402 bilhões por safra já são capital privado; 1% disso seriam
          R$ 4 bilhões por ano, em tese. Ele abre no degrau 3, quando a série mensal existir.
        </p>
      </Reveal>
    </Secao>
  );
}

/* ---------------- negócio ---------------- */

function Negocio() {
  return (
    <Secao id="negocio" className="py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="display-2 max-w-[16ch]">Como a plataforma ganha dinheiro.</h2>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-[--tinta-2]">
            Hoje, assinatura paga pelo escritório. Cada degrau seguinte abre uma receita maior: o produtor
            direto, o crédito originado e o marketplace.
          </p>

          <div className="mt-10 space-y-5">
            {RECEITA.map((r, i) => (
              <Reveal key={r.nome} delay={i * 0.06}>
                <div className={r.ativo ? "" : "opacity-55"}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[15.5px] font-semibold tracking-tight">{r.nome}</p>
                    <p className="tnum text-[13px] text-[--tinta-2]">{r.ativo ? `${r.peso}%` : "fora"}</p>
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
            <div className="rounded-2xl border border-[--linha] bg-[--fundo-2] p-7 md:p-8">
              <p className="rotulo mb-1">A conta, aberta</p>
              <p className="mb-7 text-[13px] leading-relaxed text-[--tinta-2]">
                Um escritório de cidade agrícola. São premissas, não resultado: refaça com as suas.
              </p>

              {CONTA_ESCRITORIO.map((l, i) => (
                <div
                  key={l.rotulo}
                  className={`flex items-baseline justify-between gap-4 py-2.5 ${i > 0 ? "border-t border-[--linha]" : ""} ${
                    l.forte ? "mt-1 pt-4" : ""
                  }`}
                >
                  <span className={l.forte ? "text-[14.5px] font-semibold" : "text-[13.5px] text-[--tinta-2]"}>
                    {l.rotulo}
                  </span>
                  <span
                    className={`tnum shrink-0 ${l.forte ? "text-[19px] font-semibold text-[--acento]" : "text-[14px] text-[--tinta]"}`}
                  >
                    {l.valor}
                  </span>
                </div>
              ))}

              <p className="mt-6 border-t border-[--linha] pt-5 text-[12px] leading-relaxed text-[--tinta-3]">
                Na pesquisa, 4 de 11 produtores pagam de R$ 1 mil a 3 mil por mês de contabilidade. R$ 120 é
                de 4% a 12% disso, e o escritório repassa ou absorve.
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
        <h2 className="display-2 max-w-[20ch]">O que nos defende, e o que ainda não.</h2>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[--linha] bg-[--linha] md:grid-cols-2">
        <div className="bg-[--fundo] p-8">
          <p className="rotulo mb-5">Não é fosso</p>
          <ul className="space-y-4">
            {NAO_E_FOSSO.map((t) => (
              <li key={t} className="flex gap-3 text-[14px] leading-relaxed text-[--tinta-2]">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#ef7361]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[--fundo] p-8">
          <p className="rotulo mb-5">Pode virar fosso</p>
          <ul className="space-y-4">
            {PODE_VIRAR.map((t) => (
              <li key={t} className="flex gap-3 text-[14px] leading-relaxed text-[--tinta-2]">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[--acento]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Secao>
  );
}

/* ---------------- plano ---------------- */

function Plano() {
  return (
    <Secao id="plano" className="py-24 md:py-32">
      <div className="max-w-[50ch]">
        <p className="rotulo mb-5">As próximas duas semanas</p>
        <h2 className="display-2">Antes de código, conversa.</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-[--tinta-2]">
          O plano anterior pedia de 9 a 14 meses e até R$ 1,5 milhão antes da primeira receita, com cinco
          produtos. Este pede duas semanas e nenhum código novo.
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANO.map((p, i) => (
          <Reveal key={p.titulo} delay={i * 0.06}>
            <div className="h-full rounded-2xl border border-[--linha] bg-[--fundo-2] p-6">
              <p className="mono text-[11px] uppercase tracking-[0.14em] text-[--acento]">{p.prazo}</p>
              <p className="mt-3 text-[17px] font-semibold tracking-tight">{p.titulo}</p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[--tinta-2]">{p.corpo}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-[--acento]/30 bg-[--acento-fundo] p-7">
            <p className="rotulo mb-4 text-[--acento]">Passa se</p>
            <ul className="space-y-3">
              {CRITERIOS.passa.map((t) => (
                <li key={t} className="flex gap-3 text-[14px] leading-relaxed">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[--acento]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="h-full rounded-2xl border border-[--linha] bg-[--fundo-2] p-7">
            <p className="rotulo mb-4">Muda o plano se</p>
            <ul className="space-y-3">
              {CRITERIOS.muda.map((t) => (
                <li key={t} className="flex gap-3 text-[14px] leading-relaxed text-[--tinta-2]">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#ef7361]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Secao>
  );
}

/* ---------------- fase 3: dinheiro ---------------- */

function OndeEntra() {
  return (
    <Secao id="fluxo" className="py-24 md:py-32">
      <div className="max-w-[50ch]">
        <p className="rotulo mb-5">Fase 3, se e quando houver conta</p>
        <h2 className="display-2">O dinheiro nunca passa por aqui.</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-[--tinta-2]">
          O MVP não toca em dinheiro. Se um dia houver conta e crédito, a conta é do produtor, numa
          instituição autorizada; a Coope só inicia pagamento sob consentimento e devolve trilha ao
          financiador.
        </p>
      </div>

      <div className="mt-14 rounded-2xl border border-[--linha] bg-[--fundo-2] p-6 md:p-10">
        <Fluxo />
      </div>

      <Reveal delay={0.15}>
        <p className="mono mt-6 text-[11.5px] leading-relaxed text-[--tinta-3]">
          Res. Conjunta BCB/CMN nº 16/2025: titularidade individualizada obrigatória, contas-bolsão vedadas
        </p>
      </Reveal>
    </Secao>
  );
}

/* ---------------- normas ---------------- */

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
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[--acento-fundo] text-[--acento]">
              <Plant size={21} weight="duotone" />
            </span>
            <h2 className="display-2 mx-auto mt-6 max-w-[20ch]">A arquitetura está desenhada. O que falta é provar.</h2>
            <p className="mx-auto mt-6 max-w-[54ch] text-[15.5px] leading-relaxed text-[--tinta-2]">
              Duas semanas, vinte conversas, cinco pilotos manuais para provar a porta de entrada. Depois,
              degrau por degrau: o produtor sem contador, o motor de crédito e o marketplace.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contador">
                <Magnetico className="group inline-flex items-center gap-2 rounded-full bg-[--acento] px-7 py-4 text-[15px] font-semibold text-[#04130b]">
                  Abrir o painel do contador
                  <ArrowUpRight
                    size={17}
                    weight="bold"
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Magnetico>
              </Link>
              <Link
                href="/app"
                className="rounded-full border border-[--linha] px-7 py-4 text-[15px] font-medium transition-colors hover:border-[--acento] hover:text-[--acento]"
              >
                Abrir o app do produtor
              </Link>
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
        <p className="max-w-[56ch] text-center leading-relaxed md:text-right">
          Documento de fundamentação, revisto em 01/11/2026. Dados de exemplo, sem integração real ativa.
          Não constitui oferta de valores mobiliários nem parecer tributário.
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
      <Reforma />
      <Tese />
      <Escada />
      <Dados />
      <Arquitetura />
      <Produto />
      <Concorrencia />
      <Evidencia />
      <Mercado />
      <Negocio />
      <Fossos />
      <Plano />
      <OndeEntra />
      <Normas />
      <Limites />
      <Fecho />
    </main>
  );
}
