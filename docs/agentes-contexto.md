# Agentes e Economia de Contexto

> ⚠️ **Regras compartilhadas foram movidas para `CONSTITUICAO.md`.**
> Este arquivo contém APENAS detalhes operacionais de subagentes, protocolo
> otimizado e budget de tokens. Para regras gerais (roteamento, commit,
> proveniência, isolamento, footer, flows), consulte:
> - **`CONSTITUICAO.md`** — fonte única de regras compartilhadas
> - `docs/roteamento-codex-claude.md` — divisão Claude vs Codex

---

## 1. Protocolo Otimizado

Início read-only de qualquer tópico substantivo:

```bash
python tools/agents/start-topic.py "<objetivo>" --rag-limit 3
```

Para objetivos amplos, ambíguos ou reutilizáveis, use primeiro:

```bash
/goal <objetivo>
```

`/goal` é slash command local, não skill. Define sucesso, não-objetivos, gates,
rota inicial, pacote mínimo, validação e sinal de aprendizado.

Pedido recomendado para usuário ou handoff entre agentes:

```text
Novo topico: <area>. Objetivo: <resultado>. Pode editar: <paths>. Nao pode: <gates>. Validacao: <comandos>. Entrega: diff + validacao + handoff curto.
```

### Gates e validações locais por área

```bash
python tools/agents/check-scope-gates.py
python tools/agents/validate-area.py --area memory|agents|scope|pipeline|frontend|publication
```

`check-scope-gates.py` falha se: frontend referenciar `data/raw/extracted/validated`,
dataset não publicável aparecer em `data/public/<municipio>`, mindmap defasado,
ou automações conterem comandos de release/instalação sem gate humano.

Checagem local completa antes de commit/push/deploy autorizado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/release/check-local-release.ps1
```

Use `-SkipFrontend` quando ainda não houver autorização para rodar `npm run lint` e `npm run build`.

---

## 2. Budget de Tokens por Agente

Metas a respeitar. Se a tarefa exigir mais, **avisar o usuário** antes de continuar.

| Agente | Budget alvo | Motivo |
|---|---|---|
| `maestro` | < 500 tok | Só classifica e despacha — não executa |
| `frontino` | < 3 K tok | Lê manifesto, calcula score, roteia coleta |
| `dados` | < 3 K tok | Checa arquivos + portal, sem análise |
| `pipeline` | < 5 K tok | Roda script, lê output, reporta |
| `analista` / `plinio` | < 8 K tok | Lê ~3 CSVs, calcula, formata relatório |
| `frontend` / `vitruvio` | < 12 K tok | Código complexo, múltiplos arquivos |
| `deploy` | < 2 K tok | Só comandos — nada de conteúdo |
| `engenheiro` | por tarefa | Escopo autorizado explicitamente |
| `tablet` | < 2 K tok | Só scripts, sem dados |
| `segurança` / `catao` | < 3 K tok | Logs e status, sem dados do projeto |

---

## 3. Memória e RAG

Fontes públicas indexáveis: `memory/registry.csv` (Tipo=Fonte, Status=canonical/reference).
Índice SQLite FTS5 local: `.local/rag/anatomia_public.sqlite` (nunca versionado).
Capacidades dos agentes: `memory/agents/registry.csv`.

### Checks da memória

```bash
python -m compileall -q tools/memory
python tools/memory/audit-memory-scope.py
python tools/memory/build-rag-index.py --check
python tools/memory/build-rag-index.py
python tools/memory/write-token-economy.py --check
python tools/agents/validate-agent-contracts.py
python tools/agents/check-scope-gates.py
```

Preferir fontes `canonical` e `reference`; `historical` ou `deprecated` não
entram na recuperação normal.

---

## 4. Verificação de Economia de Token

Para trabalhos substantivos com conteúdo público/sanitizado, registrar entrada em
`memory/token-economy/YYYY-MM.md`:

```text
Data: [AAAA-MM-DD]
Agente/ferramenta: [Codex, Claude, subagente]
Escopo: [resultado verificavel]
Arquivos consultados: [lista curta]
Arquivos/trechos evitados: [lista curta]
Comandos consolidados: [lista curta]
Estimativa: [faixa percentual ou qualitativa]
Privacidade: [confirmacao de que nao ha prompts privados, secrets, conversa completa ou dados nao publicados]
```

Preferir o escritor validado:

```bash
python tools/memory/write-token-economy.py --agent <agente> --scope "<escopo>" --consulted "<arquivos>" --avoided "<trechos>" --commands "<comandos>" --estimate "<faixa>"
```

Quando solicitado ("quanto economizamos?"), responder com **estimativa auditável**.
**Nunca inventar número exato.**

---

> 📅 **2026-07-19 — Reorganização:** Este arquivo foi reduzido. Regras
> compartilhadas (roteamento, commit, proveniência, footer, escopo proibido,
> flows, isolamento, disciplina de raciocínio, padrão de assinatura) movidas
> para `CONSTITUICAO.md`.
> Assinatura: `[Freebuff > ds-v4-flash > xH]`
