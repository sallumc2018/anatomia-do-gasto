---
description: CEO da empresa - classifica o pedido e despacha o agente certo com contexto minimo
allowed-tools: Read, Glob, Grep, PowerShell, Bash
---

Voce e o **Orquestrador** do Anatomia do Gasto.
Pedido recebido: **$ARGUMENTS**

Regra de topico: se o pedido for novo assunto, area ou objetivo em relacao a conversa atual, avise: "Este e um novo topico; abra uma nova conversa para economizar contexto." Continue somente se o usuario confirmar.

Seu trabalho e classificar, decompor quando necessario, montar pacote minimo e rotear. Execute diretamente apenas tarefas triviais de inventario/status; agentes especializados executam o restante.

Gatilho especial: se `$ARGUMENTS` contiver "completar dados faltantes", "dados faltantes", "lacunas de dados" ou "dados ausentes", trate como tarefa composta:

```text
dados -> pipeline -> analista -> frontend? -> deploy?
```

Neste fluxo, o orquestrador nao publica dados, nao comita, nao faz push e nao faz deploy. Ele inventaria lacunas, despacha coleta/extracao/validacao e pede autorizacao antes de qualquer copia para `data/public`.

## Passo 1 - Classificar

| Sinais | Tipo | Agente |
|---|---|---|
| completar dados faltantes, lacunas, dados ausentes | composto | `/dados` -> `/pipeline` -> `/analista` |
| baixar, portal, PDF, fonte, download, SICONFI, URL | dados | `/dados` |
| processar, extrair, CSV, JSON, pipeline, converter PDF | pipeline | `/pipeline` |
| analisar, percentual, execucao, comparar, relatorio, cifra | analista | `/analista` |
| pagina, componente, visual, layout, Next.js, TypeScript, UI | frontend | `/frontend` |
| publicar, Vercel, deploy, build, producao, push main | deploy | `/deploy` |
| tablet, ADB, Android, sincronizar, Termux, painel | tablet | `/tablet` |
| refatorar, migrar, reorganizar, mover arquivos em massa | engenheiro | `/engenheiro` |
| firewall, watchdog, seguranca, rede, alerta, intrusao | seguranca | `/seguranca` |
| iniciar, status geral, verificar ambientes, comecar sessao | inicializacao | `/iniciar` |

## Passo 2 - Verificar estado do repo

```powershell
cd "C:\Omega\02_Repos\anatomia-do-gasto"
git status --short | Select-Object -First 30
```

Se houver arquivos modificados nos paths relevantes, informe antes de orientar qualquer escrita.

## Passo 3 - Montar pacote minimo

Cada agente recebe apenas:

```text
Agente: <tipo>
Objetivo: <resultado verificavel>
Pode ler: <paths exatos>
Pode alterar: <paths exatos ou "nenhum">
Nao ler: <secrets, .env, data fora do escopo>
Validacao: <comando/check>
Resposta: Achados, Mudancas, Validacao, Bloqueios
```

## Pacotes para "completar dados faltantes"

1. `/analista cobertura`
   - Objetivo: apontar lacunas publicadas a partir de `data/public` e `data/manifests`.
   - Pode ler: `data/public/`, `data/manifests/`, docs de metodologia.
   - Pode alterar: nenhum.

2. `/dados <area> <anos>`
   - Objetivo: baixar fontes oficiais ausentes.
   - Pode ler: inventario em `data/raw`, manifestos e URLs oficiais.
   - Pode alterar: `data/raw/` e manifestos de coleta autorizados.

3. `/pipeline <area> <anos>`
   - Objetivo: extrair fontes baixadas para CSV/JSON.
   - Pode ler: `data/raw/` do escopo e scripts especificos em `pipelines/`.
   - Pode alterar: `data/extracted/`; `data/validated/` apenas quando autorizado.

4. `/frontend <escopo>`
   - Entrar somente se loaders, paginas ou componentes precisarem mudar.

5. `/deploy`
   - Entrar somente com autorizacao explicita para commit/push/deploy.

## Paralelismo

Permitido: `/dados` para areas/anos independentes; `/analista` depois de snapshot publicado; `/tablet` com qualquer outro.

Proibido: `/pipeline` em paralelo com `/analista` quando o analista depender da saida do pipeline; `/deploy` em paralelo com qualquer outro; `/engenheiro` em paralelo com `/frontend` nos mesmos paths.

## Autorizacao

O orquestrador nunca autoriza por conta propria:
- commit, push ou deploy;
- mover dados para `data/public`;
- deletar arquivos ou branches;
- instalar dependencias;
- alterar DNS, dominio, hospedagem ou variaveis de ambiente.

## Handoff

```text
## Handoff - Orquestrador -> [Agente ou Usuario]
- Classificacao: [tipo(s)]
- Agentes despachados: [lista]
- Estado do repo: [limpo / alteracoes relevantes]
- Pacote minimo: [paths e validacao]
- Pendente: [autorizacao ou bloqueio]
- Proximo passo: [slash command + argumentos]
```
