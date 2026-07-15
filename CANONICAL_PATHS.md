# CANONICAL_PATHS — Anatomia do Gasto

Mapa de localização do repositório público Anatomia do Gasto. Regras de
segurança e atuação permanecem em `AGENTS.md`, `AI_MASTER_PROMPT.md` e nos
demais contratos de agentes.

## Raiz e classificação

- Raiz canônica neste computador:
  `$HOME/Documentos/Projects/anatomia-do-gasto`
- Classificação: repositório público.
- Clones fora de `~/Documentos/Projects/` não são fonte de verdade neste computador.
- Conteúdo privado do Omega, da Forja ou de outros projetos nunca entra aqui.

## Controle do trabalho

| Artefato | Caminho | Função |
|---|---|---|
| Estado atual | `STATUS.md` | Fatos atuais, progresso e bloqueios |
| Fila aprovada | `TASKS.md` | Trabalho priorizado e executável |
| Ideias | `IDEAS.md` | Propostas ainda não aprovadas |
| Decisões | `DECISIONS.md` | Escolhas técnicas, metodológicas e editoriais duráveis |
| Estratégia | `docs/roadmap.md` | Fases e objetivos de médio/longo prazo |
| Auditorias | `docs/auditoria/` | Relatórios públicos e sanitizados |

Regras:

- Ideia não deve entrar diretamente em `TASKS.md`.
- Handoff não é fila de tarefas.
- `STATUS.md` registra estado, não intenção.
- Itens concluídos podem permanecer no histórico de `TASKS.md`, mas devem ser
  marcados e retirados da fila ativa.

## Handoffs e memória

| Classe | Caminho | Versionamento |
|---|---|---|
| Handoff público sanitizado | `memory/handoffs/YYYY-MM/` | Sim |
| Handoff local/operacional | `.local/memory/handoffs/YYYY-MM/` | Não |
| Proveniência pública | `memory/provenance/changes.csv` | Sim |
| Economia de tokens | `memory/token-economy/YYYY-MM.md` | Sim, sanitizada |
| Conhecimento reutilizável | `memory/knowledge/` | Sim, sanitizado |
| Índice RAG local | `.local/rag/` | Não |

Handoffs públicos devem ser criados por:

```bash
.venv/bin/python tools/memory/write-handoff.py \
  --agent "<agente>" \
  --scope "<escopo>" \
  --done "<feito>" \
  --output "<saída>" \
  --validation "<validação>" \
  --next-step "<próximo passo>" \
  --related-path "<path>"
```

Use `--visibility local-safe` quando houver detalhe operacional não publicável.

## Código

| Finalidade | Caminho |
|---|---|
| Aplicação web | `apps/web/` |
| Rotas Next.js | `apps/web/app/` |
| Componentes | `apps/web/components/` |
| Bibliotecas do frontend | `apps/web/lib/` |
| Pipelines de coleta e transformação | `pipelines/` |
| Testes de pipeline | `pipelines/testes/` |
| Ferramentas de agentes | `tools/agents/` |
| Gates | `tools/gates/` |
| QA e consolidação | `tools/data/`, `tools/qa/` |
| Scripts operacionais | `scripts/` |

## Dados

| Camada | Caminho | Regra |
|---|---|---|
| Bruto | `data/raw/` | Local, não versionado |
| Extraído | `data/extracted/` | Local, não publicado |
| Validado | `data/validated/` | Local, ainda não público |
| Público | `data/public/` | Única camada consumível pelo site |
| Manifestos | `data/manifests/` | Contratos, inventários, status e QA |

`data/extracted` não pode ser promovido a `data/public` apenas porque a fonte
respondeu com sucesso. Publicação exige os gates definidos pelo projeto.

## Documentação e contratos

| Finalidade | Caminho |
|---|---|
| Entrada pública | `README.md` |
| Contribuição | `CONTRIBUTING.md` |
| Onboarding técnico | `docs/onboarding-dev.md` |
| Política de publicação | `docs/politica-publicacao-dados.md` |
| Revisão por pares | `docs/revisao-pares-github.md` |
| Contexto de agentes | `docs/agentes-contexto.md` |
| Roteamento Codex/Claude | `docs/roteamento-codex-claude.md` |
| Escopo técnico e effort | `ENGINEERING_SCOPE.md` |

## Saídas locais

- Logs: `_logs/`
- Memória local: `.local/memory/`
- RAG local: `.local/rag/`
- Build Next.js: `apps/web/.next/`
- Ambiente Python: `.venv/`

Esses caminhos não são fonte pública e não devem ser commitados.

## DIRECTORY_MAP

`DIRECTORY_MAP.md` é somente o histórico de movimentações do Google Drive. O
arquivo não define caminhos canônicos do projeto e não substitui este mapa.
