# Revisão UI/UX — Anatomia do Gasto

**Data:** 2026-06-18 · **Modelo:** Opus 4.8 / High · **Escopo:** apps/web (66 páginas)

## Método e cobertura honesta

Duas camadas, com cobertura distinta:

- **Saúde de código (100% mecânico):** `tsc`, `eslint` e varreduras de invariante
  (skip-link, metadata, turbopackIgnore, hex, layout) sobre **todas** as 66 páginas +
  leitura da fundação (layout, header, globals.css, next.config, libs de dados).
- **UX renderizada (amostra):** `next dev` + render real de **17 rotas** cobrindo cada
  template × município + os caminhos de borda (ano/fornecedor inexistente, 404). Não é
  render das 66; é amostra representativa por template.

---

## Camada 1 — Saúde de código: VERDE ✅

| Verificação | Resultado |
|---|---|
| Typecheck (`tsc --noEmit`) | **0 erros** |
| Lint (`eslint`) | **0 warnings** |
| Deploy-safety (`process.cwd()` + `turbopackIgnore`) | **100%** protegido (app + lib) |
| Design system | 5 temas via tokens CSS; `:focus-visible`; skip-link |
| Rotas especiais | `error`, `global-error`, `loading`, `robots`, `sitemap` presentes |
| Imagens | nenhum `<img>` cru |
| Header | a11y forte: `aria-expanded`/`haspopup`/`role=menu`, Escape, click-outside |

## Camada 2 — UX renderizada: amostrada ✅ (com 1 bug real)

Amostra (17 rotas) — todas **HTTP 200**, título próprio, 1×`<h1>`, sem overlay de erro:

| Rota | Sinal de dado |
|---|---|
| `/`, `/glossario`, `/termos` | conteúdo estático OK |
| `/sorocaba/executivo` | 230 valores R$ |
| `/sorocaba/saude` | 96 valores R$ |
| `/sorocaba/saude/relatorio/2023` | 87 valores R$ |
| `/paulinia/executivo` | 240 valores R$ |
| `/sao-paulo/executivo` | 278 valores R$ |
| `/sao-paulo/saude` | série 2020–2025 completa (R$ 10,49 bi… real, **não** zero falso) |

→ A regra-mãe "dado ausente ≠ zero" **é honrada**: páginas com dado mostram valores
reais; nenhuma fabricou R$ 0.

---

## Achados e correções (sessão 2026-06-18/19)

| # | Sev | Item | Status |
|---|-----|------|--------|
| 4 | Baixa (UX) | `not-found.tsx` ausente → 404 genérico sem branding | ✅ **CORRIGIDO** — criado `app/not-found.tsx`. Rota desconhecida agora dá **HTTP 404** com header/footer e mensagem (verificado em produção: 1311 chars, nav presente) |
| 2 | Média (a11y) | `<main>` sem `id="conteudo"` → skip-link quebra | ✅ **CORRIGIDO** — `id="conteudo"` em `fluxo`, `mapa-interativo`, `fluxo-financeiro` (verificado: 1 cada) |
| 3 | Baixa-Média (SEO) | 6 páginas sem `export const metadata` | ✅ **CORRIGIDO** — `termos`, `politica-de-neutralidade`, 4× `*/comparativo` com título próprio (verificado em produção) |
| 5 | Baixa (mobile) | sem `viewport`/`themeColor` | ✅ **CORRIGIDO** — `export const viewport` no `layout.tsx` (dark `#161616` / light `#ffffff`) |
| 6 | Baixa (a11y) | sem `@media (prefers-reduced-motion)` | ✅ **CORRIGIDO** — bloco `reduce` no `globals.css` |
| 1 | **Baixa-Média (UX)** | Param dinâmico inválido (ano/fornecedor inexistente) → **soft-404**: HTTP 200, corpo SSR = skeleton do loading; not-found entregue via flight RSC | ⚠️ **NÃO corrigido — limitação arquitetural conhecida** (ver abaixo) |
| 7 | Cosmético | hex hardcoded (cor de dado, legítima) | — não alterado |

### Sobre o #1 (recalibrado para Baixa-Média)

- **O que o usuário real vê:** com JS (≈99%), o `not-found` branded é entregue via stream RSC e renderizado após o skeleton — não é "tela branca" para quase ninguém. O resíduo: no-JS/crawler vê só o skeleton; status é 200 (soft-404) em vez de 404.
- **Causa-raiz (provada empiricamente):** o `app/loading.tsx` **global** envolve toda rota num Suspense. Em render on-demand (param não pré-gerado), o shell + skeleton são flushados com **200** antes de o componente alcançar `notFound()`; o resultado (notFound, conteúdo, ou `dynamicParams=false`) é entregue via flight, nunca como SSR do corpo. Só rota **sem match** (não entra em segment/loading) escapa → 404 SSR completo (por isso o #4 funciona).
- **Tentativas que falharam (revertidas):** retornar componente de conteúdo inline (`<SemDados>`) e `export const dynamicParams = false` — ambos mascarados pelo mesmo streaming; sem efeito observável.
- **Fix real (decisão de UX do usuário, fora de escopo aqui):** remover/escopar o `app/loading.tsx` global faz on-demand renderizar SSR completo (404 real, sem flash) — mas troca o skeleton de navegação de **todas** as páginas por TTFB maior. Não alterado unilateralmente.
- **Mitigação de baixo risco já presente:** params não indexados/linkados; build `rc=0`.

---

## Veredito

**Saúde de código: verde** (tsc 0 erros, lint 0 warnings, **build de produção `rc=0`**).
**UX renderizada (amostra): boa.** 5 dos 6 achados corrigidos e verificados em produção
(`next build` + `next start`). O #1 é soft-404 (Baixa-Média), bloqueado por decisão de
arquitetura (loading global) que cabe ao usuário; nada bloqueia produção.

**Limite explícito:** varredura visual pixel-a-pixel das 66 (contraste WCAG por ratio,
overflow em todos os breakpoints) é passo Playwright/e2e (Antigravity) ou sessão dedicada.
