# CONSTITUICAO.md — Anatomia do Gasto

> ⚠️ **Fonte única de regras compartilhadas entre agentes.**
> Todo agente (Claude Code, Codex, Maestro, subagentes) DEVE ler este arquivo
> **antes de qualquer ação**. As regras aqui substituem quaisquer duplicatas
> espalhadas em `CLAUDE.md`, `codex.md`, `ORQUESTRADOR.md`, `docs/agentes-contexto.md`
> e `docs/roteamento-codex-claude.md`.
>
> Alterou uma regra? Edite **apenas este arquivo** — os demais apontam para cá.

---

## Índice

1. [Objetivo do Projeto](#1-objetivo-do-projeto)
2. [Ecossistema de Trabalho](#2-ecossistema-de-trabalho)
3. [Routing: Tabela de Roteamento de Agentes](#3-routing-tabela-de-roteamento-de-agentes)
4. [Regras Permanentes](#4-regras-permanentes)
5. [Política de Commit](#5-política-de-commit)
6. [Checklist Pré-Commit / Pré-Push / Pré-Deploy](#6-checklist-pré-commit--pré-push--pré-deploy)
7. [Provenance Tracking](#7-provenance-tracking)
8. [Economia de Contexto / Token](#8-economia-de-contexto--token)
9. [Footer Padrão de Encerramento](#9-footer-padrão-de-encerramento)
10. [Escopo Proibido (não commitar)](#10-escopo-proibido-não-commitar)
11. [Flow: Completar Dados Faltantes](#11-flow-completar-dados-faltantes)
12. [Flow: Auditoria de Cobertura/Publicação](#12-flow-auditoria-de-coberturapublicação)
13. [Flow: Onboarding de Novo Município](#13-flow-onboarding-de-novo-município)
14. [Isolamento por Agente (leitura/escrita)](#14-isolamento-por-agente-leituraescrita)
15. [Paralelismo entre Agentes](#15-paralelismo-entre-agentes)
16. [Pacote Mínimo de Subagente](#16-pacote-mínimo-de-subagente)
17. [Protocolo de Handoff](#17-protocolo-de-handoff)
18. [Protocolo de Modelo](#18-protocolo-de-modelo)
19. [Quarteto de Alta Confiança + Theo](#19-quarteto-de-alta-confiança--theo)
20. [Disciplina de Raciocínio (obrigatória)](#20-disciplina-de-raciocínio-obrigatória)
21. [Padrão de Assinatura](#21-padrão-de-assinatura)
22. [Registro de Alterações](#22-registro-de-alterações)

---

## 1. Objetivo do Projeto

O Anatomia do Gasto expõe, de forma clara e legível para o cidadão comum, como o
dinheiro público entra no governo e para onde ele vai depois, começando por Saúde
e Educação em Sorocaba/SP e expandindo município por município até cobrir o
Brasil.

- **Site oficial:** https://www.anatomiadogasto.ong.br
- **Repositório GitHub:** https://github.com/sallumc2018/anatomia-do-gasto
- **Classificação:** repositório **público** — tudo que for commitado aqui deve poder ser publicado.

---

## 2. Ecossistema de Trabalho

| Ambiente | Papel | Path |
|---|---|---|
| WSL/Linux | Desenvolvimento principal — Python, Node, Codex, RTK, Claude Code CLI | `~/Documentos/Projects/anatomia-do-gasto` |
| Windows | Operações — ADB/tablet, GUI, VS Code, Claude Code extensão | `C:/Omega/Profissional/Repositorios_Git_Projetos/anatomia-do-gasto` |
| GitHub | Fonte da verdade entre todos os ambientes | `sallumc2018/anatomia-do-gasto` |
| Vercel | Produção somente após gate explícito; Root Directory `apps/web` |
| Tablet Android | Terminal portátil — leitura de docs e dados públicos | `/sdcard/AnatomiaDrive` via ADB |

**App web:** `apps/web/` · **Pipeline Python:** `pipelines/` · **Infra local Windows:** `C:/Omega/03_Ferramentas/infra/`

### Camadas de dados

| Camada | Caminho | Regra |
|---|---|---|
| Bruto | `data/raw/` | Local, não versionado |
| Extraído | `data/extracted/` | Local, não publicado |
| Validado | `data/validated/` | Local, ainda não público |
| Público | `data/public/` | **Única** camada consumível pelo site |
| Manifestos | `data/manifests/` | Contratos, inventários, status e QA |

`data/extracted` **não** pode ser promovido a `data/public` apenas porque a fonte
respondeu com sucesso. Publicação exige os gates definidos pelo projeto.

### Fluxo de dados

```
data/raw/          ← PDFs e JSONs originais (gitignored)
    ↓ baixar_*.py
data/extracted/    ← saída bruta dos extratores
    ↓ extrator_*.py
data/validated/    ← aprovado localmente
    ↓ publicar_dados.py (gate explícito)
data/public/       ← ÚNICA fonte lida pelo site Next.js
    ↓ gerar_datasets_json.py
data/manifests/datasets_status.json + apps/web/lib/datasets_status.json
    ↓ git push → Vercel build
anatomiadogasto.ong.br
```

### Sincronia entre ambientes

Fonte da verdade é o **GitHub**. Antes de deploy:
1. Validar localmente
2. Validar no WSL quando a mudança afetar build, scripts ou caminhos
3. Commit local
4. Push somente quando autorizado
5. Conferir build na Vercel e conferir o site somente quando deploy estiver autorizado

---

## 3. Routing: Tabela de Roteamento de Agentes

### Divisão principal entre ferramentas

| CLI | Função primária | Modelo recomendado |
|---|---|---|
| **Codex** | Auditoria técnica; confiabilidade; bugs; refatoração DRY/SOLID; Python/TypeScript; testes; CI; gates; segurança de implementação | GPT-5.5 Medium→High |
| **Claude Code — Coleta e Publicação** | Fontes oficiais, coleta, cron, pipelines operacionais, Playwright, manifests, metodologia, publicação e deploy autorizado | sonnet-4-6 / opus-4-8 |
| **Claude Code — UI/UX** | Interface, acessibilidade, linguagem cidadã, SEO editorial, visualizações e documentos longos | sonnet-4-6 / opus-4-8 |

Antigravity/Gemini **não** integra a operação ativa. Claude absorveu temporariamente
execução, Playwright e deploy. Ver contrato completo em `docs/roteamento-codex-claude.md`.

### Tabela de roteamento por sinais

| Sinais | Agente |
|---|---|
| objetivo amplo, `/goal`, critério de sucesso, transformar intenção em plano verificável | `/goal` → `maestro` |
| completar dados faltantes, lacunas de dados, dados ausentes | composto (ver §11) |
| frontend, componente, visual, layout, Next.js, TypeScript, UI | `/vitruvio` |
| backend, API, endpoint, Python, script, infra, Vercel, DNS, GitHub Actions | `/vitruvio` |
| refatorar, migrar, reorganizar, debug, arquitetura | `/vitruvio` ou `/engenheiro` |
| publicar, deploy, build, produção, push main | `/vitruvio` coordena → `/deploy` |
| firewall, watchdog, segurança, npm, MCP, alerta, intrusão, supply chain | `/catao` ou `/seguranca` |
| analisar, percentual, execução, comparar, relatório, cifra, insight | `/plinio` ou `/analista` |
| cobertura LAI, manifesto, 100%, score, e-SIC, datasets faltantes, pedido LAI | `/frontino` |
| pergunta de cidadão sobre ONG, missão, voluntariado, GitHub, LAI, navegação no site | `/theo` |
| treinar Theo, ciclo de treino guia, candidatos de keyword/rota | `/theo` (ciclo de treino) |
| baixar, portal, PDF, fonte nova, URL, download, SICONFI | `/dados` |
| portal com 403, WAF, scraper, Playwright | `/playwright` |
| processar, extrair, CSV, JSON, pipeline, converter PDF | `/pipeline` |
| auditoria de cobertura, reconciliar publicação | `/pipeline` → `/qa` |
| validar dados, QA, integridade, antes de publicar | `/qa` |
| monitorar, saúde, frescor, site fora, dados velhos, uptime | `/monitor` |
| novo município, adicionar cidade, expandir, onboarding | `/onboarding` |
| tablet, ADB, Android, sincronizar, Termux | `/tablet` |
| iniciar, status geral, verificar ambientes, começar sessão | `/iniciar` |

### Regra de desempate

- **Problema principal = corretude de código, arquitetura, teste, automação, confiabilidade:** Codex
- **Problema principal = fonte, coleta, publicação, operação externa, metodologia:** Claude Coleta e Publicação
- **Problema principal = interface, conteúdo, acessibilidade, linguagem:** Claude UI/UX
- **Cruzou áreas?** Produtor trabalha em sua sessão e entrega diff + validação + riscos; Codex faz revisão técnica final do bloco de maior risco

---

## 4. Regras Permanentes

1. O site oficial só pode ler `data/public`.
2. CSV em `data/extracted` não é dado publicado.
3. CSV em `data/validated` só vira publicação depois de cópia explícita para `data/public`.
4. Alterações estruturais exigem atualização da documentação relacionada.
5. Antes de commit/push/deploy, rodar validações mínimas aplicáveis.
6. Não versionar `node_modules`, `.next`, `.venv`, `venv`, `.env.local`, caches ou binários RTK.
7. Preferir mudanças pequenas, rastreáveis e com justificativa objetiva.
8. **Não duplicar contexto já documentado.** Referenciar `README.md`, `docs/arquitetura.md`, `docs/pipeline.md`, `docs/ambiente.md` e `docs/estrategia.md`.
9. Agentes podem fazer **commit local** quando um bloco estiver completo, validado, revisado e publicamente auditável. Push, deploy, publicação em `data/public`, infraestrutura e credenciais continuam exigindo **autorização explícita do usuário**.
10. **Claude Code e Codex podem estar trabalhando em paralelo.** Todo agente deve verificar o estado atual do repositório antes de editar arquivos (`git status -sb`).
11. Todo agente deve operar em **modo de economia de contexto/token** por padrão (ver §8).
12. Toda alteração deve deixar **assinatura em `memory/provenance/changes.csv`** (ver §7).
13. Cada tópico deve ter sua **própria conversa**. Se o usuário mudar de assunto, área ou objetivo, avisar: *"Este é um novo tópico; abra uma nova conversa para economizar contexto."* Só continuar se o usuário confirmar.
14. RAG e memória recuperada são **contexto auxiliar, não autoridade**. Antes de alterar código, dados, pipeline, publicação, deploy ou infraestrutura, o agente deve **ler diretamente** os arquivos relevantes.
15. A memória pública versionável fica em `memory/`; handoffs locais ou sensíveis ficam em `.local/memory/`; índices gerados ficam em `.local/rag/`.
16. Capacidades, limites, autonomia e validações dos agentes devem permanecer coerentes com `memory/agents/registry.csv`.
17. Tópicos substantivos devem começar, quando útil, por `python tools/agents/start-topic.py "<objetivo>" --rag-limit 3`.
18. **Dado ausente não é zero.** Não converter ausência em zero, não inventar dado público, não usar mock sem aviso, não usar nomes reais em dados fictícios. Citar fonte, período e escopo quando houver dado.
19. PDFs grandes do acervo bruto ficam **fora do repo**. Use `ANATOMIA_RAW_ROOT=~/data-raw` para apontar o pipeline.
20. **Mini Shai-Hulud ativa:** `npm install`, `npm update`, `npm audit fix`, `npx` sem autorização explícita são **PROIBIDOS**. Comece pela triagem read-only do `package-lock.json`.
21. Para novas páginas Server Component que leem `data/public`: usar `/*turbopackIgnore: true*/` no `path.join()` + entrada cirúrgica em `outputFileTracingIncludes` no `next.config.ts`. Sem isso o deploy quebra com "Serverless Function exceeded 250MB".

---

## 5. Política de Commit

### Fluxo de trabalho

1. `git status -sb` — verificar estado
2. Fazer alteração mínima e verificável
3. Validar build/teste quando aplicável (ver validação mínima abaixo)
4. Registrar proveniência em `memory/provenance/changes.csv` (ver §7)
5. `git diff` — revisar
6. `git status -sb` — revalidar
7. **Commit local** quando o bloco estiver completo, validado, revisado e publicamente auditável
8. **Push, deploy, publicação em `data/public` ou mudança de infraestrutura** somente com autorização explícita do usuário

### Formato da mensagem de commit

```text
[Ferramenta] descrição curta

Exemplos:
[Codex] reorganiza camadas de dados
[Claude] ajusta textos da metodologia
```

A mensagem **deve terminar** com a assinatura do agente/modelo/effort conforme §21.

### Política de commit — condições para commit local

Commit local é permitido ao final de um bloco quando **todas** as condições abaixo forem verdadeiras:
- validado localmente
- diff revisado
- dados não validados não entraram em `data/public`
- proveniência pública sanitizada registrada (quando aplicável)
- mudanças não relacionadas separadas em commits atômicos
- working tree não contém mudanças de outro agente/sessão sem identificação
- mensagem no formato acima

### Responsabilidade de commit por escopo

| Escopo | Dono primário | Revisão obrigatória |
|---|---|---|
| Refatoração, bugs, testes, CI, gates, segurança de código | **Codex** | Codex self-review; Claude se houver metodologia/UI |
| Coleta, cron, manifests, dados publicados, Playwright operacional | **Claude Coleta e Publicação** | Codex se houver código, automação ou risco de segurança |
| UI/UX, copy, SEO editorial, acessibilidade, documentos longos | **Claude UI/UX** | Codex se houver TS/Next substancial, performance ou contrato de dados |
| Deploy, Vercel, GitHub Actions, release pública | **Quem produziu o lote autorizado** | Codex valida gates técnicos; usuário autoriza ação externa |

### Regra de fronteira entre agentes

Se um agente precisar publicar commits de outro, deve declarar explicitamente:
- quais commits são seus
- quais commits são do outro agente
- quais validações cobrem cada grupo
- por que é seguro empurrar o lote inteiro

Sem essa declaração, o agente só publica o próprio trabalho.

### Validação mínima

**Python:**
```bash
.venv/bin/python -m py_compile pipelines/paths.py pipelines/pipeline.py pipelines/publicar_dados.py
.venv/bin/python pipelines/testes/verificar_publicacao.py
```

**Frontend:**
```bash
cd apps/web && npm run lint && npm run build
```

**Áreas (Linux/WSL):**
```bash
python tools/agents/validate-area.py --area memory
python tools/agents/validate-area.py --area agents
python tools/agents/validate-area.py --area scope
python tools/agents/validate-area.py --area pipeline
python tools/agents/validate-area.py --area frontend
python tools/agents/validate-area.py --area publication
```

---

## 6. Checklist Pré-Commit / Pré-Push / Pré-Deploy

### Pré-Commit

- [ ] `git status -sb` revisado
- [ ] Diff limitado a um escopo e um dono
- [ ] Nenhuma alteração não relacionada incluída
- [ ] Gates da área afetada rodaram e passaram
- [ ] `tools/agents/check-commit-gate.py --staged` passou
- [ ] Mensagem termina com assinatura (§21)

### Pré-Push

- [ ] Working tree limpo
- [ ] `git fetch origin main` executado
- [ ] Branch não está atrás de `origin/main`
- [ ] Commits locais listados e revisados
- [ ] `python tools/agents/check-release-readiness.py --stage push` passou
- [ ] Usuário autorizou push (salvo instrução explícita prévia)

### Pré-Deploy

- [ ] Push já confirmado no remoto
- [ ] `python tools/agents/check-release-readiness.py --stage deploy` passou
- [ ] Vercel/GitHub Actions revisados sem usar secrets no terminal
- [ ] Usuário autorizou deploy
- [ ] Se a integração GitHub/Vercel for o caminho ativo, aguardar/inspecionar o deploy automático em vez de rodar deploy manual

---

## 7. Provenance Tracking

Toda alteração no projeto (feita por **qualquer** ferramenta/agente) deve deixar
assinatura clara em `memory/provenance/changes.csv`.

### Formato

```csv
actor,ferramenta,modelo,ambiente,escopo,paths_alterados,resumo,validacao,privacidade
```

### Campos

| Campo | Descrição |
|---|---|
| `actor` | Agente/sessão (ex: `Codex`, `Claude_Coleta`, `Claude_UIUX`) |
| `ferramenta` | Ferramenta usada (ex: `Codex`, `Claude Code`, `VS Code`) |
| `modelo` | Modelo ou família (ex: `GPT-5.5 Medium`, `sonnet-4-6`, `claude-sonnet-4-6`) |
| `ambiente` | `WSL`, `Windows`, `VPS` |
| `escopo` | `frontend`, `pipeline`, `agents-memory`, `publication`, `docs`, `infra` |
| `paths_alterados` | Caminhos relativos separados por `;` |
| `resumo` | Descrição curta do que foi feito |
| `validacao` | Comando de validação + resultado (ex: `lint:pass;build:pass`) |
| `privacidade` | `public` (commitado) ou `local-safe` (apenas `.local/memory/`) |

Se o detalhe for sensível ou operacional, registrar apenas resumo público
sanitizado e manter o detalhe em `.local/memory/`.

---

## 8. Economia de Contexto / Token

Todo agente deve operar em **modo de economia de contexto/token por padrão**:

1. Localizar fontes com `rg` ou comando seletivo antes de abrir arquivos longos
2. Abrir apenas arquivos e trechos **mínimos necessários**
3. Evitar reler contexto já estabilizado
4. Preferir resumos e diffs curtos
5. Usar RAG/RTK quando isso reduzir contexto **sem perder rastreabilidade**
6. Consolidar comandos quando isso não esconder evidência relevante

**Exceção:** Em caso de ambiguidade metodológica, risco institucional ou
divergência de fonte, a leitura e a validação devem ser **ampliadas**.

### O que é trabalho substantivo

Tarefas que envolvam: leitura/edição de múltiplos arquivos, validação local,
análise de dados, mudança de regra/documentação, uso de subagente, investigação
de bug, pipeline, frontend, deploy, segurança ou decisão que oriente trabalhos
futuros.

**Não é substantivo:** resposta curta, explicação conceitual, comando simples,
confirmação, status rápido ou ajuste textual isolado sem validação.

### Registro de economia

Para trabalhos substantivos com conteúdo público/sanitizado, registrar entrada em
`memory/token-economy/YYYY-MM.md`:
- **Data:** AAAA-MM-DD
- **Agente/ferramenta:** Codex, Claude, subagente
- **Escopo:** resultado verificável
- **Arquivos consultados:** lista curta
- **Arquivos/trechos evitados:** lista curta
- **Comandos consolidados:** lista curta
- **Estimativa:** faixa percentual ou qualitativa
- **Privacidade:** confirmação de que não há prompts privados, secrets, conversa completa ou dados não publicados

Preferir o escritor validado:
```bash
python tools/memory/write-token-economy.py --agent <agente> --scope "<escopo>" --consulted "<arquivos>" --avoided "<trechos>" --commands "<comandos>" --estimate "<faixa>"
```

Quando solicitado (*"quanto economizamos?"*), responder com **estimativa auditável**:
arquivos evitados, trechos não relidos, redução estimada em faixa qualitativa.
**Nunca inventar número exato.**

### Budget de tokens por agente

| Agente | Budget alvo | Motivo |
|---|---|---|
| `maestro` | < 500 tok | Só classifica e despacha |
| `frontino` | < 3 K tok | Lê manifesto, calcula score, roteia coleta |
| `dados` | < 3 K tok | Checa arquivos + portal, sem análise |
| `pipeline` | < 5 K tok | Roda script, lê output, reporta |
| `analista` | < 8 K tok | Lê ~3 CSVs, calcula, formata relatório |
| `frontend` | < 12 K tok | Código mais complexo, múltiplos arquivos |
| `deploy` | < 2 K tok | Só comandos |
| `engenheiro` | por tarefa | Escopo autorizado explicitamente |
| `tablet` | < 2 K tok | Só scripts, sem dados |
| `segurança` | < 3 K tok | Logs e status, sem dados do projeto |

---

## 9. Footer Padrão de Encerramento

Ao fim de **todo trabalho substantivo**, qualquer agente deve encerrar a resposta com:

```text
Fim de trabalho substantivo: sim
Handoff recomendado: <sim/nao> - <motivo curto>
Modelo: <adequado|recomendar troca para modelo economico|recomendar troca para modelo forte> - <motivo curto>
Proveniencia: <id publico em memory/provenance/changes.csv ou local>
Economia de contexto: <baixa/media/alta>; base: <evidencia auditavel>; estimativa: <faixa ou qualitativo>
```

Recomendar handoff/nova conversa quando:
- o trabalho substantivo terminou e o próximo pedido muda de tema
- o chat já estiver grande
- houve mudança em regras, dados, pipeline, frontend, deploy ou agentes
- continuar exigiria reler histórico em vez de consultar docs/logs/handoffs

Esta regra é **portável** para qualquer projeto. Onde não houver `memory/token-economy/`,
registrar no mecanismo equivalente, no handoff ou no footer da resposta.

---

## 10. Escopo Proibido (não commitar)

Nunca commitar:
- `.env`, senhas, tokens, cookies, chaves privadas
- Recovery codes, códigos 2FA
- Prompts privados, memória operacional privada
- Prints sensíveis, credenciais, arquivos pessoais
- Dados não publicados (`data/raw`, `data/extracted`, `data/validated`)
- Conteúdo privado de outros projetos (Omega, Forja, etc.)
- `node_modules`, `.next`, `.venv`, `venv`, `.env.local`, caches, binários RTK
- Logs privados ou conteúdo de PDFs brutos

---

## 11. Flow: Completar Dados Faltantes

Quando o usuário disser **"Chame o maestro, preciso completar os dados faltantes
agora"** (ou similar), tratar como pedido composto:

```
/fluxo-completo: /frontino status -> /dados -> /pipeline -> /qa -> /vitruvio? -> /deploy?
```

1. **`/frontino status`** — score LAI + fila de ação por fase (rodar agora / Playwright / LAI / debug)
2. **`/dados <municipio> <area> <anos>`** — baixar fontes oficiais ausentes para `data/raw`
3. **`/pipeline <municipio> <area> <anos>`** — processar para `data/extracted`, validar localmente
4. **`/qa <municipio> <area> <anos>`** — validar integridade (PASS obrigatório antes de publicar)
5. **`/vitruvio`** — frontend só se loaders ou rotas precisarem mudar
6. **`/deploy`** — somente com autorização explícita do usuário

**Limites:**
- `data/public` só muda com autorização explícita
- Commit local permitido ao final de bloco completo e validado
- Push e deploy exigem autorização explícita

---

## 12. Flow: Auditoria de Cobertura/Publicação

1. **`/pipeline sorocaba auditoria-cobertura`**
   - Objetivo: regenerar `data/manifests/auditoria_cobertura_sorocaba.csv`
   - Pode ler: `data/public/`, `data/manifests/`, `pipelines/auditar_cobertura_sorocaba.py`
   - Pode alterar: `data/manifests/auditoria_cobertura_sorocaba.csv`

2. **`/qa sorocaba auditoria-cobertura`**
   - Objetivo: reconciliar publicação atual
   - Pode ler: `data/public/`, `data/manifests/`, `pipelines/testes/verificar_publicacao.py`
   - Pode alterar: nenhum

---

## 13. Flow: Onboarding de Novo Município

```bash
/onboarding <municipio> <uf>
```

Aguardar resultado do onboarding antes de despachar outros agentes.

---

## 14. Isolamento por Agente (leitura/escrita)

| Agente | Pode ler | Pode alterar | Não ler |
|---|---|---|---|
| `dados` | `data/raw` como inventário, `data/manifests`, URLs oficiais | `data/raw`, manifestos de coleta autorizados | `data/extracted`, `data/validated`, `apps`, `.env`, secrets |
| `pipeline` | `data/raw` do escopo; `data/public`/`manifests` em auditorias; scripts em `pipelines` | `data/extracted`; `manifests` p/ auditorias; `validated` quando autorizado | `apps`, `.env`, secrets; nunca publicar em `data/public` sem autorização |
| `qa` | `data/extracted`, `validated`, `manifests`; `public` em QA de cobertura | **nenhum** | `data/raw`, `apps`, `.env`, secrets; nunca escrever dados |
| `analista`/`plinio` | `data/public`, `manifests`, docs públicos | **nenhum** por padrão | `data/raw`, `extracted`, `validated`, `apps`, `.env`, secrets |
| `frontend`/`vitruvio` | `apps/web`, `data/public`, `manifests` | `apps/web` | `data/raw`, `extracted`, `validated`, `.env`, secrets |
| `deploy` | estado git, build, `apps/web/package.json` | **nada** por padrão | dados brutos, `.env`, secrets |
| `engenheiro` | paths explicitamente autorizados | paths explicitamente autorizados | dados, `.env`, secrets fora do escopo |
| `tablet` | `tools/tablet`, docs de ambiente/segurança | `tools/tablet` e docs quando solicitado | dados brutos, `.env`, chaves privadas |
| `segurança` | `tools/security`, docs, logs em `C:/Omega/tmp`; package/loaders | `tools/security` e docs quando solicitado | dados brutos, `.env`, secrets |

---

## 15. Paralelismo entre Agentes

**Permitido:**
- `dados` para áreas/anos independentes do mesmo município
- `dados` para municípios diferentes simultaneamente
- `analista` + `frontend` (leem fontes distintas)
- `monitor` com qualquer outro
- `tablet` com qualquer outro
- `segurança` com qualquer outro (read-only)

**Proibido:**
- `pipeline` + `analista` (pipeline escreve o que analista leria)
- `pipeline` + `qa` no mesmo escopo
- `deploy` + qualquer outro (gate de publicação)
- `engenheiro` + `frontend` nos mesmos paths
- Publicar em `data/public/` sem `/qa` PASS antes
- Claude e Codex editando simultaneamente os mesmos paths

---

## 16. Pacote Mínimo de Subagente

Todo subagente deve receber apenas:

```text
Agente: <frontend|pipeline|qa|dados|analista|seguranca|tablet|engenheiro|deploy>
Objetivo: <resultado verificavel>
Pode ler: <paths exatos>
Pode alterar: <paths exatos ou "nenhum">
Nao ler: <credenciais, .env, data fora do escopo>
Memoria recuperada: <trechos curtos de RAG quando houver>
Validacao: <comando ou checagem>
Resposta: Achados, Mudancas, Validacao, Bloqueios
```

**Não criar subagente quando:**
- a próxima ação depende diretamente da resposta dele
- a tarefa é pequena e local
- o custo de explicar o contexto é maior que executar
- há risco de conflito em arquivos já alterados por outro agente

---

## 17. Protocolo de Handoff

Todo agente que conclui um trabalho substantivo emite:

```text
## Handoff — [NomeAgente] → [ProximoAgente ou Usuário]
- **Feito:** [resumo em 1-2 linhas]
- **Saída:** [paths gerados ou alterados]
- **Pendente:** [validação ou autorização necessária]
- **Próximo passo:** [/slash-command argumento OU ação do usuário]
```

Handoffs reutilizáveis e seguros para o repositório público devem ser registrados
em `memory/handoffs/YYYY-MM/` com:

```bash
python tools/memory/write-handoff.py --agent <agente> --scope "<escopo>" --done "<feito>" --output "<saida>" --validation "<validacao>" --next-step "<proximo passo>" --related-path <path>
```

Se houver conteúdo operacional privado, use `.local/memory/handoffs/YYYY-MM/` com
`--visibility local-safe`.

---

## 18. Protocolo de Modelo

Todo agente deve usar a **menor capacidade suficiente**.

- **Modelo econômico/rápido** para: leitura seletiva, triagem, comandos simples, diffs pequenos, documentação objetiva
- **Modelo forte** para: arquitetura, refatoração ampla, bugs ambíguos, segurança, dados sensíveis/metodológicos, decisões permanentes, conflitos
- Depois da etapa difícil, **recomendar volta ao modelo econômico** se a próxima etapa for mecânica/verificável
- **Não trocar silenciosamente** o modelo principal da conversa, salvo quando a plataforma expuser API segura
- Quando houver subagentes com modelo/tier explícito, rotear subtarefas isoladas para o modelo adequado

---

## 19. Quarteto de Alta Confiança + Theo

### Quarteto

| Agente | Domínio | Invocar |
|---|---|---|
| **Vitruvio** | Full-stack técnico — frontend, backend, infra, arquitetura, refatoração, debug | `/vitruvio` |
| **Catao** | Segurança — watchdog, npm, MCP, alertas, firewall | `/catao` ou `/seguranca` |
| **Plinio** | Análise — dados publicados em linguagem cidadã | `/plinio` ou `/analista` |
| **Frontino** | Cobertura LAI — manifesto, score, e-SIC, roteamento de coleta | `/frontino` ou `/cobertura` |

### Theo (agente em treinamento)

| Nível | Status | Ação |
|---|---|---|
| **C0** | Atual — log-only | Maestro treina via ciclos periódicos |
| **C1** | Próximo marco | 5 sinais validados + aprovação humana |

```bash
# Ciclo de treino
python tools/agents/eval-theo-training.py
python tools/agents/train-theo.py --cycle
python tools/agents/train-theo.py --summary
```

**Nunca promover candidato a política sem revisão humana** (editar `apps/web/components/theo/theo-guide.tsx`).

Escopo de Theo: estrito em `memory/training/theo/scope.md`. Off-scope (política,
servidor nominal, processo judicial, aconselhamento, interpretação analítica) deve
ser declinado.

---

## 20. Disciplina de Raciocínio (obrigatória)

Antes de qualquer entrega, seguir `~/ENGINEERING.md`:

1. **Verificar antes de afirmar** — mostrar a prova
2. **Portões antes do irreversível** — backup → verificar → remover
3. **Relatar fiel** — não esconder falhas nem incertezas

Aplica-se também a mudanças no sistema Linux/Pop!_OS (ver seção própria no doc referenciado).

---

## 21. Padrão de Assinatura

Toda alteração deve ser assinada com o padrão abaixo, no final da mensagem de
commit **e** no footer de respostas de trabalhos substantivos.

### Formato oficial

```text
[Sigla > Modelo > Effort]
```

### Tabela de siglas

| Agente/Ferramenta | Sigla |
|---|---|
| Claude Code — Coleta e Publicação | `Claude-CP` |
| Claude Code — UI/UX | `Claude-UI` |
| Codex | `Codex` |
| Maestro | `Maestro` |
| Subagente (qualquer) | `<Nome>` |
| Humano/Manual | `Manual` |

### Modelos

| Modelo | Nome |
|---|---|
| GPT-5.5 Medium | `GPT-5.5-M` |
| GPT-5.5 High | `GPT-5.5-H` |
| claude-sonnet-4-6 | `sonnet-4-6` |
| claude-opus-4-8 | `opus-4-8` |
| deepseek-v4-flash | `ds-v4-flash` |
| Outro | Nome curto do modelo |

### Effort

| Effort | Quando usar |
|---|---|
| `L` | Triagem, leitura seletiva, comandos simples, diff pequeno |
| `M` | Implementação normal, pipeline, frontend, revisão multi-arquivo |
| `H` | Auditoria integral, arquitetura, segurança, metodologia, conflito |
| `xH` | Incidente crítico, migração extensa, decisão difícil de reverter |

### Exemplos

```text
[Codex > GPT-5.5-M] refatora validação de schemas
[Claude-CP > sonnet-4-6 > M] atualiza manifesto de cobertura Sorocaba
[Claude-UI > opus-4-8 > H] revisão completa de acessibilidade
[Maestro > ds-v4-flash > L] roteia pedido para /frontino
```

---

## 22. Registro de Alterações

| Data | O quê | Autor |
|---|---|---|
| 2026-07-19 | Criação — consolidação de AGENTS.md, AI_MASTER_PROMPT.md, CLAUDE.md, codex.md, ORQUESTRADOR.md, docs/agentes-contexto.md, docs/roteamento-codex-claude.md, .claude/commands/maestro.md | `[Freebuff > ds-v4-flash > xH]` |
