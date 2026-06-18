# Handoff: Claude Code → Antigravity — Deploy + Pipeline Sprint

**Data**: 2026-06-11  
**De**: Claude Code (claude-sonnet-4-6)  
**Para**: Antigravity  
**Prioridade**: BLOQUEANTE — deploy nunca bem-sucedido nesta versão

---

## Tarefa 1 — Push + Deploy (EXECUTAR PRIMEIRO)

```bash
cd ~/Documents/Omega/02-repos/00-anatomia-do-gasto

# Gate de deploy (não bloqueante, mas registra problemas)
python3 tools/gates/pre_deploy.py

git push origin main

npx vercel deploy --prod --yes
```

### Verificação pós-deploy

```bash
curl -s -o /dev/null -w "%{http_code}" https://anatomiadogasto.ong.br/sorocaba/autarquias
curl -s -o /dev/null -w "%{http_code}" https://anatomiadogasto.ong.br/paulinia/transferencias
curl -s -o /dev/null -w "%{http_code}" https://anatomiadogasto.ong.br/sorocaba/camara-municipal
```

Se algum Lambda passar 250MB nos build logs → reportar para Claude Code com o nome da rota.

---

## Tarefa 2 — Executar pipelines de dados (após deploy OK)

### Fase 1C — Dados prontos para coletar

```bash
cd ~/Documents/Omega/02-repos/00-anatomia-do-gasto

# P1 — LOA/PPA/LDO Paulínia (PDFs locais em data/raw/paulinia/smarapd/)
MUNICIPIO=paulinia .venv/bin/python3 pipelines/extrator_loa_paulinia.py --tipo todos

# P2 — OCR subsídios Câmara Sorocaba (anos problemáticos com dígitos→letras)
MUNICIPIO=sorocaba .venv/bin/python3 pipelines/extrator_subsidios_camara_ocr.py \
    --anos 2017 2019 2022 --enhanced --salvar-txt

# P3 — SIOPS Sorocaba + Paulínia via DATASUS Tabnet
.venv/bin/python3 pipelines/baixar_siops_tabnet.py --municipios sorocaba paulinia

# P4 — Urbes gaps: Dez/2012, Dez/2013, Dez/2024
.venv/bin/python3 pipelines/atualizar_urbes_gaps.py

# P5 — FNDE repasses (PDDE/PNAE/PNATE) + SIOPE educação
# Opcional: PTG_API_KEY=<chave> para maior limite de requisições
# Chave grátis: portaldatransparencia.gov.br/api-de-dados/cadastrar-email
.venv/bin/python3 pipelines/baixar_fnde_siope.py --municipios sorocaba paulinia

# Gate de publicação (após pipelines)
.venv/bin/python3 tools/gates/pre_publicacao.py

# Regenerar catálogo de datasets
.venv/bin/python3 pipelines/gerar_datasets_json.py
```

### Fase 2 — Câmaras (scraping — executar só quando com tempo para inspecionar)

```bash
# Verificar sessões disponíveis antes de coletar tudo:
.venv/bin/python3 pipelines/baixar_camara_votacoes_sorocaba.py --anos 2024 --apenas-listar
.venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py --descobrir --anos 2024 --apenas-listar

# Se estrutura OK, coletar todos os anos:
.venv/bin/python3 pipelines/baixar_camara_votacoes_sorocaba.py --anos 2020 2021 2022 2023 2024 2025
.venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py --anos 2020 2021 2022 2023 2024 2025
```

---

## O que está nos commits (resumo do que nunca foi deployed)

| Commit | Fix |
|--------|-----|
| `7a09900` | Pipelines P1-P5 + scrapers Câmara (esta sessão) |
| `8f33aa4` | LAI: 11 pedidos formais Sorocaba (8) + Paulínia (3) |
| `dd72b88` | NFT tracing — reduce Lambda size |
| `1fe0087` | SIOPS Paulínia deferido + handoff inicial |
| `3e5e423` | outputFileTracingIncludes — 3 páginas SSR Sorocaba |
| `2ccf190` | turbopackIgnore em todas as páginas com process.cwd() |
| `2e86e56` | Remove prebuild que copiava 38MB → Lambda > 250MB |
| `c23e0cd` | Globs _2020_20*.csv — filenames dinâmicos |
| `43c6088` | Dados Paulínia: transferências R$135M |
| `7112cb9` | Pipeline CI: Husky + gates + runbooks |

---

## Proibições

- `npm install/update/audit fix` — Mini Shai-Hulud ativa
- `npx vercel deploy` sem `--prod --yes`
- Nunca commitar `.claude/settings.json` ou `tools/hooks/autonomous_rag.py` sem autorização
- FNDE pipeline: se API retornar 0 resultados, não commitar arquivos com "sem_dados" — reportar
