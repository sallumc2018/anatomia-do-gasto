---
id: 2026-05-29-claude-para-codex-auditavel-restaurado-ocr-urbes-rodando
date: 2026-05-29
agent: Claude Code para Codex
status: active
visibility: public
---

# Handoff - Claude Code para Codex

## O que aconteceu com o sorocaba_100_auditavel.csv

O arquivo ficou corrompido (cada caractere em linha separada) durante a sessao de hoje.
Restaurado via `git checkout -- data/manifests/sorocaba_100_auditavel.csv` e TODAS as
mudancas da sessao foram reaplicadas em operacao unica limpa.

Estado final confirmado: 55 linhas, 25 colunas, integridade OK.

## Distribuicao de status atualizada (antes -> depois)

| Status | Antes (git) | Agora |
|---|---|---|
| publicado | 4 | 10 |
| publicado_parcial | 0 | 3 |
| parcial | 19 | 13 |
| coletado_pendente_validacao | 12 | 9 |
| lai_necessario | 20 | 20 |

## Mudancas aplicadas no auditavel

Alem das correcoes de notas FNS/SICONFI ja documentadas, os seguintes status foram atualizados:

Promovidos para publicado (evidencia confirmada em data/public):
- Prefeitura/registro_de_empenhos (203.231 reg)
- Prefeitura/conta_corrente_fornecedor (25.400 reg)
- Prefeitura/conta_corrente_restos_a_pagar_por_fornecedor (3.979 reg)
- FNS/repasses_sus (saude completo 2020-2026)
- SICONFI/dca (11.477 reg em data/public/sorocaba/fiscal)
- SAAE/receitas_despesas (75.272 reg - publicacao do Codex hoje)

Promovidos para publicado_parcial:
- Camara/execucao_orcamentaria_legislativo (TCE-SP 24.417 + docs LRF/LDO/PPA hoje)
- Portal_Transparencia_Federal/transferencias (2.849 via TCE-SP; fonte direta pendente)
- FUNSERV/balancos_receitas_despesas (rpps+saude em autarquias; balancoes 2019-25 LAI)

## OCR Urbes rodando em background

Script: pipelines/extrair_urbes_contratos_pdf_ocr.py (criado hoje, auditado pelo Catao)
Comando: python pipelines/extrair_urbes_contratos_pdf_ocr.py --subpasta all --lote 10
PDFs: 177 (contratos_outros:47, contratos_receitas:91, contratos_transporte:39)
Saida esperada: data/extracted/sorocaba/urbes/contratos_{subpasta}_ocr.csv
Tesseract 5.4 + Poppler 25.07 instalados e testados (OCR validado: 2093 chars/pag)

## Score

calc_score.py le de data/public / datasets.csv, nao do auditavel.
Para o score do site (lacunas.ts / 80%) subir, Codex precisa regenerar a pagina a partir
do auditavel atualizado e fazer deploy.

## Infraestrutura de segurança (Catao - feito hoje)

- requirements-audit.txt: formato --require-hashes valido (Codex melhorou o formato)
- docs/seguranca-pacotes.md: politica completa com fluxo Docker
- Pacotes aprovados: pytesseract 0.3.13, pdf2image 1.17.0, packaging 26.2, Pillow 12.2.0
- Binarios: Tesseract 5.4 (UB-Mannheim), Poppler 25.07 (oschwartz10612)

## Proximo passo para Codex

1. Aguardar OCR Urbes concluir e validar CSVs em data/extracted/sorocaba/urbes/
2. Atualizar datasets_status.json com os novos status do auditavel
3. Regenerar lacunas.ts / score do site a partir do auditavel atualizado
4. Separar commits por pacote conforme plano do Maestro-readiness handoff
5. Gate de publicacao dos contratos OCR Urbes: passar por /qa antes de data/public

## Restricoes
- Sem commit, push, deploy sem autorizacao explicita
- Sem mover contratos Urbes para data/public sem QA pass
