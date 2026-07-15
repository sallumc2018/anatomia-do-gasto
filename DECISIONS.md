# DECISIONS — Anatomia do Gasto
> Decisões arquiteturais e editoriais que não mudam toda sessão.
> Atualizar só quando uma decisão for revisada ou nova.

## Governança documental

**Mapa e fluxo canônicos — decidido em 2026-06-25**

- `CANONICAL_PATHS.md` define localização e função dos artefatos do projeto.
- `STATUS.md` contém estado factual atual.
- `TASKS.md` contém apenas trabalho aprovado e executável.
- `IDEAS.md` contém propostas ainda não aprovadas.
- `DECISIONS.md` registra escolhas duráveis.
- `docs/roadmap.md` contém direção estratégica.
- `memory/handoffs/YYYY-MM/` transfere contexto entre sessões, mas não substitui
  status, tarefas ou decisões.
- `DIRECTORY_MAP.md` é histórico de movimentações do Google Drive, não fonte de
  caminhos operacionais.

## Site / Frontend

**Dois mapas separados**
- `/mapa-interativo` → navegação do site (áreas de dados, estrutura do conteúdo)
- `/fluxo-financeiro` → rastro do dinheiro público (Sankey: fontes → município → gastos)
- Razão: o mapa de navegação não conta a história do dinheiro; o fluxo não é um sitemap.

**Hierarquia nacional no mapa**
- Brasil → Estado → Município só entra no `/mapa-interativo` quando houver >1 município publicado.
- Hoje: Sorocaba como raiz (correto). Paulínia "em breve" só no `/fluxo-financeiro`.

**URLs planas por enquanto**
- Rotas: `/sorocaba/saude`, `/sorocaba/educacao` etc. (não `/sp/sorocaba/saude`)
- Migrar para URLs nacionais (`/uf/municipio/area`) só quando >1 município live.

**Deploy**
- Sempre via `vercel deploy --prod --yes` da raiz do repo.
- Integração GitHub → Vercel está desativada (cancela deploys automaticamente).

## Dados

**Fonte canônica**
- RREO/SICONFI para receita e despesa por função (Tesouro Nacional)
- Valores no Sankey em R$ milhões, receita escalada proporcionalmente ao liquidado.

**Política de publicação**
- `publicavel` → exibe livremente
- `publicavel_com_cautela` → agrega, sem perfil individual
- `nao_destacar_na_ui` → presente nos dados, fora do destaque visual

**Subvenções OSC**
- `subvencoes_por_entidade_sorocaba.csv` armazena valores em centavos → dividir por 100 para exibir.

**TCE granular × SICONFI — qual é o agregado oficial (decidido 2026-06-01, Opus)**
- **O agregado público (totais de despesa/receita) vem do SICONFI** (RREO, fonte fechada e auditável do Tesouro), em TODOS os anos.
- **O TCE-SP transparência granular é para drill-down** (detalhe por órgão/fornecedor/empenho), não para o total de capa.
- Razão: QA de Paulínia (2026-06-01) cruzou as duas fontes — 5 de 6 anos batem ao centavo; **2022 diverge R$ 7,2M (~0,4%), divergência REAL entre as fontes, não bug nosso** (verificado: 0 duplicatas no TCE, Câmara idêntica nas duas, a diferença está no bloco Prefeitura+RPPS). SICONFI é o número defensável publicamente.
- **Exigência de publicação:** onde se exibir total de 2022, incluir **nota metodológica** de que o somatório do TCE granular é ~0,4% maior que o RREO/SICONFI. Vale como padrão para qualquer município com a mesma dupla de fontes.

## Ecossistema / IAs

**Multi-agente**
- Claude (este chat e outros) + Codex + Gemini rodam em paralelo no mesmo repo.
- Barramento: filesystem + git. Cada agente assina ao final da mensagem. Handoffs via `memory/handoffs/`.
- **OBRIGATÓRIO: todo commit DEVE terminar com a assinatura `[CLI > Modelo > Esforço]`** (ex.: `[Claude Code > claude-opus-4-8 > High]`, `[Codex > GPT-5.5 > High]`, `[Antigravity > Gemini 3.5 Flash > Low]`). O `git author` é sempre `NeoLogos` (identidade git = usuário), então a assinatura da mensagem é a ÚNICA forma de atribuir autoria entre agentes. Reforçado em 30/mai/2026: 5 commits Claude ficaram sem atribuição no branch `institutional-audit`, impossibilitando rastreio por `git log` — exigiu mapa manual. Sem assinatura = autoria ambígua = retrabalho. **(Substitui a convenção anterior `[Claude]`/`[Codex]` no início do subject: a assinatura agora vai no fim/corpo, válida para todos os agentes.)**
- Enforçado pelo hook `commit-msg` em `.husky/` (+ `commitlint` para o formato conventional). Ativar uma vez por clone: `git config core.hooksPath .husky` (ou `sh tools/setup-hooks.sh`).

**Modelos (economia) — REGRA DO PORTÃO**
- **Nada vai para `data/public` sem validação em sessão Opus** (cruzar cada número com a fonte oficial). Sessões Sonnet/extração escrevem SÓ em `data/raw` e `data/extracted`; não publicam nem flipam status de dataset.
- **Sonnet** = coleta e extração mecânica de padrão conhecido (download, pdfplumber, API). **Opus** = portão de validação (`extracted → validated → public`), reconciliação entre fontes, julgamento (privacidade/LGPD, definições), texto público (rege-se pelo Protocolo NeoLogos — CER) e coordenação multi-agente.
- Motivo: a credibilidade depende de número 100% conferível — erro que chega em `data/public` vira público. Coleta é reversível; publicação não.
- Troca de modelo = **nova sessão** (nunca mid-session), abrindo já no modelo certo com resumo do alvo.

**npm**
- Nunca rodar `npm install / update / audit fix`. Worm ativo (mai/2026).
- Pacotes auditados limpos: `context7@2.3.0`, `sequential-thinking`.

**Python no Windows**
- Usar `py script.py` (Python Launcher). `python` também funciona nesta máquina.
- Evitar `python3` (convenção Linux, não resolve no Windows por padrão).

**Segundo município**
- Paulínia/SP: "cidade rica que gasta mal". Contas 2020 rejeitadas pelo TCE-SP.
- Executar coleta só após consolidar Sorocaba completamente.
