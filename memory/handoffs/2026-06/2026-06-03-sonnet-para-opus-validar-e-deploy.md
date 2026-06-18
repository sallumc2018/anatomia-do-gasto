# Handoff: Validação, merge e deploy — sessão 2026-06-03
**De:** Claude Sonnet (sessão de sprint — 2026-06-03)
**Para:** Claude Opus (portão de validação)
**Data:** 2026-06-03
**Repo:** `C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto\`

---

## O que foi feito nesta sessão

### 1. Dados publicados → `claude/sorocaba-frontend`
| Arquivo novo em `data/public` | Origem | Registros | Status |
|---|---|---|---|
| `sorocaba/autarquias/saae/saida/saae_contratos_sorocaba_2026.csv` | `data/extracted/sorocaba/saae/normalizado/` | 22 | encoding latin-1→utf-8 corrigido |
| `sorocaba/autarquias/saae/saida/saae_licitacoes_sorocaba_2026.csv` | `data/extracted/sorocaba/saae/normalizado/` | 77 | utf-8 ok |
| `sorocaba/controle_externo/tce/saida/pareceres_contas_municipais_tce_sorocaba.csv` | `data/extracted/sorocaba/tce/contas_municipais/` | 20 | inventário de links PDF oficiais |
| `sorocaba/contratos/saida/pncp_sorocaba_2022_2026.csv` | correção anterior (Codex) | 2101 | 0 CNPJ fora de Sorocaba |

Manifesto `data/manifests/sorocaba_100_auditavel.csv` atualizado:
- Score não-LAI: **28/37 (75%)** — era 22/37 (59%) antes desta sessão
- 6 flips: coletado_pendente_validacao e parcial → publicado_parcial

### 2. Ferramentas de pipeline → `claude/tenacity-retry`
| Arquivo novo/modificado | O que faz |
|---|---|
| `tools/pipeline/hash_utils.py` | SHA-256 por arquivo baixado; detecta mudança silenciosa de fonte |
| `tools/pipeline/ocr_utils.py` | pdfplumber → fallback Tesseract 5/por+eng; `dpi` parametrizável |
| `tools/pipeline/__init__.py` | módulo |
| `pipelines/baixar_fns_repasses.py` | tenacity retry + registrar_hash após download |
| `pipelines/baixar_rreo_sus.py` | tenacity retry + registrar_hash após download |
| `pipelines/baixar_transferegov_sorocaba.py` | tenacity retry + registrar_hash após download |
| `pipelines/baixar_transferencias_federais.py` | tenacity retry (_urlopen_com_retry) |
| `pipelines/extrair_urbes_contratos_pdf_ocr.py` | usa ocr_utils (sem código OCR duplicado) + registrar_hash |

Tesseract 5.4 + `por.traineddata` instalados em `C:\Program Files\Tesseract-OCR\`. Poppler já existia.

### 3. Governança → `claude/governanca`
- `DECISIONS.md` — protocolo cross-tool, branches por agente, arquivos de simbiose
- `TASKS.md` — fila de tarefas oficial (criado nesta sessão)

---

## ⚠️ Problema conhecido: `claude/governanca` commit 670bbf3

O commit `670bbf3 [Claude] tasks: backlog completo` foi feito por outra sessão paralela e **incluiu 4 scripts de pipeline com marcadores de conflito** (`<<<<<<< Updated upstream`):

```
pipelines/baixar_fns_repasses.py
pipelines/baixar_rreo_sus.py
pipelines/baixar_transferegov_sorocaba.py
pipelines/extrair_urbes_contratos_pdf_ocr.py
```

**Ação necessária antes de merge:** criar um commit de correção em `claude/governanca` que restaure esses 4 arquivos para a versão limpa de `claude/tenacity-retry`:

```bash
git checkout claude/governanca
git checkout claude/tenacity-retry -- pipelines/baixar_fns_repasses.py \
    pipelines/baixar_rreo_sus.py \
    pipelines/baixar_transferegov_sorocaba.py \
    pipelines/extrair_urbes_contratos_pdf_ocr.py
