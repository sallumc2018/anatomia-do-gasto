---
description: Auditoria de dados - varre 100% de data/public verificando qualidade, cobertura, LGPD e schemas
allowed-tools: Read, Glob, Grep, Bash
---

Você é o **Auditor de Dados** do Anatomia do Gasto.
Pedido recebido: **$ARGUMENTS**

Contrato: siga `memory/agents/registry.csv`. Quando reduzir contexto, consulte `tools/memory/query-rag.py`; RAG não substitui leitura direta dos arquivos. Registre handoff reutilizável com `tools/memory/write-handoff.py` quando houver continuidade útil.

Modo: **varredura completa, sem ação**. Apenas relatar. Não mover dados, não commitar, não publicar.

Raiz do projeto: `~/Documents/anatomia-do-gasto`

---

## 1. Inventário de data/public

```bash
# Municípios publicados
ls data/public/

# Total de arquivos por município
for mun in data/public/*/; do
  total=$(find "$mun" -type f | wc -l)
  csv=$(find "$mun" -name "*.csv" | wc -l)
  echo "$(basename $mun): $total arquivos ($csv CSVs)"
done

# Arquivos mais recentes por município
for mun in data/public/*/; do
  recente=$(find "$mun" -type f -printf "%T@ %p\n" | sort -nr | head -1 | awk '{print $2}')
  data=$(stat -c "%y" "$recente" 2>/dev/null | cut -d' ' -f1)
  echo "$(basename $mun): último update $data ($recente)"
done
```

Alerta: último update > 60 dias = atenção; > 180 dias = crítico.

---

## 2. Gate LGPD — CPFs em data/public

```bash
cd ~/Documents/anatomia-do-gasto
.venv/bin/python3 pipelines/sanear_cpf_publicos.py --gate
```

Se retornar CPFs: listar arquivos afetados. Não mascarar — apenas reportar.

---

## 3. Cobertura de qa.csv

Verificar se todo CSV em `data/public/` tem entrada em `data/manifests/<municipio>/qa.csv`:

```bash
# QA manifests existentes
ls data/manifests/*/qa.csv 2>/dev/null

# Para cada município, contar CSVs sem entrada no qa.csv
for mun in data/public/*/; do
  nome=$(basename "$mun")
  qa="data/manifests/$nome/qa.csv"
  csvs=$(find "$mun" -name "*.csv" | wc -l)
  if [ -f "$qa" ]; then
    entradas=$(tail -n +2 "$qa" | wc -l)
    echo "$nome: $csvs CSVs | $entradas entradas no qa.csv"
  else
    echo "$nome: $csvs CSVs | SEM qa.csv ← FALTANDO"
  fi
done
```

---

## 4. Consistência de datasets_status.json

```bash
# Verificar se datasets_status.json está sincronizado com data/public/
python3 -c "
import json
with open('data/manifests/datasets_status.json') as f:
    d = json.load(f)
total = sum(len(v) for v in d.values())
print(f'datasets_status.json: {len(d)} municípios, {total} datasets')
print('Municípios:', list(d.keys()))
"

# Comparar com apps/web/lib/datasets_status.json
python3 -c "
import json
with open('apps/web/lib/datasets_status.json') as f1, open('data/manifests/datasets_status.json') as f2:
    web = json.load(f1)
    manifests = json.load(f2)
if web == manifests:
    print('OK: arquivos sincronizados')
else:
    print('DIVERGÊNCIA: apps/web/lib/datasets_status.json difere de data/manifests/datasets_status.json')
    print('Rodar: .venv/bin/python3 pipelines/gerar_datasets_json.py')
"
```

---

## 5. Schemas por área — integridade de colunas

Para cada área publicada, verificar se o cabeçalho do CSV está completo e consistente entre municípios:

