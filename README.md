# Coope — protótipo

Protótipo de demonstração da camada de orquestração financeira para o produtor
rural pessoa física: captura do documento fiscal na origem, apuração contínua,
dossiê de crédito verificável e liquidação em conta de titularidade do produtor.

- **Site de investidores:** `/`
- **App do produtor:** `/app` — Início, Imposto, Crédito, Conta, Conversa
- **Telas de apoio:** Segurança, Visão da cooperativa, Números do negócio
- **Motor de decisão:** `/motor`
- **Pesquisa com produtores:** `/pesquisa`, e `/pesquisa/resultados` para ler as respostas

## Rodar localmente

```bash
cd app
npm install
npm run dev
```

A aplicação sobe em `http://localhost:4310` com as rotas de API em `src/app/api`.

## Build estático

O GitHub Pages serve arquivos e não executa servidor. No build de Pages as
rotas de API são removidas e `src/lib/api-local.ts` intercepta `fetch` para
responder `/api/*` no navegador, usando exatamente as mesmas funções de
`src/lib/servicos.ts` que as rotas usam. O estado fica na memória da aba,
espelhado em `sessionStorage`.

```bash
cd app
rm -rf src/app/api .next out
PAGES=1 BASE_PATH=/coope npm run build
```

## Pesquisa com produtores

Formulário de 17 perguntas de toque, anônimo e sem servidor nem banco de dados.
Cada resposta vira um código curto (`COOPE1-XXXXXX-XXXXXX-XXXXXX`) que carrega
todas as escolhas; o produtor manda o código dentro de uma mensagem legível, e
`/pesquisa/resultados` desmonta os códigos colados e faz as contas (indicadores
com intervalo de confiança, funil de demanda qualificada, CSV).

- Não existe campo de texto: só escolhas fechadas. Um código só é aceito se cada
  valor cair dentro das opções e o selo de verificação fechar.
- O questionário e o codificador ficam em `src/lib/pesquisa.ts`. Mudou uma
  pergunta ou uma opção? Suba `VERSAO` no mesmo arquivo: códigos antigos passam a
  ser recusados em vez de lidos errado.
- Para onde vão as respostas: `src/lib/pesquisa-config.ts`. Com `whatsapp`
  preenchido, o botão do fim abre direto a conversa. Com `endpoint` (Formspree,
  Web3Forms, FormSubmit ou um Worker próprio), o envio é automático e o WhatsApp
  vira plano B. Sem nada, o produtor escolhe a conversa.
- Os resultados ficam só no navegador de quem os abre (`localStorage`). Baixe o
  CSV ou copie os códigos para não perder.

## Natureza dos dados

Todos os dados são sintéticos e existem apenas para a demonstração: o produtor,
o CPF, as notas fiscais, as contas bancárias e as ofertas de crédito são
fictícios. Nenhuma integração real com SEFAZ, Open Finance, instituição de
pagamento ou financiador está ativa.

Os números de mercado citados no site de investidores vêm de fontes públicas
(Cepea/Esalq-USP, CNA, Serasa Experian, Banco Central, CVM, Ministério da
Agricultura) e estão creditados nas próprias seções. As projeções de receita
são um piloto simulado para dimensionar ordem de grandeza — não são resultado
auditado nem projeção financeira.
