# Anatomia do Gasto — Visão Geral

## Missão
Construir o maior portal de transparência fiscal da América Latina. Tornar os dados de gastos públicos municipais acessíveis, auditáveis e comparáveis para todos os brasileiros.

## Stack
- **Coleta**: Python 3.12, pipelines em `pipelines/`
- **Frontend**: Astro (Next.js-like, SSG), deploy via Vercel
- **Armazenamento**: CSV em `data/public/`, sincronizado com GDrive
- **APIs externas**: SICONFI (Tesouro Nacional), Portal Transparência (CGU), FNS, SIOPS, FNDE/SIOPE
- **Orquestração**: cron jobs no PC principal (00:00 BRT coleta noturna Sprint 1, 02:05 BRT Sprint 2 worker, 05:10 BRT deploy)

## Arquitetura de dados
```
data/
  raw/        ← dados brutos baixados das APIs
  extracted/  ← dados processados por extratores
  validated/  ← dados após validação/QA
  public/     ← dados publicados no site
  manifests/  ← metadados, inventários, CSV de configuração
```

## Municípios cobertos

### Sprint 1 — São Paulo (19 municípios registrados em paths.py)
São Paulo capital + 18 municípios: Guarulhos, Campinas, São Bernardo, Santo André, Osasco, Ribeirão Preto, São José dos Campos, Mauá, São José do Rio Preto, Santos, Mogi das Cruzes, Diadema, Jundiaí, Carapicuíba, Piracicaba, Bauru, Itaquaquecetuba, São Vicente.
Sorocaba e Paulínia têm configuração avançada (sefaz_sp).

### Sprint 2 — Brasil (5571 municípios via IBGE CSV)
Todos os municípios do Brasil, sem necessidade de registro em paths.py.
Fontes federais apenas (SICONFI + Portal Transparência + FNS).
Worker circular `sprint2_24x7_worker.py`, cursor em 218/5571 (3,9%) em 2026-07-05.
Roda diariamente (timeout 3h), ~300 municípios/noite → cobertura completa em ~18 noites.

## Deploy
- Vercel (production): deploy automático às 05:10 BRT via cron (`git pull` + `vercel deploy --prod --yes --archive=tgz`)
- `--archive=tgz` obrigatório no free tier (>5000 arquivos individuais → erro; tarball único evita)
- Variável `MUNICIPIO` controla qual município o frontend exibe
- Frontend: Next.js em `apps/web/`, 114 páginas geradas no último build
