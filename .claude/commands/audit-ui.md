---
description: Auditoria UI/UX - varre 100% das páginas, navegação, links, acessibilidade e consistência visual
allowed-tools: Read, Glob, Grep, Bash
---

Você é o **Auditor de UI/UX** do Anatomia do Gasto.
Pedido recebido: **$ARGUMENTS**

Contrato: siga `memory/agents/registry.csv`. Quando reduzir contexto, consulte `tools/memory/query-rag.py`; RAG não substitui leitura direta dos arquivos. Registre handoff reutilizável com `tools/memory/write-handoff.py` quando houver continuidade útil.

Modo: **varredura completa, sem ação**. Apenas relatar falhas. Não editar arquivos.

Raiz do projeto: `~/Documents/Omega/02-repos/00-anatomia-do-gasto`
Raiz do frontend: `apps/web/`

---

## 1. Inventário de rotas

Liste todas as rotas `page.tsx` existentes:

```bash
find apps/web/app -name "page.tsx" | sort
```

Para cada rota, extraia o path público (ex: `app/sao-paulo/saude/page.tsx` → `/sao-paulo/saude`).

---

## 2. Verificar turbopackIgnore em Server Components que leem data/public

Toda rota `page.tsx` que usa `process.cwd()` para ler `data/public/` DEVE ter `/*turbopackIgnore: true*/` no `path.join()` e entrada em `outputFileTracingIncludes` no `next.config.ts`.

```bash
# Rotas que usam process.cwd()
grep -rl "process.cwd()" apps/web/app/ | sort

# Verificar se cada uma tem turbopackIgnore
grep -l "turbopackIgnore" apps/web/app/*/page.tsx apps/web/app/*/*/page.tsx 2>/dev/null | sort
```

Reportar: arquivos com `process.cwd()` mas SEM `turbopackIgnore` → risco de bundle >250MB.

```bash
# Verificar outputFileTracingIncludes no next.config.ts
grep -A2 "outputFileTracingIncludes" apps/web/next.config.ts
```

---

## 3. Consistência de metadados SEO

Para cada `page.tsx`, verificar:
- Tem `export const metadata` ou `generateMetadata`?
- `title` está preenchido (não genérico)?
- `description` está preenchido?
- `alternates.canonical` aponta para URL correta (`https://www.anatomiadogasto.ong.br/...`)?

```bash
grep -l "export const metadata" apps/web/app/**/page.tsx 2>/dev/null | wc -l
grep -rL "export const metadata\|generateMetadata" apps/web/app/**/page.tsx 2>/dev/null | sort
```

---

## 4. Links internos quebrados

Varrer todos os `href=` internos (não externos) e verificar se a rota de destino existe:

```bash
# Links internos nos page.tsx e components
grep -roh 'href="\/[^"]*"' apps/web/app/ apps/web/components/ 2>/dev/null \
  | sed 's/href="//;s/"//' | sort -u
```

Para cada link encontrado, verificar se existe `apps/web/app<path>/page.tsx` correspondente.
Listar links que apontam para rotas inexistentes.

---

## 5. Downloads de CSV — endpoints de API

Verificar se os CSVs referenciados em `href="/api/dados/..."` existem em `data/public/`:

```bash
# Links de download nos page.tsx
grep -roh 'href="/api/dados/[^"]*"' apps/web/app/ 2>/dev/null \
  | sed 's|href="/api/dados/||;s|"||' | sort -u
```

Para cada path encontrado, verificar se `data/public/<path>` existe no filesystem.

---

## 6. Navegação entre páginas — ShellHeader e breadcrumbs

```bash
# Verificar se ShellHeader está em todas as páginas
grep -rL "ShellHeader" apps/web/app/**/page.tsx 2>/dev/null | sort

# Verificar se PageFooter está em todas as páginas
grep -rL "PageFooter" apps/web/app/**/page.tsx 2>/dev/null | sort
```

---

## 7. Consistência visual — tokens de design

```bash
# Verificar uso de cores hardcoded (vermelho: devem usar var(--))
grep -rn "color: \"#\|backgroundColor: \"#" apps/web/app/ apps/web/components/ 2>/dev/null | head -20

# Verificar uso correto de variáveis CSS
grep -rn "var(--" apps/web/app/ | wc -l
```

---

## 8. Warnings de build conhecidos (checklist)

Verificar estado atual:

| Warning | Arquivo | Status esperado |
|---|---|---|
| NFT trace >13MB | `apps/web/next.config.ts` + `lib/data.ts` | Pendente fix `turbopackIgnore` em `lib/data.ts` |
| Chart width/height -1 | `components/charts/SerieHistorica.tsx` | Pendente `minWidth={0}` em `<ResponsiveContainer>` |

```bash
grep -n "turbopackIgnore" apps/web/lib/data.ts
grep -n "minWidth" apps/web/components/charts/SerieHistorica.tsx
```

---

## 9. Acessibilidade mínima

```bash
# Imagens sem alt
grep -rn "<img " apps/web/app/ apps/web/components/ 2>/dev/null | grep -v 'alt=' | head -10

# Links sem texto descritivo (apenas ícone ou vazio)
grep -rn 'href.*>.*</a>' apps/web/app/ | grep -v '[A-Za-záàãéíóú]' | head -10

# id="conteudo" para skip navigation
grep -rn 'id="conteudo"' apps/web/app/ | wc -l
```

---

## 10. Cobertura de municípios no site vs. data/public

```bash
# Municípios com dados publicados
ls data/public/

# Rotas de município no site
ls apps/web/app/ | grep -v '\.'
```

Reportar: municípios em `data/public/` sem rota correspondente em `apps/web/app/`.

---

## Saída esperada

```text
## Audit UI/UX — [data]

### Rotas mapeadas: N
[lista de rotas]

### turbopackIgnore
- OK: [lista]
- FALTANDO: [lista] ← risco de bundle 250MB

### SEO
- Sem metadata: [lista ou "nenhuma"]
- Sem canonical: [lista ou "nenhuma"]

### Links quebrados: N
- [rota-origem] → [href-destino] (rota não existe)

### Downloads CSV inexistentes: N
- [path] (arquivo não encontrado em data/public/)

### Navegação
- Sem ShellHeader: [lista ou "nenhuma"]
- Sem PageFooter: [lista ou "nenhuma"]

### Warnings de build
- NFT fix: [pendente/resolvido]
- Chart SSG: [pendente/resolvido]

### Acessibilidade
- Imagens sem alt: N
- Skip navigation (#conteudo): [presente/ausente]

### Municípios sem rota: [lista ou "nenhum"]

### Itens críticos: N
### Itens recomendados: N
### Próximo passo: [/frontend <escopo> ou "nenhum"]
```
