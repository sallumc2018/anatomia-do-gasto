# Anatomia do Gasto — contexto para Claude

Leia primeiro `AI_MASTER_PROMPT.md`.

## Paths Críticos

- App web: `apps/web/`
- Pipeline Python: `pipelines/`
- Dados brutos: `data/raw/`
- Dados extraídos: `data/extracted/`
- Dados validados: `data/validated/`
- Dados publicados no site: `data/public/`
- Manifests de auditoria: `data/manifests/`

## Regra Principal

O site oficial só pode ler `data/public`. CSV em `data/extracted` ainda não está validado. CSV em `data/validated` está aprovado localmente, mas só vira publicação depois de ser copiado para `data/public`.

Não commitar, fazer push ou deploy sem autorização explícita.

## Rodar No Windows

```powershell
cd "C:\projetos\anatomia-do-gasto"
.\.venv\Scripts\python.exe pipelines\pipeline.py --ano 2025
.\.venv\Scripts\python.exe pipelines\testes\verificar_dados.py --ano 2025

cd apps\web
npm.cmd run dev
```

## Rodar No WSL/Linux

```bash
cd ~/projetos/anatomia-do-gasto
./.venv/bin/python pipelines/pipeline.py --ano 2025
./.venv/bin/python pipelines/testes/verificar_dados.py --ano 2025

cd apps/web
npm run dev
```

## RTK

RTK é ferramenta local para economia de contexto/token. Não versionar binários ou caches. Documentar comandos em `tools/rtk/README.md`.

## Frontend

- Next.js + TypeScript + Recharts
- `apps/web/lib/data.ts` lê CSVs publicados.
- `apps/web/lib/auditoria.ts` lê dados de auditoria publicados.
- Não importar módulos com `fs`/`path` em componentes `"use client"`.

## Dados Atuais

- Saúde: 2020-2025 em `data/public`.
- Educação: 2020-2025 em `data/public`, validada contra PDFs oficiais locais.
- Auditoria: mock público sinalizado no site como fictício.

## Vercel

Root Directory esperado: `apps/web`.
