"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Barra,
  Botao,
  Chip,
  Dica,
  Divisor,
  Icone,
  Linha,
  Tile,
  Titulo,
  Vazio,
} from "@/components/ui";
import {
  NATUREZA_DEDUTIVEL,
  NATUREZA_LABEL,
  type ApuracaoFiscal,
  type LancamentoLCDPR,
  type Natureza,
} from "@/lib/domain";
import { ALIQUOTA_IRPF, brl, dataBR } from "@/lib/engine";
import { NOTAS, PRODUTOR, TRANSACOES } from "@/lib/seed";

type Resposta = { apuracao: ApuracaoFiscal; lancamentos: LancamentoLCDPR[] };

/** Nomes que o produtor usa, no lugar da natureza contábil. */
const NOME_SIMPLES: Partial<Record<Natureza, string>> = {
  insumo_fertilizante: "Adubo",
  insumo_defensivo: "Defensivo",
  insumo_semente: "Semente",
  combustivel: "Combustível",
  servico_operacional: "Serviços",
  arrendamento: "Arrendamento",
  mao_de_obra: "Mão de obra",
  investimento_maquina: "Máquinas",
  receita_producao: "Venda",
  nao_rural: "Pessoal",
};
const simples = (n: Natureza) => NOME_SIMPLES[n] ?? NATUREZA_LABEL[n];

