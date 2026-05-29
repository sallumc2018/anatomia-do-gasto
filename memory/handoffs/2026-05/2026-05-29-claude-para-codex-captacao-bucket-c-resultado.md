---
id: 2026-05-29-claude-para-codex-captacao-bucket-c-resultado
date: 2026-05-29
agent: Claude Code para Codex
status: active
visibility: public
---

# Handoff - Resultado da captação Bucket C (não-LAI)

Contexto: Claude operou como Maestro/dispatcher nesta sessão, despachando agentes para
completar os buckets C (parcial captável) e D (Urbes PDFs) de Sorocaba sem dependência de LAI.

## Resultado por fonte

### SIOPS / RREO-SUS — JA COMPLETO (nenhuma ação necessária)
- 18 PDFs em data/raw/sorocaba/saude/rreo/entrada/ (3 bimestres x 6 anos 2020-2025)
- 18 CSVs em data/extracted/sorocaba/saude/saida/ (despesas, receitas, detalhamento por ano)
- Status real: publicado via data/public/saude; manifesto dizia parcial (desatualizado)

### FNS / repasses_sus — JA COMPLETO
- Extraído 2020-2026; notas obsoletas já corrigidas no auditavel nesta sessão

### SAAE / remuneracao_rh (categoria pessoal) — COLETADO HOJE
- 6 runs criados em data/extracted/sorocaba/saae/tdaportal/20260529_*
- Ultimo run (20260529_091316): pasta pessoal com 11 tabelas, 137 linhas total
- tabela_32.csv tem 102 linhas (maior tabela, provavel lotacao de servidores por cargo)
- Status: coletado_pendente_validacao; proximo passo: normalizar tabelas e rodar QA
- Nota: slug correto e pessoal (nao rh); script usa Playwright internamente (nao aceita multiplos --ano; precisa de invocacao por ano)

### FUNSERV / investimentos_e_rentabilidade — PARCIALMENTE COLETADO; PORTAL MUDOU
- Raw existente (runs anteriores):
  - apr: 145 PDFs, 2013-2026 (cobre 2020-2025)
  - atuarial: 18 PDFs, 2015-2025 (cobre 2020-2025)
  - governanca: 70 PDFs, 2019-2026 (cobre 2020-2025)
  - balancos/saude + previdenciario: 370 arquivos mas APENAS ATE 2018 (gap 2019-2025)
  - receitas_despesas: 14 arquivos apenas de 2026 (gap 2020-2025)
  - rentabilidade: 0 arquivos (nunca coletado)
- Portal FUNSERV reestruturou: todas as URLs retornam HTTP 404 hoje
- Novas coletas por script impossíveis até URL ser remapeada ou dados obtidos por LAI
- ACAO NECESSARIA: adicionar ao lai_pedidos.csv: balancos 2019-2025, receitas_despesas 2020-2025 e rentabilidade como pedidos e-SIC FUNSERV

### Câmara / execucao_orcamentaria_legislativo — COLETADO E EXTRAIDO HOJE
- 26 PDFs baixados via Playwright em data/raw/sorocaba/camara/{ano}/{categoria}/
- Distribuicao: gabinete(7) ldo(5) lrf(4) metas(2) ppa(3) prestacao(5)
- 5 CSVs extraidos com pdfplumber em data/extracted/sorocaba/camara/:
  - camara/lrf/camara_lrf_sorocaba.csv  — 4 PDFs, 20.996 chars, 4/4 com texto
  - camara/ldo/camara_ldo_sorocaba.csv  — 5 PDFs, 5.419 chars, 4/5 (1 escaneado)
  - camara/ppa/camara_ppa_sorocaba.csv  — 3 PDFs, 29.828 chars, 3/3 com texto
  - camara/prestacao/camara_prestacao_sorocaba.csv — 5 PDFs, 11.891 chars, 5/5 com texto
  - camara/metas/camara_metas_sorocaba.csv — 2 PDFs, 489 chars, 1/2 (1 escaneado)
- Proximo passo: /pipeline normalizar CSVs para schema padrao; /qa validar; gate de publicacao com usuario

### Urbes / contratos_compras_diretas — BLOQUEADO (OCR)
- 177 PDFs em data/raw/sorocaba/transporte/urbes/ (contratos_outros:47, receitas:91, transporte:39)
- 100% escaneados: 0 chars, 0 words, 0 tables via pdfplumber em amostra das 3 subpastas
- pytesseract nao instalado, pdf2image nao instalado, tesseract nao encontrado no PATH
- Desbloquear: winget install UB-Mannheim.TesseractOCR + pip install pytesseract pdf2image
  Risco mapeado: Tesseract e binario C++ mantido pela Univ. Mannheim (nao npm); risco diferente do worm ativo
- Decisao pendente com usuario; aguardando autorizacao antes de qualquer install

## Bloqueios novos para lai_pedidos.csv

Adicionar 3 entradas FUNSERV:
1. FUNSERV / balancos_receitas_despesas 2019-2025 (portal 404; dado existia ate 2018)
2. FUNSERV / receitas_despesas 2020-2025 (portal 404; so 2026 no raw)
3. FUNSERV / rentabilidade_previdencia e rentabilidade_saude (portal 404; nunca coletado)

## Proximo passo prioritario para Codex

1. Normalizar SAAE pessoal: tabelas de data/extracted/sorocaba/saae/tdaportal/20260529_091316/pessoal/
   para schema padrao (ano, mes, orgao, cargo, vinculo, n_servidores) em data/extracted/sorocaba/saae/
2. Normalizar Camara PDFs: camara/lrf, ldo, ppa, prestacao (texto_bruto -> campos estruturados)
3. Rodar /qa em SAAE e Camara apos normalizacao
4. Gate de publicacao: nao mover para data/public sem aprovacao explicita do usuario
5. Atualizar lai_pedidos.csv com 3 entradas FUNSERV novas

## Restricoes
- Sem commit, push, deploy, npm install, publicacao de dados
- Urbes bloqueado ate usuario autorizar Tesseract/pytesseract
