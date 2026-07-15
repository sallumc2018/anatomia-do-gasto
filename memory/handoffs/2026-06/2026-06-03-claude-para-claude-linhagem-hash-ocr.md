# Handoff: Linhagem de dados, Hash de fonte e OCR moderno
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet (sessão dedicada)
**Todas as decisões aprovadas por:** NeoLogos em 2026-06-03

---

## 1. Linhagem de dados (provenance) — PÚBLICA

### Por que fazer
Além de rastreabilidade interna, a linhagem pública move o projeto na escala
Tim Berners-Lee de ★★★ para ★★★★★:

| Estrelas | O que exige | Status atual |
|---|---|---|
| ★ | Dado disponível online | ✅ |
| ★★ | Formato estruturado (CSV/JSON) | ✅ |
| ★★★ | Formato aberto (não proprietário) | ✅ |
| ★★★★ | URIs para cada recurso | ❌ — falta |
| ★★★★★ | Links para outros datasets | ❌ — falta |

Linhagem pública + URIs de fonte = ★★★★★.

### O que implementar

**Arquivo de proveniência por CSV publicado:**
Cada arquivo em `data/public/` ganha um `<arquivo>.provenance.json` ao lado:

```json
{
  "arquivo": "despesas_sorocaba_2023.csv",
  "fonte_primaria": {
    "nome": "SICONFI/Tesouro Nacional",
    "url": "https://siconfi.tesouro.gov.br/siconfi/pages/public/consulta_finbra/finbra_list.jsf",
    "tipo": "RREO",
    "periodo": "2023",
    "baixado_em": "2026-04-15T10:23:00Z",
    "hash_sha256": "a3f8c2...",
    "hash_verificado_em": "2026-06-03T09:00:00Z"
  },
  "transformacoes": [
    {"etapa": "raw→extracted", "script": "pipelines/baixar_fontes_execucao.py", "agente": "Codex", "data": "2026-04-15"},
    {"etapa": "extracted→public", "script": "tools/qa/duckdb_checks.py", "agente": "Claude Opus", "data": "2026-05-20", "validacao": "totais conferem com RREO PDF"}
  ],
  "fonte_secundaria_validacao": {
    "nome": "TCE-SP Transparência",
    "url": "https://transparencia.tce.sp.gov.br/",
    "divergencia_conhecida": "2022: diferença de R$7,2M (~0,4%) — ver DECISIONS.md"
  },
  "licenca": "CC BY 4.0",
  "publicado_por": "Anatomia do Gasto — anatomiadogasto.com.br"
}
```

**Arquivo central de linhagem** (público, no repo):
`data/public/provenance/index.json` — índice de todos os `.provenance.json` do projeto.

### Branch e implementação
**Branch:** `claude/linhagem-publica`

```bash
uv add # sem dependência nova — JSON puro
```

1. Criar `tools/provenance/generate_provenance.py`:
   - Lê metadados de `data/manifests/datasets.csv`
   - Lê `memory/provenance/changes.csv` (já existe)
   - Gera `.provenance.json` para cada arquivo em `data/public/`
2. Criar `data/public/provenance/index.json` como índice central
3. Adicionar link "Ver fonte" em cada página do site (Vitrúvio implementa no frontend)
4. Registrar em `DECISIONS.md` que linhagem pública é política do projeto

### Relação com `memory/provenance/changes.csv` (já existe)
O `changes.csv` é interno/operacional. O `.provenance.json` é público/cidadão.
São complementares — não substituir um pelo outro.

---

## 2. Hash de mudança de fonte — PÚBLICO

### Por que fazer
Portais atualizam arquivos silenciosamente (sem aviso). Sem hash, você não sabe
se o arquivo que baixou hoje é o mesmo de ontem. Isso compromete a rastreabilidade.

### Implementação (simples, sem nova dependência)

Adicionar ao final de cada script de coleta:

```python
import hashlib, json, os
from pathlib import Path
from datetime import datetime, timezone

def registrar_hash(arquivo_path: str, url_fonte: str):
    """Calcula SHA256 e salva em .hash.json ao lado do arquivo."""
    with open(arquivo_path, 'rb') as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    
    hash_path = arquivo_path + '.hash.json'
    historico = []
    
    if os.path.exists(hash_path):
        historico = json.loads(open(hash_path).read()).get('historico', [])
        ultimo = historico[-1]['sha256'] if historico else None
        if ultimo == sha256:
            return  # arquivo não mudou, não registrar
    
    historico.append({
        'sha256': sha256,
        'baixado_em': datetime.now(timezone.utc).isoformat(),
        'url_fonte': url_fonte
    })
    
    with open(hash_path, 'w') as f:
        json.dump({'arquivo': arquivo_path, 'historico': historico}, f, indent=2)
    
    if len(historico) > 1:
        print(f"⚠️  MUDANÇA DETECTADA em {arquivo_path} — hash anterior: {historico[-2]['sha256'][:8]}...")
```

