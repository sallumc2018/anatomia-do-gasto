# STATUS_HISTORICO — Anatomia do Gasto
> Arquivo de arquivo: conteúdo migrado de STATUS.md em 2026-06-25 (regra: migrar ao atingir 40 linhas).

## Governança documental — 2026-06-25

- `CANONICAL_PATHS.md` define onde cada artefato, camada de dados e handoff fica.
- `TASKS.md` substitui o antigo `tasks.txt` e contém a fila executável.
- `IDEAS.md` recebe propostas ainda não aprovadas.
- `DECISIONS.md` permanece como registro de decisões duráveis.
- `memory/handoffs/YYYY-MM/` **DEPRECADO** — handoffs eliminados como formato obrigatório em 2026-06-25. Usar TASKS.md + STATUS.md.

## Coleta e Publicação — 2026-06-25 (Claude Coleta e Publicação)

- **P0 gate integridade Sprint 2** (`bd5a6e7`): `publicar_municipios_brasil.py` valida
  schema por área, rejeita HTML/CSV vazio/sem linhas, copia atomicamente via temp+replace,
  gera manifesto SHA-256 em `data/manifests/sprint2/`, exit 1 em rejeições.
- **P0 falhas cron Sprint 2**: passos 7 e 8 convertidos para `run_cmd` — falhas entram
  em `FALHAS[]` e disparam alerta Telegram.
- **P0 Telegram hardening**: subshell isola segredos (sem exportar ao ambiente), umask 077
  cria arquivo com perm 600, trap garante remoção em qualquer sinal, log path removido da
  mensagem.
- **Passo 11 cron**: `gerar_cobertura_sprint2.py` (Codex) integrado à coleta noturna.
- Pendente (Codex): testes de contrato P1 para as 3 áreas federais.

## UI/UX — 2026-06-25 (Claude UI/UX)

- **Canonicals corrigidos**: `layout.tsx` criados em `/fluxo`, `/fluxo-financeiro`,
  `/mapa-interativo` (canonical) e `/sandbox` (noindex). Gate `check_canonical_routes.py` retorna OK.
- **Títulos duplicados eliminados**: 8 páginas corrigidas. Commit `48f0d6f`.
- **Recharts -1**: verificado — todos os charts de produção têm `minWidth={0}` e alturas fixas.
- **Gramática PT-BR**: pipeline `tools/gates/check_grammar.py` criado. ~50 strings corrigidas. Commit `48f0d6f`.
- **Mapa interativo sem cruzamentos**: SVG e coordenadas redesenhados. Commit `8d02ce3`.

## ✅ Concluído (jun/2026)

- **Urbes despesas mensais (2026-06-09, Claude)**: 21 PDFs coletados via Playwright Linux (2010-2026); 108 registros extraídos (2018-2026); `pipelines/extrair_urbes_despesas.py`; CSV em `data/public/sorocaba/transporte/urbes/saida/`.
- **Paulínia CNPJ resolvido (2026-06-09, Claude)**: `45751435000106` confirmado válido via BrasilAPI; em `pipelines/paths.py`.
- **Repo conectado ao GitHub (2026-06-09, Claude)**: `github.com/sallumc2018/anatomia-do-gasto`; `src/schema.py` adicionado.
- **Sorocaba SAAE publicado (2026-06-03, Claude)**: contratos(22) + licitações(77) 2026; fix encoding latin-1→utf-8.
- **Sorocaba TCE pareceres (2026-06-03, Claude)**: 20 links PDF oficiais em `data/public/sorocaba/controle_externo/tce/saida/`.
- **Sorocaba não-LAI QA fechado (2026-06-02, Codex)**: 86 OK, 0 warn, 0 fail.

## ✅ Concluído (mai/2026)

- `/fluxo-financeiro` — Sankey do rastro do dinheiro público (RREO 2024).
- `/sorocaba/transferencias` e `/sorocaba/controle-externo` — funcionais.
- `shell-header`: "Fluxo Financeiro" adicionado ao menu Mais.
- **Paulínia (2026-05-31)**: 17 pipelines parametrizados; 89 CSVs SICONFI+FNS+transf.fed.
- **Paulínia TCE-SP (Opus)**: 144/144 consultas OK; 364.803 registros despesa 2020-2025.
- **Paulínia transferências estaduais SP**: sefaz_sp=5137; ICMS/IPVA/FEX 2020-2026 coletados.

## ✅ QA Opus — Paulínia TCE×SICONFI (2026-06-01)

Cross-check completo. Despesa liquidada: 5/6 anos batem ao centavo (2022 diverge R$7,2M ~0,4% — REAL entre fontes, não bug). **DECISÃO: SICONFI é o agregado oficial; TCE granular p/ drill-down; nota metodológica obrigatória em 2022.** QA em `data/extracted/paulinia/tce/qa_crosscheck_tce_siconfi.csv`.

### ✅ Paulínia PROMOVIDA a data/public (Opus, 2026-06-01)

89 CSVs em `data/public/paulinia/` (89/89 sha256 conferem). Receita 6 · executivo 6 · fiscal 42 · seguranca 6 · transporte 12 · transf_federais 5 · transf_estaduais 6 · fns 6. Conferência: despesa liquidada 2024 = R$ 2.586.407.247,87 ✅.

## 📊 Paulínia — cross-validação SICONFI (2026-05-31)

- DTP/RCL real 2020 = 48,13% (dentro do teto LRF). NÃO publicar acusação de pessoal.
- Receita cresceu 110% em 5 anos: R$1,4B (2020) → R$3,0B (2025) — REPLAN/Petrobras.
- Dívida declinante: 25% (2020) → 8% (2024).
- Transferências federais 2020 ausentes na API — verificar se gap real.
