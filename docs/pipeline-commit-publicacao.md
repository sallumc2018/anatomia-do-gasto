# Pipeline de commit-publicação (seguro, fail-closed)

> Origem: incidente do GitHub PAT vazado em 2026-06-03. Antes não havia um
> pipeline efetivo — só verificadores soltos (um deles órfão) e `.gitignore`
> (bypassável com `git add -f`). Este documento define o pipeline único.

## Princípio

**Fail-closed em alta confiança; advisory no resto.** Bloqueia só o que é
inequívoco e tem baixíssimo falso-positivo (segredo, caminho operacional).
O que é ambíguo (mock/PII em dado público) vira **WARN auditável** + revisão
humana — porque falso-bloqueio travaria commits legítimos (dado de licitação
tem "teste"/números repetidos legítimos).

## Preview-first (validar antes de publicar) — OBRIGATÓRIO para mudança visual

Nunca publicar mudança de site/visual direto em produção (`vercel deploy --prod`).
O ritual é, nesta ordem:

1. **Local** — `sh tools/preview.sh dev` → `http://localhost:3000` (hot-reload). Conferir
   visual, navegação e console sem erros.
2. **Build local** — `sh tools/preview.sh build` (pega erros de build/tipo/SSR que o dev não pega).
3. **Preview deploy** — `sh tools/preview.sh deploy` (= `vercel deploy` sem `--prod`): URL
   isolada idêntica ao prod, **não toca o site público**. Validar ali.
4. **Produção** — só então, passo separado e explícito: `vercel deploy --prod --yes` (com
   autorização do usuário).

> `npm run dev`/`npm run build` NÃO instalam dependências (≠ `npm install`, bloqueado pela
> campanha do worm). Rodam com o `node_modules` já presente.

Para mudança **só de tooling/dados/docs** (sem efeito visual), os passos 1–3 são opcionais;
o gate de segurança (abaixo) continua obrigatório.

## Estágios

| Estágio | Quando | Comando | Escopo |
|---|---|---|---|
| **pre-commit** | todo `git commit` (hook) | `check-commit-gate.py --staged` | só arquivos staged (rápido) |
| **pre-push** | todo `git push` (hook) | `check-commit-gate.py --full --no-warn` | árvore versionada inteira (só camadas BLOCK; ~70s) |
| **publish** | antes de publicar `data/public` / push manual / deploy | `validate-area.py --area publish` | árvore + escopo + publicados |

Os hooks ficam em `.husky/` (caminho canônico único desde 2026-06-15; o `pre-commit`
chama o gate com `--staged` e o `pre-push` com `--full --no-warn`) e precisam ser
ativados **uma vez por clone** (o git não deixa o repo auto-configurar `core.hooksPath`,
por proteção). Rode o bootstrap após clonar:
```
# Windows
powershell -NoProfile -File tools/setup-hooks.ps1
# Git Bash / Linux / macOS
sh tools/setup-hooks.sh
# (ou diretamente)
git config core.hooksPath .husky
```

## Camadas do gate (`tools/agents/check-commit-gate.py`)

| # | Camada | Severidade | Implementação |
|---|---|---|---|
| 1 | **Segredos** (token GitHub/Slack/Google/OpenAI, AWS AKIA, chave PEM, basic-auth em URL) | **BLOCK** | `check-secrets.py --staged/--all` |
| 2 | **Caminhos proibidos** (`data/raw\|extracted\|validated`, `.env*`, `.pem/.key/.pfx/.p12`, `id_rsa/ed25519`, `.local/`, `omega-security/tablet-*`, `*_local.csv`, `.vercel`) | **BLOCK** | enforce no commit/push, barra até `git add -f` |
| 3 | **Deleção em `data/public`** | **BLOCK** | exige decisão documentada e `ANATOMIA_ALLOW_PUBLIC_DELETE=1` |
| 4 | **Mock / PII** (CPF repetido, `12345678900`, `ficticio`, `mock`, `placeholder`, `teste`) em `data/public`/`data/manifests` | **WARN** | `tools/security/check-data-integrity.py` — pulada no pre-push (`--no-warn`); roda no pre-commit (staged) e no estágio `publish` |

A área `publish` adiciona: `check-scope-gates.py` (frontend não referencia camadas
internas; classificação cobre cada linha do manifesto; mindmap atualizado) e
`verificar_publicacao.py --strict` (publicados presentes e não-vazios).

## Camadas que já existiam e continuam

- `.husky/commit-msg` — exige assinatura `[CLI > Modelo > Esforço]` no fim da mensagem (ex.: `[Claude Code > claude-opus-4-8 > High]`) + formato conventional commit via `commitlint`.
- **GitHub Push Protection** (server-side) — última linha de defesa contra segredo.

## Decisão de ferramentas (e o que NÃO usamos, de propósito)

Pipeline é **100% Python local + git hooks**. **Nenhum** MCP, conector ou pacote
novo. Durante a campanha do worm Mini Shai-Hulud, adicionar dependência
(ex.: gitleaks via winget, MCP de segurança) *aumenta* a superfície de
supply-chain. O scanner regex próprio + Push Protection cobrem o vetor do
incidente. Reavaliar gitleaks como camada redundante **só** após a campanha
passar e com allowlist de winget explícita.

Governança: o agente **Catão** (`/catao` / `/seguranca`) é o dono conceitual;
este pipeline é a materialização executável das regras dele.

## Como um humano/agente roda manualmente

```bash
# antes de publicar data/public ou pedir push/deploy:
python tools/agents/validate-area.py --area realdata
python tools/agents/validate-area.py --area publish

# checagem pontual do gate:
python tools/agents/check-commit-gate.py --full
python tools/agents/check-secrets.py --selftest   # prova que a detecção funciona
```

## Test fixtures (nota para mantenedores)

As amostras positivas do `check-secrets.py --selftest` são **montadas por
concatenação em runtime** — nenhum literal de formato-credencial existe no
fonte, para não disparar nem o próprio scanner nem o Push Protection.
Segredos legítimos em doc/teste devem usar placeholder ou o marcador
`allowlist-secret` na linha, com justificativa.
