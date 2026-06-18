# Auditoria de Segurança — Anatomia do Gasto

**Data:** 2026-06-16 · **Escopo:** repositório público + portal em produção (www.anatomiadogasto.ong.br)
**Método:** análise → reportar → propor (fixes seguros aplicados; riscos outward-facing surfaçados)

---

## Sumário por severidade

| # | Achado | Severidade | Estado |
|---|--------|-----------|--------|
| SEC-1 | CPF de pessoas físicas exposto em CSVs públicos | **CRÍTICO** (LGPD) | HEAD + 2 branches saneados ✓ · `main` reescrito e force-pushed ✓ · 13 `refs/pull/*` ainda retêm CPFs (ver camada B) |
| SEC-4a | Dependências dev vulneráveis (`@babel/core`, `js-yaml`) | Baixo / Moderado | Proposto (não aplicado) |
| SEC-4b | CSP com `'unsafe-inline'` em script-src | Baixo | Aceito (padrão Next.js) |
| SEC-2 | Path traversal em `/api/dados` | — | Sem vulnerabilidade ✓ |
| SEC-3 | Segredos no histórico git | — | Nenhum ✓ |
| SEC-4c | Headers de segurança HTTP | — | Completos ✓ |

---

## SEC-1 — CPF de pessoas físicas (CRÍTICO, LGPD)

**Achado:** 5.719 ocorrências de CPF completo de pessoas físicas em CSVs publicados:
- **786 formatados** (`***.000.000-**`) — câmara de Paulínia (empenhos/pagamentos a credores PF), fornecedores PF e **beneficiários de auxílio moradia** de Sorocaba (dado pessoal sensível).
- **4.933 não-formatados** (11 dígitos anexados ao nome, ex. `NOME ***.072.078-**`) — fornecedores PF em 46 arquivos (Sorocaba + Paulínia).

Base legal: LGPD (Lei 13.709/2018); STF Tema 1042 e orientação CGU — o **nome** de quem recebe recurso público é divulgável, mas o **CPF** deve ser protegido.

**Mitigação aplicada (HEAD):**
- `pipelines/sanear_cpf_publicos.py` mascara CPF para `***.XXX.XXX-**` (mantém 6 dígitos centrais, padrão CGU), sem afetar CNPJ.
- **0 CPF completo restante** em `data/public` (verificado).
- Originais completos preservados em `data/private/lgpd_reservado/` (**gitignored**) — para uso futuro quando a LGPD/LAI permitir (decisão do usuário).
- **Gate anti-regressão:** `.husky/pre-commit` (Layer 3.5) roda `sanear_cpf_publicos.py --gate` e bloqueia commit com CPF em `data/public`.

**Achado adicional (2026-06-18):** durante a reescrita do histórico, o callback revelou
3 arquivos fora de `*.csv` com CPF real que o saneador deixou passar:
- `data/public/.schemas/paulinia/camara/saida/camara_empenhos_paulinia_2024.json` — CPF `***.532.498-**` (PF) no campo `"cnpj"`
- `docs/auditoria-seguranca-2026-06-16.md` — CPF real usado como exemplo no texto
- `pipelines/sanear_cpf_publicos.py` — mesmo CPF em comentário de código

Todos mascarados no working tree em 2026-06-18. Saneador estendido para varrer `*.json`
além de `*.csv`. Gate do pre-commit atualizado correspondentemente.

**Reescrita de histórico (camada B) — iniciada 2026-06-18:**
Usuário autorizou. Mirror reescrito em `/tmp/rewrite-anatomia` via `git-filter-repo`
com blob-callback (mesmas 2 regex do saneador). Verificação: **0 CPF** em 3290 blobs
únicos de todas as branches (main, codex/institutional-audit, claude/tenacity-retry,
11× dependabot). GitHub tem 13 `refs/pull/*` (apontam commits antigos com CPF); não
removíveis por push. Decisão do usuário: **recriar repo** (definitivo). Aguarda
concessão de `delete_repo` scope ou deleção manual pelo painel GitHub.

---

## SEC-2 — Path traversal em `/api/dados` (sem vulnerabilidade)

`apps/web/app/api/dados/[...slug]/route.ts` combina: allowlist de extensão (`.csv/.json/.jsonld/.ttl`) + `path.resolve` + verificação `startsWith(DATA_ROOT)`. Testado ao vivo:

| Ataque | Resultado |
|--------|-----------|
| baseline (arquivo legítimo) | 200 ✓ |
| `../../../package.json` (plain) | 404 |
| `%2e%2e/%2e%2e/%2e%2e/package.json` (encoded) | 404 |
| `%252e%252e` (double-encoded) | 404 |
| `.env.local` | 404 |

Nenhum vazamento; respostas `{"error":"Not found"}`.

---

## SEC-3 — Segredos no histórico git (nenhum)

- `.env`/`.env.local`: **nunca commitados** (`git log --all` vazio); não rastreados.
- `PORTAL_TRANSPARENCIA_KEY`: aparece só como **nome de variável** no código, sem valor hardcoded.
- Tokens reais no histórico inteiro: GitHub `ghp_` **0**, OpenAI `sk-` **0**, AWS `AKIA` **0** (os matches do `git log -S` eram substrings em palavras).

---

## SEC-4 — Hardening

**Headers HTTP (completos, em produção):** CSP restritiva (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`), HSTS `max-age=63072000; preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. `NEXT_PUBLIC_` sem segredos.

**Dependências:** produção **0 vulnerabilidades**. Dev (build-time, não runtime): `@babel/core <=7.29.0` (baixo, arbitrary file read via sourceMappingURL) e `js-yaml <=4.1.1` (moderado, DoS quadrático). Fix = `npm audit fix` — **decisão do usuário** (política Mini Shai-Hulud proíbe instalação automática).

**CSP `'unsafe-inline'`** em script-src/style-src: fraqueza menor, padrão de projetos Next.js; aceito.

---

## Reescrita de histórico (SEC-1 camada B) — Branch main limpa ✅ · refs/pull/* pendentes ⚠️

**Executado em 2026-06-18** (clone isolado `/tmp/rewrite-anatomia`, verificado):
- Backup mirror: `~/Documents/Omega/02-repos/.backup-anatomia-pre-rewrite-2d9ead8.git` (HEAD `2d9ead8`)
- Ferramenta: `git-filter-repo` 2.47.0 com blob-callback Python (2 regex, padrão CGU com backreference nos grupos 2+3)
- Resultado: 0 CPF em todas as branches (3290 blobs únicos)
- Conteúdo da `main` reescrita idêntico ao HEAD exceto os 3 arquivos com CPF real acima (corrigidos)

**Force-push concluído em 2026-06-18:**
- Branch protection e Ruleset desabilitados temporariamente pelo usuário
- `git push origin --force refs/heads/main:refs/heads/main` → `4cbb2e04...dc6963fc`
- Branch protection e Ruleset reativados imediatamente após
- Verificação local: 0 CPFs no histórico completo (git log --all -p)
- Repo local sincronizado: `git reset --hard origin/main` → HEAD `dc6963fc`

**Estado real:** o GitHub ainda retém `refs/pull/*` (13 PRs dependabot) apontando commits antigos com CPF. Estes NÃO são removíveis por push — são mantidos pelo servidor GitHub. O histórico navegável da `main` (git log, git checkout, clone público) está limpo. Os refs/pull são acessíveis via API ou interface GitHub. **SEC-1 camada B não está totalmente concluída enquanto esses refs existirem.**

Opções para eliminar refs/pull/*:
1. Solicitação ao GitHub Support para purgar os refs (sem garantia de prazo)
2. **Recriar o repositório** (decisão prévia do usuário — aguarda execução manual)

Rollback disponível se necessário: `~/Documents/Omega/02-repos/.backup-anatomia-pre-rewrite-2d9ead8.git` (HEAD `2d9ead8`).

---

## Ações recomendadas ao usuário

1. **Eliminar refs/pull/* com CPF** — reescrita executada (`main` limpa), mas 13 `refs/pull/*` ainda retêm commits antigos. Opções: (a) GitHub Support request, (b) **recriar repo** (decisão prévia do usuário, aguarda execução).
2. **`npm audit fix`** em `apps/web` para as 2 vulns dev (quando conveniente).
3. **Avaliar** se nomes de beneficiários de auxílio moradia (Sorocaba) devem permanecer — o CPF foi mascarado, mas a jurisprudência é mais restritiva para beneficiários de programas sociais (orientação jurídica).
4. **Manter** o gate anti-CPF: toda publicação em `data/public` deve passar por `sanear_cpf_publicos.py` (agora cobre CSV + JSON).
