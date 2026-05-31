# Política de Segurança de Pacotes — Anatomia do Gasto

Documento criado em 2026-05-29 por Catão (watchdog de segurança).
Motivação: alerta operacional registrado em mai/2026 sobre risco elevado em npm. Política estende
a disciplina de auditoria para todos os gerenciadores de pacotes (pip, winget).

## Regra central

> **Nenhum pacote entra no ambiente de produção sem registro prévio em `requirements-audit.txt`.**

Isso inclui pip, winget e qualquer instalador de dependências.

## Níveis de risco

| Nível | Critério | Exemplo |
|---|---|---|
| **baixo** | Sem rede, sem exec/eval, wrapper de binário auditável | pytesseract, pdf2image |
| **médio** | Dependências transitivas complexas, ou acesso a filesystem | pandas, pydantic |
| **alto** | Rede + execução dinâmica, ou sem histórico de auditoria | pacote npm desconhecido |
| **bloqueado** | Qualquer pacote instalado sem seguir este fluxo | — |

## Fluxo de aprovação (obrigatório)

### 1. Avaliação estática (sem instalar)

```python
# Baixa o wheel e inspeciona sem executar
import urllib.request, zipfile, io

url = "https://files.pythonhosted.org/packages/..."  # URL do wheel no PyPI
data = urllib.request.urlopen(url, timeout=30).read()
zf = zipfile.ZipFile(io.BytesIO(data))
py_files = [n for n in zf.namelist() if n.endswith('.py')]

RISKS = ['exec(','eval(','__import__','subprocess','socket','requests','os.system']
for pf in py_files:
    src = zf.read(pf).decode('utf-8', errors='replace')
    hits = [r for r in RISKS if r in src]
    print(f"{pf}: hits={hits}")
```

### 2. Checklist de aprovação

- [ ] Mantenedor verificado no PyPI (nome real, histórico público)
- [ ] Repositório GitHub ativo com histórico de commits
- [ ] Sem `exec()`, `eval()`, `__import__()` dinâmico ou acesso a rede no código-fonte
- [ ] Se usa `subprocess`: confirmar que o comando é fixo (não interpolado de input externo)
- [ ] Dependências transitivas mapeadas e avaliadas
- [ ] Hash SHA256 do wheel registrado

### 3. Registro em requirements-audit.txt

```text
package==versao \
    --hash=sha256:HASH
```

Os metadados de aprovacao (`aprovado`, `auditor`, `risco`, `nota`) ficam em comentarios separados para nao quebrar `pip install --require-hashes`.

### 4. Instalação

```powershell
# Apenas após registro no requirements-audit.txt
python -m pip install --require-hashes -r requirements-audit.txt
```

## Fluxo Docker (avaliação isolada — para pacotes de risco médio/alto)

Para pacotes que precisam ser *executados* antes da aprovação:

```powershell
# Container descartável, sem rede, sem acesso ao disco do projeto
docker run --rm --network=none -v ${PWD}/tools/security:/audit:ro -it python:3.12-slim bash

# Dentro do container:
pip download nome_pacote -d /tmp/audit --no-deps
cd /tmp/audit && python -c "
import zipfile, os
for whl in os.listdir('.'):
    if whl.endswith('.whl'):
        with zipfile.ZipFile(whl) as z: z.extractall('inspect_' + whl)
"
grep -r 'exec\|eval\|subprocess\|socket\|requests' inspect_*/
pip install nome_pacote
python -c "import nome_pacote; print('ok')"
# se OK: sair e registrar no requirements-audit.txt
```

**`--network=none`** é não-negociável: impede exfiltração de dados durante execução.

## Quem pode aprovar

| Decisão | Agente |
|---|---|
| Risco baixo (wrapper de binário) | Catão, após inspeção estática |
| Risco médio | Catão + revisão do Vitruvio |
| Risco alto | Catão + Vitruvio + aprovação explícita do usuário |
| npm (qualquer) | Aprovação explícita do usuário (worm ativo mai/2026) |

## Binários externos (winget)

Mesma disciplina: registrar em `requirements-audit.txt` com versão, origem e risco.
Prefer `winget` sobre instaladores manuais (fonte auditável, hash verificado pelo winget).

## Alertas permanentes

- **npm em modo restrito (mai/2026):** nunca `npm install/update/audit fix/npx` sem autorização explícita.
  Ver `docs/seguranca-dependencias-npm.md`.
- **MCP tools:** novos MCPs precisam de scan estático antes de qualquer execução.
  Auditados limpos (mai/2026): `context7@2.3.0`, `sequential-thinking`.

## Histórico de aprovações

Ver `requirements-audit.txt` (fonte canônica).
