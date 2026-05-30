---
id: 2026-05-29-codex-instrucoes-score-commits-ocr
date: 2026-05-29
agent: Claude Code para Codex
status: active
visibility: public
---

# Handoff - Instrucoes precisas para Codex

## Contexto desta sessao

Claude atuou como Maestro/dispatcher. Estado atual do working tree:
- sorocaba_100_auditavel.csv: restaurado do git + todas as mudancas da sessao reaplicadas (55 linhas, OK)
- datasets_status.json: atualizado com saae-pessoal-rh e camara-documentos-orcamentarios (31 datasets)
- data/public: SAAE pessoal + Camara docs ja publicados (pelo Codex antes)
- OCR Urbes: rodando ou concluido em data/extracted/sorocaba/urbes/contratos_*_ocr.csv

## 1. SCORE: adicionar itens em lacunas.ts (e calc_score.py)

O score permanece em 79.7%/80% porque as duas listas sao HARDCODED.
O auditavel NAO alimenta o score automaticamente.

### Novos itens para apps/web/lib/lacunas.ts

Adicionar APOS os itens existentes de autarquias e camara:

```typescript
// SAAE pessoal/RH — amostra maio 2026 (100/139 cargos; 1 mes; sem serie historica)
{ dimensao: "autarquias", status: "parcial", anosPossiveis: 6, anosCobertos: 1 },

// Camara documentos orcamentarios — inventario texto PDFs (LRF/LDO/PPA/prestacao/metas)
// 11 com texto extraido, 6 texto curto, 2 escaneados; nao e serie contabil
{ dimensao: "camara", status: "parcial", anosPossiveis: 6, anosCobertos: 4 },
```

### Mesmo para calc_score.py

```python
('autarquias','parcial',6,1),   # SAAE pessoal/RH amostra mai/2026
('camara','parcial',6,4),       # Camara docs LRF/LDO/PPA/prestacao/metas (texto)
```

### Score esperado apos adicionar (estimativa)

Os dois itens parciais (score=0.5, cobertura baixa) devem subir ~1.5-2pp.
Provavelmente 81-82%. Calcular com calc_score.py apos editar para confirmar.

---

## 2. COMMITS: ordem recomendada pelo Maestro (do handoff maestro-readiness)

Separar em 5 commits limpos. NAO misturar escopo. NAO incluir .github/workflows/sorocaba-pipeline.yml.

### Pacote 1 — governanca/memoria (sem tocar frontend ou data)
Arquivos:
- memory/agents/registry.csv
- memory/agents/maestro-learning.md (e afins)
- memory/provenance/changes.csv
- memory/token-economy/2026-05.md
- memory/handoffs/2026-05/*.md (todos os novos)
- tasks.txt

### Pacote 2 — Theo C0 e sandbox
Arquivos:
- .claude/commands/theo.md
- memory/agents/theo-*.csv e theo-learning.md
- memory/training/theo/
- apps/web/app/sandbox/ (sandbox oficial do Theo)
- tools/agents/eval-theo-training.py
- tools/agents/train-theo.py

### Pacote 3 — manifestos Sorocaba (reconciliacao + publicacao de hoje)
Arquivos:
- data/manifests/sorocaba_100_auditavel.csv (versao restaurada+atualizada pelo Claude)
- data/manifests/datasets_status.json
- data/manifests/datasets.csv
- data/manifests/publication_classification.csv
- data/manifests/sorocaba/qa.csv
- data/manifests/lai_pedidos.csv (3 entradas FUNSERV adicionadas)
- docs/roadmap-sorocaba-100.md
- docs/reconciliacao-sorocaba-2026-05-29.md
- docs/publicacao-saae-camara-2026-05-29.md
- data/public/sorocaba/autarquias/saae/pessoal/
- data/public/sorocaba/camara/documentos_orcamentarios/
- pipelines/normalizar_saae_camara_publicacao.py

### Pacote 4 — frontend Sorocaba (revisar antes de commitar)
Arquivos:
- apps/web/app/page.tsx (correcao whitespace ja feita pelo Maestro)
- apps/web/app/sorocaba/camara-municipal/page.tsx
- apps/web/app/sorocaba/controle-externo/page.tsx
- apps/web/components/layout/shell-header.tsx
- apps/web/components/theo/theo-guide.tsx
- apps/web/lib/data.ts
- apps/web/lib/generated/mindmap-data.ts
- apps/web/app/sorocoba/transferencias/ (novo - revisar claims)
- apps/web/app/sorocaba/camara-municipal/CabinetExpensesDashboard.tsx (hipotese produto)
- apps/web/app/sorocaba/controle-externo/DcaCharts.tsx (hipotese produto)
ATENCAO: revisar claims antes de incluir qualquer pagina experimental.

### Pacote 5 — seguranca e novos pipelines
Arquivos:
- requirements-audit.txt (formato --require-hashes valido)
- docs/seguranca-pacotes.md
- pipelines/extrair_urbes_contratos_pdf_ocr.py (OCR Urbes, aprovado pelo Catao)
- .claude/commands/maestro.md

### NAO incluir em nenhum commit (ainda)
- .github/workflows/sorocaba-pipeline.yml: workflow CI rejeitado como pronto para producao;
  transformar em piloto manual read-only ou mover para docs/ antes de commitar.

---

## 3. OCR URBES: validar quando concluir

O job roda em background. Verificar:

```powershell
ls data\extracted\sorocaba\urbes\contratos_*_ocr.csv
python -c "
import csv
for subpasta in ['contratos_outros','contratos_receitas','contratos_transporte']:
    f = f'data/extracted/sorocaba/urbes/contratos_{subpasta}_ocr.csv'
    rows = list(csv.DictReader(open(f,encoding='utf-8')))
    ok = sum(1 for r in rows if r['status_ocr']=='ok')
    erros = sum(1 for r in rows if r['status_ocr'].startswith('erro'))
    print(f'{subpasta}: {len(rows)} reg  ok={ok}  erros={erros}')
"
```

Se ok > 70% das linhas: rodar /qa e propor gate de publicacao com usuario.
Se ok < 50%: registrar como bloqueio (PDFs de baixa qualidade de scan).

---

## 4. AUDITAVEL: nao editar diretamente com write_text ou similar

O arquivo corrompeu hoje quando escrito via Python write_text fora do csv.DictWriter.
Usar sempre:
```python
with p.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
    w.writeheader(); w.writerows(rows)
```
E verificar integridade depois:
```python
rows = list(csv.DictReader(p.open(encoding="utf-8-sig", newline="")))
assert len(rows) == 55
```

---

## 5. SAAE: cobertura incompleta que precisa de nova coleta

A coleta de hoje capturou apenas maio/2026 (1 mes).
Para ter serie historica 2020-2025, precisaria de:
- 7 execucoes por ano x 6 anos = 42 runs do script
- Ou verificar se o portal permite exportar historico completo

Propor ao usuario: vale a pena fazer a serie completa? Ou publicar como ponto de corte?