**Logs públicos de mudança** (`data/public/provenance/source_changes.json`):
Quando um hash muda, registrar publicamente que a fonte foi atualizada.
Isso é transparência extra — o cidadão pode ver que o portal mudou o arquivo.

### Branch: juntar ao `claude/linhagem-publica`
(hash é parte da linhagem — não precisa de branch separado)

---

## 3. OCR moderno — substituir pdfplumber para scans

### Por que fazer
`pdfplumber` extrai texto de PDFs digitais (texto real). PDFs escaneados (imagens)
retornam string vazia ou lixo. URBES teve 241 PDFs — parte provável de scans.
`reparar_funserv_apr_ocr.py` já existe → confirma que o problema é real.

### Ferramentas (em ordem de preferência para o projeto)

| Ferramenta | O que faz | Quando usar |
|---|---|---|
| `Marker` | PDF escaneado → Markdown estruturado. Estado da arte 2024. | Documentos longos com layout complexo (relatórios, prestações de contas) |
| `Surya` | OCR multilíngue moderno, base do Marker | PDFs com texto misturado com imagem |
| `pytesseract` + Tesseract | OCR clássico, gratuito, funciona bem para pt-BR | Alternativa simples se Marker for pesado demais (8GB RAM) |

**Recomendação para o hardware (8GB RAM, sem GPU):**
`Surya` roda em CPU mas é lento. `Marker` usa mais RAM. Começar por `pytesseract`
como fallback seguro e testar `Surya` em lotes pequenos.

### Fluxo proposto

```python
import pdfplumber

def extrair_pdf(arquivo_path):
    """Extrai texto de PDF — digital ou escaneado."""
    with pdfplumber.open(arquivo_path) as pdf:
        texto = ' '.join(p.extract_text() or '' for p in pdf.pages)
    
    if len(texto.strip()) < 100:  # PDF escaneado ou ilegível
        return extrair_ocr(arquivo_path)  # fallback para OCR
    return texto

def extrair_ocr(arquivo_path):
    """Fallback OCR para PDFs escaneados."""
    import pytesseract
    from pdf2image import convert_from_path
    
    imagens = convert_from_path(arquivo_path, dpi=300)
    return ' '.join(pytesseract.image_to_string(img, lang='por') for img in imagens)
```

### Branch: `claude/ocr-update`

```bash
uv add pytesseract pdf2image
# Tesseract precisa ser instalado via winget (não pip):
# winget install UB-Mannheim.TesseractOCR
```

**Scripts a atualizar:**
- `pipelines/extrair_urbes_contratos_pdf_ocr.py` (já usa OCR — atualizar)
- `tools/data/reparar_funserv_apr_ocr.py` (já usa OCR — atualizar)
- Qualquer script que use `pdfplumber` sem fallback

**Restrição:** instalar Tesseract via `winget install UB-Mannheim.TesseractOCR`,
não via pip. É um binário externo ao Python.

---

## Separação por modelo e sessão

| Item | Quem executa | Modelo | Sessão |
|---|---|---|---|
| Pesquisa BDD (já feita) | Claude | Opus | ✅ Esta sessão |
| Design do schema `.provenance.json` | Claude | Opus | ✅ Esta sessão (neste handoff) |
| Implementar `generate_provenance.py` | Claude ou Codex | Sonnet | Nova sessão `claude/linhagem-publica` |
| Implementar `registrar_hash()` | Claude ou Codex | Sonnet | Junto com linhagem |
| Atualizar scripts de coleta com hash | Codex | GPT | Handoff para Codex |
| Atualizar scripts OCR | Claude ou Codex | Sonnet | Nova sessão `claude/ocr-update` |
| Validar provenance antes de publicar | Claude | Opus | Portão de publicação |
| Link "Ver fonte" no frontend | Vitrúvio | Sonnet | Sessão de frontend |

### O que Claude Desktop (Chat/Cowork) faz neste handoff
- ✅ Definiu schema de linhagem
- ✅ Definiu política pública (CC BY 4.0, provenance.json obrigatório)
- ✅ Identificou quais scripts precisam de OCR
- ✅ Recomendou ferramentas por hardware

### O que outra sessão faz
- Implementa os scripts
- Commita nos branches corretos
- Testa com arquivos reais de Sorocaba/Paulínia
