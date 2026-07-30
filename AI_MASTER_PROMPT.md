# AI Master Prompt

> ⚠️ **LEIA `CONSTITUICAO.md` ANTES DE QUALQUER AÇÃO.**
> Este arquivo contém APENAS contexto específico do projeto.
> Todas as regras **compartilhadas** (regras permanentes, política de commit,
> proveniência, economia de contexto, footer, escopo proibido, flows,
> isolamento, assinatura) foram consolidadas em **`CONSTITUICAO.md`**.
>
> Leia também: `~/AGENTS.md` · `CONSTITUICAO.md` · `docs/roteamento-codex-claude.md`

---

## 1. Objetivo Do Projeto

O Anatomia do Gasto expõe, de forma clara e legível para o cidadão comum, como
o dinheiro público entra no governo e para onde ele vai depois, começando por
Saúde e Educação em Sorocaba/SP e expandindo município por município até cobrir
o Brasil.

---

## 2. Ecossistema De Trabalho

| Ambiente | Papel | Path |
|---|---|---|
| WSL/Linux | Desenvolvimento principal — Python, Node, Codex, RTK, Claude Code CLI | `/mnt/c/Omega/02_Repos/anatomia-do-gasto` |
| Windows | Operações — ADB/tablet, GUI, VS Code, Claude Code extensão | `C:/Omega/Profissional/Repositorios_Git_Projetos/anatomia-do-gasto` |
| GitHub | Fonte da verdade entre todos os ambientes | `sallumc2018/anatomia-do-gasto` |
| Vercel | Produção somente após gate explícito | Root Directory `apps/web` |
| Tablet Android | Terminal portátil — leitura de docs e dados públicos | `/sdcard/AnatomiaDrive` via ADB |

- **App web:** `apps/web`
- **Pipeline Python:** `pipelines`
- **Infra local Windows:** `C:/Omega/03_Ferramentas/infra/` (ADB, drivers USB, logs de tablet); secrets locais ficam fora do repo em `C:/Omega/Sensivel/infra/secrets/`
- **Sincronização WSL:** `tools/dev/sync-wsl-mirror.ps1`
- **Camadas de dados:**
  - `data/raw`: fontes brutas (local, não versionado)
  - `data/extracted`: extrações automáticas, não publicadas
  - `data/validated`: dados aprovados localmente, ainda não público
  - `data/public`: **única** fonte de dados do site
  - `data/manifests`: inventário e status dos datasets
- **PDFs grandes** do acervo bruto ficam fora do repo em `G:\Meu Drive\02-Profissional\03-Big-Data-Fiscal-Data\raw` (Windows) ou `ANATOMIA_RAW_ROOT=~/data-raw` (Linux)
- **RTK:** ferramenta local de economia de contexto/token em `~/bin/rtk` (WSL) / `C:/ferramentas/rtk/rtk.exe` (Windows). Registro público em `memory/token-economy/`
- **Memória/RAG:** `memory/` (pública versionável), `.local/rag/` (índices), `.local/memory/` (operacional privada)
- **Registry canônico de agentes:** `memory/agents/registry.csv`
- **Aprendizado do Maestro:** `memory/agents/maestro-learning.md` + `memory/agents/maestro-learning-log.csv`
- **Confiança do Maestro:** `memory/agents/maestro-confidence-levels.csv` + `memory/agents/maestro-confidence-state.csv`
- **Problemas e soluções:** `memory/knowledge/problems.csv` + `memory/knowledge/solutions.csv`
- **Proveniência:** `memory/provenance/changes.csv`

---

## 3. Sincronia Entre Ambientes

A fonte da verdade é o **GitHub**. Antes de deploy:

1. Validar localmente
2. Validar no WSL quando a mudança afetar build, scripts ou caminhos
3. Commit local
4. Push somente quando autorizado
5. Conferir build na Vercel e conferir o site somente quando deploy estiver autorizado

---

## 4. Estado Atual Dos Dados

- **Saúde:** 2020–2025 em `data/public`
- **Educação:** 2020–2025 em `data/public`, validada contra PDFs oficiais; 2020–2023 também em `data/extracted` como saída mecânica
- **Auditoria:** dados mock sinalizados no site como fictícios. Não publicar dados reais sem revisão explícita

