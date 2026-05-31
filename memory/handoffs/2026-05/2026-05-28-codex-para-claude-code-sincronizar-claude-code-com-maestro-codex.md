---
id: 2026-05-28-codex-para-claude-code-sincronizar-claude-code-com-maestro-codex
date: 2026-05-28
agent: Codex para Claude Code
status: active
visibility: public
---

# Handoff - Codex para Claude Code

- Scope: sincronizar Claude Code com Maestro Codex
- Done: Consolidado o estado operacional que Claude precisa receber para trabalhar no mesmo nivel de contexto que Codex e Maestro, incluindo regras canonicas, arquivo oficial de tarefas, estado atual do working tree e limites de publicacao.
- Output: Handoff publico sanitizado para Claude Code consultar antes de novas edicoes no repositorio oficial.
- Validation: git status -sb consultado; AI_MASTER_PROMPT.md CODEX.md CLAUDE.md ORQUESTRADOR.md tasks.txt e task.md consultados seletivamente; git ls-files confirmou tasks.txt como arquivo versionado oficial.
- Blockers: Working tree contem alteracoes locais em apps/web e arquivos novos; Claude deve revisar timestamps e git status antes de escrever. Commit push deploy e copia para data/public exigem autorizacao explicita.
- Next step: Claude deve abrir este handoff, ler AI_MASTER_PROMPT.md CODEX.md CLAUDE.md ORQUESTRADOR.md e tasks.txt, depois trabalhar com pacote minimo e registrar proveniencia/economia se alterar arquivos.
- Related paths: AI_MASTER_PROMPT.md, CODEX.md, CLAUDE.md, ORQUESTRADOR.md, tasks.txt, memory/agents/registry.csv, memory/provenance/changes.csv, memory/token-economy/2026-05.md

## Mensagem curta para Claude

Claude, este repositorio tem coordencao ativa entre Maestro, Codex, Antigravity/Gemini e Claude Code. Trabalhe como agente do projeto, nao como editor isolado.

Antes de qualquer escrita:

1. Rode `git status -sb`.
2. Leia `AI_MASTER_PROMPT.md`, `CODEX.md`, `CLAUDE.md`, `ORQUESTRADOR.md` e `tasks.txt`.
3. Se o trabalho for substantivo, rode `python tools/agents/start-topic.py "<objetivo>" --rag-limit 3`.
4. Verifique timestamps e arquivos modificados, porque ha alteracoes locais em paralelo.
5. Nao faca commit, push, deploy, instalacao de dependencia ou publicacao de dados sem autorizacao explicita.

## Fonte oficial de tarefas

O arquivo oficial do Anatomia do Gasto e `tasks.txt`, localizado na raiz do repositorio oficial:

`C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto\tasks.txt`

Evidencia local: `git ls-files -- tasks.txt task.md` retorna apenas `tasks.txt`.

Nao trate como oficial:

- `task.md` dentro do repositorio: arquivo local nao versionado, checklist temporario.
- `C:\Omega\tasks.txt`: notas globais/sandbox Omega.
- `C:\Omega\task.md`: checklist global Omega/Antigravity.
- `tasks.md`: nao foi encontrado.

## Regras que nao podem ser quebradas

- O site so pode ler `data/public`.
- `data/extracted` nao e publicacao.
- `data/validated` so vira publicacao apos validacao local e copia explicita para `data/public`.
- Toda publicacao de dado precisa de fonte, periodo, escopo e metodologia claros.
- Nao transformar inferencia em fato.
- Nao usar scores simulados, "A+", "98%+", "melhor que portais oficiais" ou benchmark sem evidencia medida e auditavel.
- Se alterar estrutura, caminhos, pipeline, dados, agentes, memoria ou deploy, atualize a documentacao correspondente.
- Se alterar arquivos, registre proveniencia publica sanitizada em `memory/provenance/changes.csv` quando seguro.
- Se o trabalho for substantivo, registre economia em `memory/token-economy/YYYY-MM.md` quando seguro.

## Estado recente que Codex consolidou

- Sorocaba e a referencia inicial; Paulinia deve comecar por inventario de fontes oficiais, sem copiar premissas de Sorocaba.
- Benchmark deve ser meta auditavel, nao claim publicado. Usar manifestos e medidas reais.
- Ideias de Antigravity/Gemini sao hipoteses de produto: portar seletivamente, neutralizar linguagem e rederivar valores dos dados.
- O sandbox depreciado `ong-sandbox` nao e fonte publicavel direta.
- O sandbox oficial Antigravity e `C:\Users\user\.gemini\antigravity\scratch\anatomia-do-gasto-github`.
- Antes de chamada publica de voluntariado formal, manter linguagem de "colaboracao open-source" enquanto o status institucional/CNPJ nao estiver publico no site.
- Paginas institucionais, auditoria cidada e catalogo de dados foram implementadas localmente em fluxo recente, mas o working tree ainda precisa ser revisado antes de qualquer commit.

## Working tree observado neste handoff

Branch: `codex/institutional-audit-data-catalog`.

Arquivos modificados observados:

- `apps/web/app/page.tsx`
- `apps/web/app/sorocaba/camara-municipal/page.tsx`
- `apps/web/app/sorocaba/controle-externo/page.tsx`
- `apps/web/components/layout/shell-header.tsx`
- `apps/web/components/theo/theo-guide.tsx`
- `apps/web/lib/data.ts`

Arquivos/diretorios novos observados:

- `apps/web/app/sandbox/`
- `apps/web/app/sorocaba/camara-municipal/CabinetExpensesDashboard.tsx`
- `apps/web/app/sorocaba/controle-externo/DcaCharts.tsx`
- `apps/web/app/sorocaba/transferencias/`
- `docs/campanhas/`
- `task.md`

Claude deve assumir que parte disso pode ser trabalho de outro agente. Se for editar os mesmos paths, ler o conteudo atual e timestamps antes.

## Como o Maestro deve rotear

Use `ORQUESTRADOR.md` como constituicao operacional compartilhada. Resumo:

- Objetivo amplo ou sem criterio claro: aplicar `/goal` como protocolo local antes do despacho.
- Dados faltantes: fluxo `/frontino status -> dados -> pipeline -> qa -> vitruvio? -> deploy?`.
- Frontend, Next.js, UI: `vitruvio`.
- Pipeline, extracao, CSV/JSON: `pipeline`.
- QA de dados/publicacao: `qa`.
- Analise cidadã com dados publicados: `plinio` ou `analista`.
- Seguranca/supply chain: `catao`.
- Deploy: `deploy`, sempre com autorizacao explicita.
- Refatoracao estrutural grande: `engenheiro`/Codex.

Pacote minimo para qualquer subagente:

```text
Agente:
Objetivo:
Pode ler:
Pode alterar:
Nao ler:
Memoria recuperada:
Validacao:
Resposta: Achados, Mudancas, Validacao, Bloqueios
```

## Validacoes uteis

Use as validacoes por area em vez de rodar tudo sem necessidade:

```powershell
python tools/agents/validate-area.py --area memory
python tools/agents/validate-area.py --area agents
python tools/agents/validate-area.py --area scope
python tools/agents/validate-area.py --area pipeline
python tools/agents/validate-area.py --area frontend
python tools/agents/validate-area.py --area publication
python tools/agents/validate-area.py --area review
```

Frontend, quando autorizado e relevante:

```powershell
cd apps\web
npm.cmd --script-shell cmd.exe run lint
npm.cmd --script-shell cmd.exe run build
```

Antes de instalar dependencias npm ou rodar comandos que possam disparar lifecycle hooks, ler `docs/seguranca-dependencias-npm.md`.
