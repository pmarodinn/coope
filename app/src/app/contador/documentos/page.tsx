"use client";

import Link from "next/link";
import { useState } from "react";
import { Barra } from "@/components/ui";
import { Cabecalho } from "@/components/contador/portal";
import { usePortal } from "@/components/contador/estado";
import {
  BotaoP,
  Campo,
  Cartao,
  classeEntrada,
  Esqueleto,
  Iniciais,
  Kpi,
  Modal,
  SeloCertificado,
  SeloExtrato,
} from "@/components/contador/ui";
import { celularDe, dataCurta, type ClientePortal } from "@/lib/portal";
import { diasAte } from "@/lib/reforma";

function umAnoDepois() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function Documentos() {
  const p = usePortal();
  const [renovando, setRenovando] = useState<ClientePortal | null>(null);
  const [validade, setValidade] = useState(umAnoDepois());
  const [arquivo, setArquivo] = useState("");

  if (!p.carregado) return <Esqueleto />;

  const porValidade = [...p.clientes].sort((a, b) => {
    // Sem validade: ou falta o certificado (vai para o topo) ou o escritório
    // está autorizado na SEFAZ no lugar dele (vai para o fim).
    const va = a.certificadoValidade ?? (a.certificado === "faltando" ? "0000" : "9999");
    const vb = b.certificadoValidade ?? (b.certificado === "faltando" ? "0000" : "9999");
    return va.localeCompare(vb);
  });
  const porExtrato = [...p.clientes].sort((a, b) => {
    const ordem = { faltando: 0, ofx: 1, open_finance: 2 };
    return ordem[a.extratos] - ordem[b.extratos] || b.movSemNota - a.movSemNota;
  });
  const pedidosAbertos = (id: string) =>
    p.estado.convites.find(
      (c) => c.tipo === "open_finance" && c.clienteId === id && (c.status === "enviado" || c.status === "aberto"),
    );

  const pedir = (c: ClientePortal) => {
    const aberto = pedidosAbertos(c.id);
    p.mostrarLink(aberto ?? p.convidar({ tipo: "open_finance", nome: c.nome, celular: celularDe(c.id), clienteId: c.id }));
  };

  const r = p.resumo;

  return (
    <div className="rise space-y-6">
      <Cabecalho
        titulo="Certificados e extratos"
        sub="O certificado digital é o que deixa a Coope baixar as notas na SEFAZ. O extrato, de preferência pelo Open Finance, é o que fecha o livro caixa e mostra o que se move sem nota."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          rotulo="Certificados válidos"
          valor={`${p.clientes.filter((c) => c.certificado === "valido").length}/${r.produtores}`}
          tom="brand"
          icone="cadeado"
        />
        <Kpi
          rotulo="Vencidos ou vencendo"
          valor={String(r.certificadosProblema)}
          nota="Sem certificado, a nota não chega"
          tom={r.certificadosProblema ? "warn" : "ink"}
          icone="alerta"
        />
        <Kpi rotulo="Open Finance" valor={`${r.openFinance}/${r.produtores}`} nota="Extrato chega sozinho" tom="brand" icone="banco" />
        <Kpi
          rotulo="Sem extrato"
          valor={String(r.semExtrato)}
          nota="Livro caixa não fecha"
          tom={r.semExtrato ? "bad" : "ink"}
          icone="pasta"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Cartao titulo="Certificados digitais" legenda="Ordenados pelo que vence primeiro" semPadding>
          <ul>
            {porValidade.map((c) => {
              const d = c.certificadoValidade ? diasAte(c.certificadoValidade) : 0;
              return (
                <li key={c.id} className="flex items-center gap-3 border-t border-line px-5 py-3">
                  <Iniciais nome={c.nome} tamanho={32} />
                  <span className="min-w-0 flex-1">
                    <Link href={`/contador/clientes?c=${c.id}`} className="block truncate text-[13.5px] font-medium hover:text-brand">
                      {c.nome}
                    </Link>
                    <span className="block text-[11.5px] text-muted">
                      {c.certificadoValidade
                        ? `e-CPF A1 · ${d === 0 ? "venceu em" : "até"} ${dataCurta(c.certificadoValidade)}${
                            d > 0 && d <= 180 ? ` · ${d} dias` : ""
                          }`
                        : c.certificado === "faltando"
                          ? "Nenhum certificado enviado"
                          : "Escritório autorizado na SEFAZ"}
                    </span>
                  </span>
                  <SeloCertificado v={c.certificado} />
                  {c.certificado !== "valido" ? (
                    <BotaoP
                      tamanho="p"
                      variante="contorno"
                      onClick={() => {
                        setRenovando(c);
                        setValidade(umAnoDepois());
                        setArquivo("");
                      }}
                    >
                      {c.certificado === "faltando" ? "Enviar" : "Renovar"}
                    </BotaoP>
                  ) : (
                    <span className="w-[74px]" />
                  )}
                </li>
              );
            })}
          </ul>
        </Cartao>

        <Cartao
          titulo="Extratos bancários"
          legenda="Open Finance pela instituição integradora, com o consentimento do produtor"
          semPadding
        >
          <ul>
            {porExtrato.map((c) => {
              const pedido = pedidosAbertos(c.id);
              return (
                <li key={c.id} className="flex items-center gap-3 border-t border-line px-5 py-3">
                  <Iniciais nome={c.nome} tamanho={32} />
                  <span className="min-w-0 flex-1">
                    <Link href={`/contador/clientes?c=${c.id}`} className="block truncate text-[13.5px] font-medium hover:text-brand">
                      {c.nome}
                    </Link>
                    <span className="block text-[11.5px] text-muted">
                      {c.movSemNota > 0
                        ? `${c.movSemNota} ${c.movSemNota === 1 ? "movimento" : "movimentos"} sem nota`
                        : "Tudo conciliado"}
                      {pedido && ` · pedido ${pedido.status === "aberto" ? "aberto pelo produtor" : "enviado"}`}
                    </span>
                  </span>
                  <SeloExtrato v={c.extratos} />
                  {c.extratos !== "open_finance" ? (
                    <BotaoP tamanho="p" variante={pedido ? "suave" : "contorno"} icone="banco" onClick={() => pedir(c)}>
                      {pedido ? "Ver pedido" : "Pedir"}
                    </BotaoP>
                  ) : (
                    <span className="w-[74px]" />
                  )}
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line px-5 py-4">
            <div className="mb-1.5 flex justify-between text-[12px] text-muted">
              <span>Carteira no Open Finance</span>
              <span className="tnum">{Math.round((r.openFinance / r.produtores) * 100)}%</span>
            </div>
            <Barra valor={r.openFinance / r.produtores} altura={6} />
          </div>
        </Cartao>
      </div>

      <Modal
        aberto={!!renovando}
        fechar={() => setRenovando(null)}
        titulo={renovando?.certificado === "faltando" ? "Enviar certificado digital" : "Registrar certificado renovado"}
      >
        {renovando && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              p.renovarCertificado(renovando.id, validade);
              setRenovando(null);
            }}
          >
            <p className="text-[13px] leading-relaxed text-muted">
              {renovando.nome}. O arquivo fica guardado cifrado e só é usado para consultar as notas na SEFAZ. Nesta
              demonstração nada é enviado: escolha qualquer arquivo ou só a data.
            </p>
            <Campo rotulo="Arquivo do certificado (.pfx ou .p12)">
              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-xl bg-raised px-3.5 text-[13px] text-muted ring-1 ring-transparent hover:ring-line">
                <span className="rounded-lg bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink ring-1 ring-line">
                  Escolher
                </span>
                <span className="truncate">{arquivo || "Nenhum arquivo escolhido"}</span>
                <input
                  type="file"
                  accept=".pfx,.p12"
                  className="hidden"
                  onChange={(e) => setArquivo(e.target.files?.[0]?.name ?? "")}
                />
              </label>
            </Campo>
            <Campo rotulo="Válido até">
              <input
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className={classeEntrada}
                required
              />
            </Campo>
            <div className="flex justify-end gap-2 pt-1">
              <BotaoP variante="suave" onClick={() => setRenovando(null)}>
                Cancelar
              </BotaoP>
              <BotaoP type="submit" icone="check">
                Salvar certificado
              </BotaoP>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