---

## 5. Validação Mínima

### Python — Windows
```powershell
.\.venv\Scripts\python.exe -m py_compile pipelines\paths.py pipelines\pipeline.py pipelines\publicar_dados.py
.\.venv\Scripts\python.exe pipelines\testes\verificar_publicacao.py
```

### Python — WSL/Linux
```bash
./.venv/bin/python -m py_compile pipelines/paths.py pipelines/pipeline.py pipelines/publicar_dados.py
./.venv/bin/python pipelines/testes/verificar_publicacao.py
```

### Frontend — Windows
```powershell
cd apps\web
npm.cmd --script-shell cmd.exe run lint
npm.cmd --script-shell cmd.exe run build
```

### Frontend — WSL/Linux
```bash
cd apps/web
npm run lint
npm run build
```

### Wrappers locais
```bash
python tools/agents/validate-area.py --area memory
python tools/agents/validate-area.py --area agents
python tools/agents/validate-area.py --area scope
python tools/agents/validate-area.py --area pipeline
python tools/agents/validate-area.py --area frontend
python tools/agents/validate-area.py --area publication
```

---

## 6. Arquitetura De Agentes

O projeto usa um conjunto de agentes especializados coordenados pelo Maestro.
Consulte `CONSTITUICAO.md §3` para a tabela completa de roteamento, `CONSTITUICAO.md §14`
para isolamento de leitura/escrita, e `docs/roteamento-codex-claude.md` para a
divisão entre Claude e Codex.

### Maestro

O Maestro é aprendiz de roteamento: observa resultados, validações, correções do
usuário e reroteamentos para registrar lições candidatas. Continua dispatcher
puro: não executa trabalho dos especializados e não autoriza gates.

Analisa a intenção do pedido e roteia para o subagente mais adequado. Monta o
contexto mínimo necessário — nunca repassa secrets, dados não publicados ou
conteúdo de PDFs brutos.

### Subagentes

| Agente | Alias | Ferramenta | Ambiente | Responsabilidade |
|---|---|---|---|---|
| `maestro` | — | Claude Code | Windows / WSL | Dispatcher aprendiz |
| `goal` | `/goal` | Claude Code | Windows / WSL | Protocolo de objetivo |
| `frontino` | `/cobertura` | Claude Code | Windows | Score LAI, manifesto, coleta |
| `vitruvio` | — | Claude Code | Windows / WSL | Full-stack técnico |
| `plinio` | `/analista` | Claude Code | WSL / Windows | Análise cidadã de dados |
| `catao` | `/seguranca` | Claude Code | Windows | Watchdog de segurança |
| `dados` | — | Claude Code | WSL / Windows | Fontes oficiais brutas |
| `pipeline` | — | Claude Code | WSL (primário) | Processamento de dados |
| `qa` | — | Claude Code | WSL / Windows | Validação pré-publicação |
| `deploy` | — | Claude Code | WSL / Windows | Build e Vercel |
| `tablet` | — | Claude Code | Windows (ADB) | Tablet Android |
| `engenheiro` | — | Codex | WSL | Refatorações grandes |

### Critério De Roteamento

- **WSL:** código, pipeline, frontend, Codex
- **Windows:** tablet (ADB), GUI, drivers locais
- **Codex:** refatorações autônomas, geração estrutural
- **Claude Code:** operações, coleta, UI/UX, deploy autorizado

---

## 7. Resposta Esperada Das IAs

- Ser conciso
- Explicar decisões técnicas quando houver tradeoff
- Indicar arquivos afetados em mudanças estruturais
- Não afirmar que algo foi validado sem ter rodado a validação
- Se houver lacuna de ambiente, registrar claramente
- Nunca agir fora do escopo autorizado pelo usuário
- Ao encerrar alteração, informar a proveniência registrada
- Seguir o footer padrão de encerramento (ver `CONSTITUICAO.md §9`)

---

> 📅 **2026-07-19 — Reorganização:** Este arquivo foi reduzido. Regras
> compartilhadas (regras permanentes 1–22, política de commit, proveniência,
> economia de contexto, footer, flows, protocolo de modelo) movidas para
> `CONSTITUICAO.md`.
> Assinatura: `[Freebuff > ds-v4-flash > xH]`
