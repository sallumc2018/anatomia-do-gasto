# Ferramentas de Desenvolvimento

Scripts de automação e manutenção para o projeto Anatomia do Gasto.

## regenerar_readme.py

Regenera automaticamente as seções dos READMEs marcadas com tags AUTO.

### Uso

```bash
# Atualizar todos os READMEs com AUTO sections
python tools/dev/regenerar_readme.py

# Verificar se READMEs estão sincronizados (modo CI)
python tools/dev/regenerar_readme.py --check
```

### Seções Auto-Regeneráveis

As seções dinâmicas são delimitadas por:

```html
<!-- AUTO:nome-start -->
conteúdo gerado automaticamente
<!-- AUTO:nome-end -->
```

Tags disponíveis:

- `coverage` — cobertura de cidades, contagem de datasets publicados/validados, data da última atualização
- `activity` — últimos 10 commits do repositório

### Fontes Autoritativas

- `data/manifests/datasets.csv` — estado dos datasets publicados
- `pipelines/paths.py` — lista de cidades cobertas (MUNICIPIOS registry)
- `git log` — histórico de commits

### Princípios

- **Idempotente**: rodar múltiplas vezes produz o mesmo resultado.
- **Conservador**: só altera conteúdo entre as tags AUTO; tudo fora delas é seguro para edição manual.
- **CI-safe**: modo `--check` retorna exit code 1 se houver dessincronização.

## sync-wsl-mirror.ps1

Quando o checkout no WSL for usado apenas como backup ou ambiente espelho do Windows/GitHub, sincronize com:

```powershell
powershell -ExecutionPolicy Bypass -File tools\dev\sync-wsl-mirror.ps1
```

Esse script busca `origin/main` no WSL e faz `reset --hard` do checkout Linux para esse estado.

## Status

<!-- AUTO:coverage-start -->
**Cobertura atual:**

- **Cidades:** Sorocaba
- **Datasets publicados:** 51
- **Datasets em validação:** 2
- **Atualizado em:** 2026-05-24
<!-- AUTO:coverage-end -->
