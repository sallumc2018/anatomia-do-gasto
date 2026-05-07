# Ferramentas de ambiente

Scripts locais para manter os ambientes do projeto alinhados.

## WSL como espelho

Quando o checkout no WSL for usado apenas como backup ou ambiente espelho do Windows/GitHub, sincronize com:

```powershell
powershell -ExecutionPolicy Bypass -File tools\dev\sync-wsl-mirror.ps1
```

Esse script busca `origin/main` no WSL e faz `reset --hard` do checkout Linux para esse estado.