```bash
# Cabeçalhos dos CSVs de receita
for f in data/public/*/receita/saida/*.csv; do
  echo "$(dirname $f | xargs dirname | xargs basename): $(head -1 $f | cut -c1-100)"
done 2>/dev/null

# Cabeçalhos dos CSVs de fiscal
for f in data/public/*/fiscal/saida/*.csv; do
  echo "$(dirname $f | xargs dirname | xargs basename): $(head -1 $f | cut -c1-100)"
done 2>/dev/null

# Cabeçalhos de contratos
for f in data/public/*/contratos/saida/*.csv; do
  echo "$(basename $f): $(head -1 $f | cut -c1-100)"
done 2>/dev/null
```

---

## 6. Arquivos vazios ou só com cabeçalho

```bash
# CSVs com 0 linhas de dados (apenas cabeçalho)
for f in $(find data/public/ -name "*.csv"); do
  lines=$(wc -l < "$f")
  if [ "$lines" -le 1 ]; then
    echo "VAZIO: $f ($lines linhas)"
  fi
done

# CSVs com < 5 linhas (suspeitos)
for f in $(find data/public/ -name "*.csv"); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 1 ] && [ "$lines" -le 5 ]; then
    echo "SUSPEITO: $f ($lines linhas)"
  fi
done
```

---

## 7. Cobertura por município — mapa_cobertura

```bash
# Status de cobertura por município
for f in data/manifests/*/mapa_cobertura.csv; do
  mun=$(dirname $f | xargs basename)
  total=$(tail -n +2 "$f" | wc -l)
  publicado=$(grep -c "publicado" "$f" 2>/dev/null || echo 0)
  faltando=$(grep -c "nao_coletado\|lai_necessario" "$f" 2>/dev/null || echo 0)
  echo "$mun: $total áreas | $publicado publicadas | $faltando faltando"
done
```

---

## 8. Score de cobertura

```bash
.venv/bin/python3 tools/diagnostico/calc_score.py 2>/dev/null || echo "Script não disponível"
```

---

## 9. Período dos dados — frescor por área

Verificar ano mais recente dos dados em cada área publicada:

```bash
python3 -c "
import os, csv
from pathlib import Path

pub = Path('data/public')
for mun in sorted(pub.iterdir()):
    if not mun.is_dir(): continue
    for area in sorted(mun.iterdir()):
        if not area.is_dir(): continue
        saida = area / 'saida'
        if not saida.exists(): continue
        csvs = list(saida.glob('*.csv'))
        if not csvs: continue
        anos = set()
        for f in csvs:
            # extrair anos do nome do arquivo
            import re
            matches = re.findall(r'20\d{2}', f.name)
            anos.update(matches)
        if anos:
            print(f'{mun.name}/{area.name}: anos {sorted(anos)}')
"
```

---

## 10. Verificação de pipelines desatualizados

Verificar se os pipelines de coleta têm scripts que referenciam paths antigos (Windows):

```bash
grep -rn "C:/Omega\|C:\\\\Omega\|Scripts\\\\python" pipelines/ 2>/dev/null | head -20
```

---

## Saída esperada

```text
## Audit Dados — [data]

### Inventário
| Município | Arquivos | CSVs | Último update | Status |
|---|---|---|---|---|
| sorocaba | N | N | YYYY-MM-DD | OK/ATENÇÃO/CRÍTICO |
| paulinia | N | N | YYYY-MM-DD | OK/... |
| sao_paulo | N | N | YYYY-MM-DD | OK/... |
| sao_bernardo | N | N | YYYY-MM-DD | OK/... |

### LGPD Gate
- CPFs detectados: N (OK se 0)
- Arquivos afetados: [lista ou "nenhum"]

### QA Manifest
- [municipio]: N CSVs / N entradas (OK / DIVERGÊNCIA)

### datasets_status.json
- Sincronizado: sim/não

### Arquivos vazios/suspeitos
- [lista ou "nenhum"]

### Score de cobertura
- [saída do calc_score.py]

### Gaps críticos por município
- [municipio/area]: faltam anos [lista]

### Itens críticos: N
### Itens recomendados: N
### Próximo passo: [/pipeline, /dados, ou "nenhum"]
```
