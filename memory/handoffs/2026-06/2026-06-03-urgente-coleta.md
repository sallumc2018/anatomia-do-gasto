# Handoff URGENTE: Coleta — o que falta agora
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet — branch `claude/coleta-resiliente`
**Prioridade:** Alta — 22 scripts sem proteção, filetype/charset já causam falhas silenciosas

---

## Estado atual (auditado em 2026-06-03)

| Biblioteca | Scripts com | Scripts sem |
|---|---|---|
| `tenacity` (retry) | 8 (Fase 1 feita pela outra sessão) | **22 restantes** |
| `filetype` | 0 | todos |
| `charset-normalizer` | 0 | todos |
| `tqdm` | 0 | todos |

Scripts **sem tenacity** que usam requests/urllib (22):
```
baixar_cepa_emendas.py, baixar_despesas_gabinete_camara.py,
baixar_fontes_execucao.py, baixar_funserv.py, baixar_pdfs.py,
baixar_pdfs_educacao.py, baixar_pncp_sorocaba.py,
baixar_saae_dados_abertos.py, baixar_sorocaba_prefeitura.py,
baixar_tce_sorocaba.py, baixar_transferencias_estaduais_sp.py,
baixar_urbes_transparencia.py, extrair_alertas_sdg_tce.py,
extrair_contratos.py, extrair_despesa_orcamentaria_fatiada.py,
extrair_despesas_gabinete_camara.py, extrair_urbes_contratos_pdf_ocr.py
+ 5 Playwright (NÃO adicionar tenacity — têm retry próprio)
```

---

## O que fazer

### Passo 1 — Completar tenacity (Fase 2)
```bash
uv add tenacity  # já instalado se Fase 1 foi feita
```
Padrão aplicado na Fase 1 (copiar para os demais):
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    retry=retry_if_exception_type((requests.Timeout, requests.ConnectionError))
)
def fetch(url, **kwargs):
    return requests.get(url, timeout=30, **kwargs)
```
Verificar como foi implementado na Fase 1 antes de replicar.
**NÃO aplicar** nos 5 scripts Playwright.

### Passo 2 — filetype + charset-normalizer (em todos os scripts)
```bash
uv add filetype charset-normalizer
```
Adicionar ao pipeline de ingestão como utilitário compartilhado (`pipelines/utils.py`):
```python
import filetype
from charset_normalizer import from_path

def detectar_tipo(caminho):
    kind = filetype.guess(caminho)
    return kind.extension if kind else None

def ler_csv_com_encoding(caminho):
    import pandas as pd
    resultado = from_path(caminho).best()
    enc = resultado.encoding if resultado else 'utf-8'
    return pd.read_csv(caminho, encoding=enc)
```

### Passo 3 — tqdm nos scripts com listas longas
```bash
uv add tqdm
```
Prioridade: `extrair_urbes_contratos_pdf_ocr.py`, `baixar_pdfs.py`, `baixar_pdfs_educacao.py`

### Passo 4 — fake-useragent + curl-cffi
```bash
uv add fake-useragent curl-cffi
```
Aplicar onde há 403 esporádico. Documentar em comentário qual portal exige.

### Passo 5 — padrão ZIP misto (sem nova lib)
Criar `pipelines/utils.py` com função `processar_zip()`:
```python
import zipfile
from pathlib import Path

def processar_zip(zip_path, destino):
    with zipfile.ZipFile(zip_path) as z:
        for nome in z.namelist():
            ext = Path(nome).suffix.lower().lstrip('.')
            pasta = Path(destino) / ext
            pasta.mkdir(parents=True, exist_ok=True)
            z.extract(nome, pasta)
```

---

## Criar `pipelines/utils.py`
Centralizar as funções repetidas nos 26 scripts:
- `fetch()` com tenacity
- `detectar_tipo()`
- `ler_csv_com_encoding()`
- `processar_zip()`
- `registrar_hash()` (ver handoff linhagem)
- `barra_progresso()` wrapper do tqdm

Isso elimina a duplicação atual e facilita auditoria.

## Restrições
- NÃO tocar nos 5 scripts Playwright
- `uv add` — nunca pip standalone, nunca npm
- Commitar com `[Claude]` após validar cada grupo de scripts
