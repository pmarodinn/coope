# Coope — protótipo

Protótipo de demonstração da camada de orquestração financeira para o produtor
rural pessoa física: captura do documento fiscal na origem, apuração contínua,
dossiê de crédito verificável e liquidação em conta de titularidade do produtor.

- **Site de investidores:** `/investidores`
- **App do produtor:** `/` — Início, Imposto, Crédito, Conta, Conversa
- **Telas de apoio:** Segurança, Visão da cooperativa, Números do negócio

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