git add pipelines/
git commit -m "[Claude] fix: restaurar scripts sem conflito de merge (670bbf3)"
```

---

## Portão Opus — o que validar

### A. SAAE contratos (22 registros)
```bash
py -c "
import csv
with open('data/public/sorocaba/autarquias/saae/saida/saae_contratos_sorocaba_2026.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
print(f'Registros: {len(rows)}')
print(f'Colunas: {list(rows[0].keys())}')
# Verificar encoding
print('Tipo com cedilha:', rows[0].get('tipo'))
# Verificar CNPJs não vazios
cnpjs_ok = sum(1 for r in rows if r.get('cnpj_cpf_fornecedor','').strip())
print(f'CNPJs preenchidos: {cnpjs_ok}/{len(rows)}')
# Verificar valores
vals = [r.get('valor_contratado','') for r in rows if r.get('valor_contratado','').strip()]
print(f'Valores preenchidos: {len(vals)}/{len(rows)}')
"
```

Critérios de aprovação:
- Encoding ok (`tipo` contém "Serviços" com cedilha, não caractere corrompido)
- Cobertura 2026 declarada na nota (não é série histórica)
- Nenhuma coluna interna (`observacao`, `fonte_arquivo`) presente no público
- CNPJs no formato XX.XXX.XXX/XXXX-XX (pode ter CPF em alguns)

### B. SAAE licitações (77 registros)
```bash
py -c "
import csv
with open('data/public/sorocaba/autarquias/saae/saida/saae_licitacoes_sorocaba_2026.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
print(f'Registros: {len(rows)}')
from collections import Counter
mods = Counter(r.get('modalidade','') for r in rows)
print('Modalidades:', dict(mods))
sits = Counter(r.get('situacao','') for r in rows)
print('Situações:', dict(sits))
"
```

Critério: aceitável que 56 registros tenham `data_abertura` vazia (dispensas/inexigibilidades — documentado na decisão de publicação `docs/decisao-publicacao-saae-licitacoes-contratos-obras-sorocaba-2026-06-02.md`).

### C. TCE pareceres (20 links)
```bash
py -c "
import csv
with open('data/public/sorocaba/controle_externo/tce/saida/pareceres_contas_municipais_tce_sorocoba.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
" 2>/dev/null || py -c "
import csv
with open('data/public/sorocaba/controle_externo/tce/saida/pareceres_contas_municipais_tce_sorocaba.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
from collections import Counter
print(f'Total: {len(rows)}')
print('Tipos:', Counter(r.get('tipo','') for r in rows))
years = sorted(r.get('ano_exercicio','') for r in rows)
print('Anos:', years[0], '–', years[-1])
urls_ok = sum(1 for r in rows if r.get('url','').startswith('https://'))
print(f'URLs HTTPS: {urls_ok}/{len(rows)}')
"
```

Critério: 8 decisões da Câmara (2015-2022) + 12 pareceres prévios da Prefeitura (2012-2023). Todos com URL PDF oficial.

### D. Manifesto de cobertura
```bash
py -c "
import csv
from collections import Counter
with open('data/manifests/sorocaba_100_auditavel.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
c = Counter(r['status_auditavel'] for r in rows)
for k,v in sorted(c.items()): print(f'  {k}: {v}')
lai = c.get('lai_necessario',0)
done = c.get('publicado',0) + c.get('publicado_parcial',0)
print(f'Score nao-LAI: {done}/{len(rows)-lai} ({100*done//(len(rows)-lai)}%)')
"
```

Esperado: 28/37 (75%). Se mostrar valores diferentes, verificar em qual branch o manifesto foi atualizado.

**Nota:** o manifesto atualizado está em `claude/sorocoba-frontend`. Em outros branches (ex.: `claude/tenacity-retry`) ainda mostra o valor antigo — isso é esperado.

### E. Pipeline tools — compilação
```bash
py -m py_compile tools/pipeline/hash_utils.py tools/pipeline/ocr_utils.py \
    pipelines/baixar_fns_repasses.py pipelines/baixar_rreo_sus.py \
    pipelines/baixar_transferegov_sorocaba.py pipelines/extrair_urbes_contratos_pdf_ocr.py
# Esperado: sem saída (= sem erros)
```

---

## Sequência de merge e deploy

### Branches e ordem

```
1. Validar e corrigir claude/governanca (fix dos 4 scripts com conflito)
2. Merge claude/sorocaba-frontend → main   ← contém dados novos + fixes frontend
3. Merge claude/tenacity-retry → main      ← pipeline tools (sem impacto no site)
4. (Opcional) Merge claude/governanca → main ← apenas após fix dos conflitos
5. Deploy
```

### Comandos de merge (após validação)
```bash
cd "C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto"

# Merge sorocaba-frontend (contém os dados novos — VALIDAR PRIMEIRO)
git checkout main
git merge --no-ff claude/sorocaba-frontend -m "[Claude] merge: SAAE + TCE pareceres publicados + fixes frontend (2026-06-03)"

# Merge tenacity-retry (pipeline — sem risco de site)
git merge --no-ff claude/tenacity-retry -m "[Claude] merge: pipeline resiliente — tenacity + hash_utils + ocr_utils (2026-06-03)"

# Verificar build antes de deploy
# (sem npm install/build — Vercel faz isso)

# Deploy
vercel deploy --prod --yes
```

### Sobre o deploy
- Integração GitHub→Vercel **desativada** — usar apenas `vercel deploy --prod --yes`
- Executar da raiz do repo: `C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto\`
- O deploy inclui os dados em `data/public` via Next.js static serving
- **SAAE contratos/licitações não aparecem no site ainda** — os arquivos estão em `data/public` mas a página `apps/web/app/sorocaba/autarquias/page.tsx` usa outros CSVs (TCE aggregado, não os contratos SAAE). Isso é correto — dados estão disponíveis via `/api/dados`, mas não exibidos em UI até Vitrúvio integrar.
- **TCE pareceres** — similarmente, o arquivo está publicado mas a página de controle externo ainda não o lê. Deploy é seguro (não quebra nada).

---

## Estado dos blockers conhecidos (Sorocaba 100% sem LAI)

| Item | Status após esta sessão | Ação restante |
|---|---|---|
| SAAE contratos/licitações | ✅ publicado (cobertura 2026) | Vitrúvio integrar na página |
| TCE pareceres inventário | ✅ publicado (20 PDFs) | Vitrúvio integrar na página |
| PNCP | ✅ 2101 registros, CNPJ limpo | — |
| Urbes relação mensal (17 PDFs) | OCR agora funcional | Rodar `extrair_urbes_contratos_pdf_ocr.py --subpasta all` |
| Urbes remuneração (2 arquivos) | `data/raw` — pendente | OCR ou análise manual |
| PNCP 2021 | Confirmado inexistente (0 registros no portal) | Encerrado como fonte-ausente |
| Câmara realizado 2020-2021 | Bloqueado LAI | Aguarda e-SIC |
| LOA extrator | Parcial | Script dedicado pendente |
| 18 itens lai_necessario | Permanentemente bloqueados | Documentar como limite |

---

## Notas finais

- Branch `codex/institutional-audit-data-catalog` está **30 commits à frente do origin** (não pushado). Codex controlou esse branch — não fazer push de lá sem aprovação do Codex ou do usuário.
- `claude/paulinia` e `claude/infra-multi-municipio` estão locais, não pushados — fora do escopo deste handoff.
- `requirements.txt` atualizado com `tenacity==9.1.4` nesta sessão.
- Provenance registrada: `PV-2026-06-03-001` em `memory/provenance/changes.csv`.

---

## Referências rápidas

| Path | O que é |
|---|---|
| `data/public/sorocaba/autarquias/saae/saida/` | Novos CSVs SAAE desta sessão |
| `data/public/sorocaba/controle_externo/tce/saida/pareceres_contas_municipais_tce_sorocaba.csv` | Inventário TCE |
| `data/manifests/sorocoba_100_auditavel.csv` | Manifesto de cobertura Sorocaba |
| `docs/decisao-publicacao-saae-licitacoes-contratos-obras-sorocaba-2026-06-02.md` | Decisão Codex sobre SAAE |
| `docs/fechamento-sorocaba-nao-lai-2026-06-02.md` | Relatório de fechamento não-LAI (Codex) |
| `tools/pipeline/hash_utils.py` | `registrar_hash(arquivo, url)` → bool |
| `tools/pipeline/ocr_utils.py` | `extrair_texto_pdf(arquivo, paginas=None, dpi=300)` → str |