export default function Imposto() {
  const [a, setA] = useState<ApuracaoFiscal | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoLCDPR[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [verTudo, setVerTudo] = useState(false);

  useEffect(() => {
    fetch("/api/fiscal/lcdpr")
      .then((r) => r.json())
      .then((r: Resposta) => {
        setA(r.apuracao);
        setLancamentos(r.lancamentos);
      });
  }, []);

  async function enviar() {
    setEnviando(true);
    await fetch("/api/fiscal/lcdpr", { method: "POST" });
    setEnviado(true);
    setEnviando(false);
  }

  if (!a) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-44 animate-pulse rounded-card bg-surface" />
        <div className="h-36 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  // Vem dos mesmos lançamentos que geraram a apuração, para os totais fecharem.
  const porTipo = new Map<Natureza, number>();
  lancamentos
    .filter((l) => l.tipoLanc === 2 && NATUREZA_DEDUTIVEL[l.natureza])
    .forEach((l) => porTipo.set(l.natureza, (porTipo.get(l.natureza) ?? 0) + l.valorSaida));
  const gastos = [...porTipo.entries()].sort((x, y) => y[1] - x[1]);
  const maior = gastos[0]?.[1] ?? 1;

  const pessoais = lancamentos.filter((l) => l.natureza === "nao_rural");
  const totalPessoal = pessoais.reduce((s, l) => s + l.valorSaida, 0);

  // O LCDPR exige o código do imóvel em cada lançamento; isso dá o resultado
  // por fazenda de graça, sem o produtor separar nada.
  const porImovel = PRODUTOR.propriedades.map((p) => {
    const doImovel = lancamentos.filter((l) => l.codImovel === p.codImovel);
    const entrada = doImovel.reduce((s, l) => s + l.valorEntrada, 0);
    const saida = doImovel
      .filter((l) => NATUREZA_DEDUTIVEL[l.natureza])
      .reduce((s, l) => s + l.valorSaida, 0);
    return {
      codigo: p.codImovel,
      nome: p.nome,
      municipio: `${p.municipio}/${p.uf}`,
      hectares: p.hectares,
      entrada,
      saida,
      resultado: entrada - saida,
    };
  });

  const recentes = [...NOTAS].reverse();
  const visiveis = verTudo ? recentes.slice(0, 40) : recentes.slice(0, 6);

  const real = a.irSobreResultadoReal;
  const presumido = a.irSobrePresumido;
  const maiorIR = Math.max(real, presumido, 1);
  const opcoes = [
    {
      chave: "resultado" as const,
      titulo: "Pelo resultado",
      sub: "O que sobrou: vendas menos gastos",
      valor: real,
    },
    {
      chave: "presumido" as const,
      titulo: "Pela presunção de 20%",
      sub: "A lei deixa tratar 20% do que vendeu como lucro",
      valor: presumido,
    },
  ];

  // Movimentações do extrato sem nota: o resíduo que o contador só acha no
  // fechamento. Aparecem porque o Open Finance traz o extrato inteiro.
  const semNota = TRANSACOES.filter((t) => !t.conciliadaCom);
  const valorSemNota = semNota.reduce((s, t) => s + t.valor, 0);
  const bancos = new Set(TRANSACOES.map((t) => t.instituicao)).size;

  return (
    <div className="space-y-5 pt-1">
      <h1 className="px-1 text-[22px] font-bold tracking-tight">Seu imposto</h1>

      <div className="grid grid-cols-2 gap-1 rounded-full bg-raised p-1">
        <span className="rounded-full bg-surface py-2 text-center text-[13px] font-semibold text-ink shadow-card">
          Imposto de renda
        </span>
        <Link
          href="/app/reforma"
          className="rounded-full py-2 text-center text-[13px] font-semibold text-muted transition-colors active:bg-line"
        >
          Reforma 2027
        </Link>
      </div>

      {/* As duas formas legais */}
      <Tile className="rise overflow-hidden">
        <div className="px-5 pb-1 pt-5">
          <p className="text-[13px] font-medium text-muted">Duas formas que a lei permite</p>
        </div>
        <div className="space-y-4 px-5 pb-5 pt-3">
          {opcoes.map((o) => {
            const melhor = a.melhorOpcao === o.chave;
            return (
              <div key={o.chave}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">{o.titulo}</span>
                    {melhor && <Chip tom="bom">melhor este ano</Chip>}
                  </span>
                  <span className={`tnum shrink-0 text-[17px] font-bold ${melhor ? "text-brand" : "text-muted"}`}>
                    {brl(o.valor)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-faint">{o.sub}</p>
                <div className="mt-2">
                  <Barra valor={o.valor / maiorIR} tom={melhor ? undefined : "warn"} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-brand-soft px-5 py-4">
          <p className="text-[13px] font-medium text-muted">Diferença entre as duas</p>
          <p className="tnum mt-1 text-[28px] font-bold leading-none tracking-tight text-brand">
            {brl(a.diferencaOpcoes)}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            A escolha é sua, mas só existe com o livro caixa completo. Sem ele, a Receita arbitra os 20%
            e escolhe por você.
          </p>
        </div>
      </Tile>

      <Dica>
        Os 20% não são multa: são uma opção da lei, boa para quem tem margem acima disso. O que a Coope
        faz é manter o livro em dia durante o ano, para você e seu contador escolherem em novembro, e
        não descobrirem em abril.
      </Dica>

      {/* Planejamento antes do fim do ano */}
      <section>
        <Titulo>Antes de 31 de dezembro</Titulo>
        <Tile className="p-5">
          <p className="text-[14px] font-semibold leading-snug">
            Pagar em dezembro adia imposto. Não economiza.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            No livro do produtor vale a data do pagamento. Se R$ 1 milhão de insumo da próxima safra for
            pago em dezembro, e não em janeiro, o imposto deste ano cai cerca de{" "}
            <span className="tnum font-semibold text-ink">{brl(1_000_000 * ALIQUOTA_IRPF)}</span> e o do
            ano que vem sobe o mesmo tanto. Vale quando o caixa permite e o ano que vem promete ser mais
            fraco.
          </p>
          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            Só conta gasto real da atividade, com nota. Combine com seu contador antes de pagar.
          </p>
        </Tile>
      </section>

      {/* Conferência com o banco: o lado do caixa */}
      <section>
        <Titulo>Notas conferidas com o banco</Titulo>
        <Tile className="overflow-hidden">
          <div className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-medium text-ink">
                Movimentações com nota
              </span>
              <span className="tnum text-[17px] font-bold text-brand">
                {Math.round(a.cobertura.percentual * 100)}%
              </span>
            </div>
            <div className="mt-2">
              <Barra valor={a.cobertura.percentual} />
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
              {a.cobertura.transacoesConciliadas} de {a.cobertura.transacoesTotais} movimentações dos seus{" "}
              {bancos} bancos batem com uma nota. O extrato vem pelo Open Finance, com a sua autorização:
              é ele que diz em que dia o dinheiro saiu, e é esse dia que vale para o imposto.
            </p>
          </div>
          {semNota.map((t) => (
            <div key={t.id}>
              <Divisor />
              <Linha
                icone="olho"
                titulo={t.descricao}
                sub={`${dataBR(t.data)} · ${t.instituicao} · sem nota`}
                valor={`${t.tipo === "credito" ? "+" : "−"} ${brl(t.valor)}`}
                tom="ink"
              />
            </div>
          ))}
        </Tile>
        <p className="mt-2.5 px-1 text-[12.5px] leading-relaxed text-faint">
          {semNota.length} movimentações somando {brl(valorSemNota)} não têm nota. O contador decide o que
          entra no livro e o que precisa de documento.
        </p>
      </section>

      {/* Conta da safra */}
      <section>
        <Titulo>Como chegou nesse número</Titulo>
        <Tile className="overflow-hidden">
          <Linha titulo="Você vendeu" valor={brl(a.receitaBruta)} tom="brand" />
          <Divisor />
          <Linha titulo="Você gastou na lavoura" valor={`− ${brl(a.despesasCusteio)}`} />
          <Divisor />
          <Linha titulo="Você comprou máquinas" valor={`− ${brl(a.investimentos)}`} />
          <Divisor />
          <Linha titulo="Sobrou" sub="É sobre isso que o imposto é cobrado" valor={brl(a.resultadoReal)} />
        </Tile>
      </section>

      {/* Gastos */}
      <section>
        <Titulo>No que você mais gastou</Titulo>
        <Tile className="space-y-3.5 p-5">
          {gastos.map(([nat, v]) => (
            <div key={nat}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[13.5px] text-ink">{simples(nat)}</span>
                <span className="tnum text-[13px] font-medium text-muted">{brl(v)}</span>
              </div>
              <Barra valor={v / maior} altura={6} />
            </div>
          ))}
        </Tile>
      </section>

      {/* Rateio por fazenda */}
      <section>
        <Titulo>Cada fazenda separada</Titulo>
        <Tile className="overflow-hidden">
          {porImovel.map((p, i) => (
            <div key={p.codigo}>
              {i > 0 && <Divisor />}
              <div className="px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[14px] font-semibold">{p.nome}</span>
                  <span className="tnum shrink-0 text-[14px] font-bold text-brand">
                    {brl(p.resultado)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-faint">
                  {p.municipio} · {p.hectares.toLocaleString("pt-BR")} ha
                </p>
                <div className="mt-2.5 flex gap-4">
                  <span className="text-[12.5px] text-muted">
                    Entrou <span className="tnum font-medium text-ink">{brl(p.entrada)}</span>
                  </span>
                  <span className="text-[12.5px] text-muted">
                    Saiu <span className="tnum font-medium text-ink">{brl(p.saida)}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Tile>
        <p className="mt-2.5 px-1 text-[12.5px] leading-relaxed text-faint">
          A Receita exige que cada lançamento diga de qual imóvel ele é. Como já separamos na
          entrada, você vê o resultado de cada fazenda sem trabalho extra.
        </p>
      </section>

      {/* Separação pessoal */}
      <section>
        <Titulo>Separamos o que é pessoal</Titulo>
        <Tile className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13.5px] font-medium text-ink">
              {pessoais.length} compras suas, não da fazenda
            </span>
            <span className="tnum text-[15px] font-bold text-warn">{brl(totalPessoal)}</span>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
            Mercado, farmácia e posto no seu CPF ficaram de fora da conta. Misturar as duas coisas é o
            erro que mais dá problema na Receita.
          </p>
        </Tile>
      </section>

      {/* Notas */}
      <section>
        <Titulo
          acao={
            <button
              type="button"
              onClick={() => setVerTudo((v) => !v)}
              className="text-[13px] font-semibold text-brand"
            >
              {verTudo ? "Ver menos" : "Ver todas"}
            </button>
          }
        >
          Suas notas
        </Titulo>
        <Tile className="overflow-hidden">
          {visiveis.length === 0 ? (
            <Vazio>Nenhuma nota ainda.</Vazio>
          ) : (
            visiveis.map((n, i) => (
              <div key={n.chave}>
                {i > 0 && <Divisor />}
                <Linha
                  icone={n.sentido === "saida" ? "mais" : "enviar"}
                  titulo={n.contraparte}
                  sub={`${dataBR(n.emissao)} · ${simples(n.natureza)}`}
                  valor={`${n.sentido === "saida" ? "+" : "−"} ${brl(n.valor)}`}
                  tom={n.sentido === "saida" ? "brand" : "ink"}
                />
              </div>
            ))
          )}
        </Tile>
        <p className="mt-2.5 px-1 text-[12.5px] leading-relaxed text-faint">
          Chegam sozinhas da SEFAZ, pelo certificado digital. Você não digita nada.
        </p>
      </section>

      {/* Entrega */}
      <Tile className="p-5">
        {enviado ? (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icone nome="check" tamanho={19} />
            </span>
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold">Enviado ao contador</p>
              <p className="mt-0.5 text-[12.5px] text-muted">Ele revisa e assina com o certificado digital.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[14.5px] font-semibold">Livro caixa do ano</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Montamos o livro com as notas e o extrato. Seu contador revisa e assina.
            </p>
            <div className="mt-4">
              <Botao onClick={enviar} carregando={enviando} largura="cheia">
                Enviar para o contador
              </Botao>
            </div>
          </>
        )}
      </Tile>

      <p className="px-1 pb-2 text-[11.5px] leading-relaxed text-faint">
        Demonstração com dados de exemplo. Imposto calculado com a alíquota marginal de 27,5%, uma
        aproximação da tabela progressiva. Não substitui seu contador.
      </p>
    </div>
  );
}
