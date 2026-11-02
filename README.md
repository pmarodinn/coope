# Coope — protótipo

Protótipo da Coope revisto em novembro de 2026: a reforma tributária do campo,
pronta para o contador. A Coope lê as notas que já estão na SEFAZ e os extratos
do Open Finance (com consentimento do produtor) e entrega ao escritório de
contabilidade a carteira rural conferida, mês a mês: quem vira contribuinte de
IBS/CBS em 2027, CNPJ, notas sem os campos novos, a escolha entre resultado e
presunção de 20% no imposto de renda e o livro caixa. Crédito ficou para a fase 3,
por parceiros; conta, seguro e hedge saíram do MVP.

- **Site de investidores:** `/`
- **Painel do contador:** `/contador` (o cliente pagante é o escritório)
- **App do produtor:** `/app` — Início, Imposto (com a aba Reforma 2027 em
  `/app/reforma`), Crédito, Conta, Conversa
- **Telas de apoio:** Segurança, Números do negócio, Cooperativa e Motor de
  crédito (as duas últimas são fase 3)
- **Pesquisa com produtores:** `/pesquisa`, e `/pesquisa/resultados` para ler as respostas

As regras da reforma ficam em `src/lib/reforma.ts`, com as premissas e as fontes
ao lado de cada número (alíquota de referência calculada pelo TCU em 28/10/2026,
pendente do Senado até 15/12/2026; limite de R$ 3,6 milhões da LC 214/2025). O
imposto de renda em `src/lib/engine.ts` compara as duas formas legais (resultado
e presunção de 20%, Lei 8.023/1990, art. 5º) em vez de tratar os 20% como multa.

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

Formulário de perguntas de toque em `/pesquisa`. Mede o que o produtor já vive,
paga e sofre hoje (imposto, multas por atraso, crédito negado, juros, custo de
contabilidade, como controla o dinheiro), e não o interesse num serviço que ele
ainda não conhece.

Primeiro pede nome e celular, com aceite explícito, para o comercial falar com
quem respondeu. Depois vêm as 18 perguntas, uma por tela, só com escolhas
fechadas. Ao terminar, grava sozinho no Firestore do projeto Firebase
`pesquisa-dores---coope` (banco em São Paulo, coleção `respostas`). Se a rede
falhar, a resposta fica guardada no aparelho e é reenviada quando a página abrir
de novo ou a rede voltar; reenviar nunca duplica, porque cada registro tem um
identificador próprio e o banco responde "já existe".

### O que fica no banco

Um documento plano por produtor, só com texto e número decimal, sem lista nem
objeto dentro de objeto: vira uma linha de planilha sem conversão. São 75
colunas, sempre todas, marcadas ou não. No console do Firebase elas aparecem em
ordem alfabética, que já é a ordem certa: quem respondeu, o envio, as perguntas.

| Campo | Tipo | Conteúdo |
| --- | --- | --- |
| `contato_nome`, `contato_celular`, `contato_aceite` | texto | nome, `+55…` e `sim` |
| `envio_em`, `envio_codigo` | texto | data e hora UTC; código de verificação |
| `envio_versao` | número | versão do questionário |
| `p03_area` | número | posição da opção escolhida (0 é a primeira) |
| `p03_area_txt` | texto | a opção, com as palavras da tela |
| `p01_uf_mt` | número | 0 se não marcou; a ordem do toque (1 é o maior) nas perguntas ordenadas; 1 nas outras |
| `p01_uf_txt` | texto | as marcadas, na ordem, separadas por vírgula |
| `p02_culturas_outras_txt` | texto | o que escreveu em "Outras" |

Nas perguntas de múltipla escolha há uma coluna por opção, então contar quem
citou MT é contar `p01_uf_mt > 0`, e quem tem MT como o maior é `= 1`. O
esquema é definido uma vez, em `src/lib/pesquisa-registro.ts`; o registro, as
regras do banco e a exportação saem dele.

### Ler as respostas

```bash
cd app
npm run exportar
```

Usa o login da CLI do Firebase (`firebase login`) e escreve em `exportados/`,
que fica fora do git porque traz nome e celular:

- `respostas.csv`: todas as colunas, com contato, para o comercial;
- `estatisticas.csv`: sem nome nem celular, para as contas.

Só entram linhas que conferem com o próprio código de verificação; linha forjada
ou alterada à mão fica de fora e é listada. `npm run exportar -- --listar` só
conta, e `-- --apagar-invalidas` remove do banco as que não conferem.
`/pesquisa/resultados` abre o `estatisticas.csv` e faz as contas (indicadores
com intervalo de confiança, funil de demanda qualificada, CSV). Ela não fala com
o banco.

### Segurança

`firebase/firestore.rules` deixa o site apenas **criar** um registro com
exatamente os 75 campos, do tipo certo; ler, alterar e apagar pelo site é
proibido. Os dados pessoais só saem pelo console do Firebase ou pela exportação,
com a conta do dono. A chave web em `pesquisa-config.ts` só identifica o projeto
e é pública por desenho.

Limites conhecidos: o Firestore recusa regra que gaste mais de 1.000 expressões
por pedido, então as regras conferem tipo e campos de todas as colunas, e
formato, faixa e tamanho só do contato e do envio. O restante é conferido na
exportação pelo código. Qualquer um que conheça a chave pode criar registros no
formato certo (lixo com formato válido); isso aparece como linha que não confere.

Depois de mudar uma pergunta ou opção:

```bash
cd app && npm run regras        # regera firebase/firestore.rules
cd .. && firebase deploy --only firestore
```

e suba `VERSAO` em `src/lib/pesquisa.ts`: códigos antigos passam a ser recusados
em vez de lidos errado. Faça um envio de verdade e confira no console: se a regra
ficar cara demais, o banco nega até o registro certo. As contas de
`pesquisa-analise.ts` usam índices de opção, então conferir esses índices é parte
de mudar uma opção.

### Testar sem gravar

`/pesquisa/?teste=1` mostra uma faixa de aviso e não envia nada (a resposta fica
só no aparelho). Rodando em `localhost` com o banco de verdade, o modo de teste
liga sozinho. Para testar o envio, aponte `NEXT_PUBLIC_FIRESTORE_HOST` para um
servidor local que imite o Firestore antes de rodar o build.

### Antes de distribuir

- A tela diz que a pesquisa é organizada pela Coope e não indica canal para o
  produtor pedir a exclusão dos dados. A LGPD dá ao titular esse direito; se o
  jurídico exigir um canal, ele entra no texto do aceite (`page.tsx`).
- O aceite é único e cobre guardar nome, celular e respostas e o contato
  comercial. Se o comercial for usar os dados para outra finalidade, a base legal
  e o texto do aceite precisam cobrir isso.
- O Firebase (Google) processa os dados: convém constar nos termos.

## Natureza dos dados

Todos os dados são sintéticos e existem apenas para a demonstração: o produtor,
o CPF, as notas fiscais, as contas bancárias e as ofertas de crédito são
fictícios. Nenhuma integração real com SEFAZ, Open Finance, instituição de
pagamento ou financiador está ativa.

Os números de mercado e de regra citados no site vêm de fontes públicas (Receita
Federal via CNA, TCU, LC 214/2025, Ajuste SINIEF 27/2024, Banco Central, CVM,
Serasa Experian) e estão creditados nas próprias seções. Preços e metas de receita
são hipóteses a validar com escritórios de contabilidade, não resultado nem
projeção financeira: a Coope ainda não tem cliente pagante. O escritório e os
produtores do painel do contador são fictícios.
