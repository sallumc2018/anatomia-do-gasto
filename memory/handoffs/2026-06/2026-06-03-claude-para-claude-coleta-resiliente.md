# Handoff: Coleta resiliente — formatos, encoding e portais protegidos
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Sonnet (sessão dedicada)
**Decisões aprovadas por:** Alexandre Sallum em 2026-06-03
**Branch:** `claude/coleta-resiliente` (ou agrupar com `claude/tenacity-retry`)

---

## Os 8 itens

### 1. `curl-cffi` — bypass WAF sem browser completo
**Problema:** alguns portais bloqueiam `requests` por fingerprint HTTP mas não chegam
a exigir JavaScript. Playwright é pesado demais para esses casos.
**Solução:** `curl-cffi` imita o fingerprint TLS do Chrome, passando pelo WAF sem
abrir browser.
```python
from curl_cffi import requests as curl
response = curl.get(url, impersonate="chrome120")
```
**Candidatos:** portais que retornam 403 com `requests` mas funcionam no browser.
**Instalar:** `uv add curl-cffi`

---

### 2. `fake-useragent` — rotação de User-Agent
**Problema:** portais que bloqueiam por repetição de `python-requests/2.x` no header.
**Solução:** rotação automática de User-Agent real (Chrome, Firefox, Safari).
```python
from fake_useragent import UserAgent
ua = UserAgent()
headers = {"User-Agent": ua.random}
requests.get(url, headers=headers)
```
**Instalar:** `uv add fake-useragent`

---

### 3. `dbfread` — formato DBF legado
**Problema:** sistemas municipais antigos exportam em DBF (dBASE). Nenhum script
atual lida com esse formato.
**Solução:**
```python
from dbfread import DBF
import pandas as pd
df = pd.DataFrame(iter(DBF('arquivo.dbf', encoding='latin-1')))
```
**Quando usar:** só instalar quando encontrar um arquivo `.dbf` real. Adicionar ao
pipeline de detecção de formato junto com o item 4 abaixo.
**Instalar:** `uv add dbfread`

---

### 4. ZIP com conteúdo misto — padrão de descompactação
**Problema:** portais servem ZIPs contendo CSV + PDF + XLS misturados. Scripts atuais
assumem um formato por arquivo.
**Solução:** padrão de detecção automática (sem nova dependência — stdlib pura):
```python
import zipfile
from pathlib import Path

def processar_zip(zip_path, destino):
    with zipfile.ZipFile(zip_path) as z:
        for nome in z.namelist():
            ext = Path(nome).suffix.lower()
            z.extract(nome, destino / ext.lstrip('.'))
            # arquivos organizados por tipo: destino/csv/, destino/pdf/, etc.
```
**Não requer instalação** — `zipfile` é stdlib Python.

---

### 5. `pandas.read_html()` — tabelas HTML sem download
**Problema:** portais que só exibem dados em HTML sem opção de exportar.
**Solução:** uma linha extrai todas as tabelas de uma página:
```python
import pandas as pd
tabelas = pd.read_html("https://portal.municipio.sp.gov.br/despesas")
df = tabelas[0]  # primeira tabela encontrada
```
**Quando usar:** antes de escrever um Playwright para um portal, testar
`read_html()` — se funcionar, é muito mais simples.
**Não requer instalação** — já está no pandas.

---

### 6. `filetype` — detectar tipo pelo conteúdo, não pela extensão
**Problema:** portais servem PDFs com extensão `.aspx` ou sem extensão.
`pdfplumber` quebra tentando abrir arquivo com extensão errada.
**Confirmado:** Querido Diário usa exatamente isso no `QueridoDiarioFilesPipeline`.
```python
import filetype
kind = filetype.guess(response.body[:261])  # só primeiros 261 bytes
ext = f".{kind.extension}" if kind else ""
```
**Instalar:** `uv add filetype`

---

### 7. `charset-normalizer` — encoding automático de CSVs
**Problema:** arquivos do governo frequentemente vêm em Latin-1/ISO-8859-1.
Scripts com `encoding='utf-8'` quebram nesses arquivos.
**Solução:**
```python
from charset_normalizer import from_path
resultado = from_path("arquivo.csv").best()
encoding = resultado.encoding  # ex: 'iso-8859-1'
df = pd.read_csv("arquivo.csv", encoding=encoding)
```
**Instalar:** `uv add charset-normalizer`
(`chardet` é alternativa mas charset-normalizer é mais preciso e já é dependência do requests)

---

### 8. `tqdm` — progresso visível em coletas longas
**Problema:** URBES teve 241 PDFs para processar. Sem progresso visível, impossível
saber se travou ou está rodando. Especialmente crítico no hardware limitado (8GB RAM).
**Solução:**
```python
from tqdm import tqdm
for arquivo in tqdm(lista_arquivos, desc="Processando PDFs URBES"):
    processar(arquivo)
```
**Instalar:** `uv add tqdm`

---

## O que fazer na sessão

```bash
uv add curl-cffi fake-useragent dbfread filetype charset-normalizer tqdm
# zipfile e pandas.read_html não precisam de instalação
```

1. Adicionar `filetype` + `charset-normalizer` ao pipeline de ingestão padrão
2. Adicionar `tqdm` nos scripts com listas longas (baixar_pdfs, extrair_urbes_contratos_pdf_ocr)
3. Adicionar `fake-useragent` nos scripts que recebem 403 esporádico
4. Documentar `curl-cffi` como alternativa ao Playwright para WAF leve
5. Adicionar padrão ZIP ao extrator genérico

## Nota: XML (lxml/xmltodict)
Não instalar agora. Se encontrar arquivo `.xml` num município futuro, ver IDEAS.md
— a entrada `lxml + xmltodict para XML fiscal` tem as instruções.

## Restrições
- `uv add` — nunca npm
- `dbfread`: só instalar quando houver um arquivo DBF real para testar
- NÃO substituir Playwright onde já funciona — `curl-cffi` é complemento
