# Anatomia do Gasto — contexto para Claude

## Paths críticos
- **Source of truth:** `C:\projetos\anatomia-do-gasto\frontend\`
- **node_modules:** junto com o projeto em `frontend\node_modules\` (não versionar)
- **Dados saúde:** `C:\projetos\anatomia-do-gasto\sorocaba\saude\saida`
- **Dados educação:** `C:\projetos\anatomia-do-gasto\sorocaba\educacao\saida`
- **Repositório:** `github.com/sallumc2018/anatomia-do-gasto` (privado)

## Rodar o projeto
```powershell
cd "C:\projetos\anatomia-do-gasto\frontend"
.\dev.ps1   # sobe o Next.js dev server
```
Instalar pacote: `cd "C:\projetos\anatomia-do-gasto\frontend"; npm install <pacote>`

## Stack
- Next.js + TypeScript + Recharts
- IBM Plex Sans (300/400/600) + IBM Plex Mono (números)
- Carbon Gray-100 dark theme — sem light mode
- Cor de destaque: `--blue-60: #0f62fe` (usar com parcimônia)

## Regra de importação (importante)
- `lib/types.ts` — browser-safe (interfaces + labels). Usar em client components.
- `lib/data.ts` — server only (usa `fs`/`path`). NUNCA importar em `"use client"`.

## Design — proibido
Gradientes, glassmorphism, border-radius > 4px em tiles de dados, animações de entrada, slogans vagos.

## Nome do projeto
**Anatomia do Gasto** — "Cidadão Nota 10" foi descartado. Não usar o nome antigo em código.

## Pipeline Python (dados)
- Scripts em `C:\projetos\anatomia-do-gasto\scripts\`
- Usar sempre `.\venv\Scripts\python.exe` (não `python`)

```powershell
cd "C:\projetos\anatomia-do-gasto"
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025
# flags: --pular-download  --forcar
.\venv\Scripts\python.exe scripts\testes\verificar_dados.py --ano 2025
```

**Saúde — anos disponíveis:** 2020 ✅ 2021 ✅ 2022 ✅ 2023 ✅ 2024 ✅ 2025 ✅ (3 quadrimestres cada)
**Educação — anos disponíveis:** 2024 ✅ 2025 ✅ (4 trimestres cada; 2020–2023 vazios no portal)

**Armadilha:** PDF saúde 2023 Q2 tem formato RTL (texto invertido). Já tratado automaticamente — detecta "abacoroS" e ativa branch invertido. Se novo PDF retornar 0 linhas, verificar esse padrão primeiro.

## Áreas implementadas
- **Saúde:** home + relatório por ano (2020–2025), RREO Anexo 12, receitas SUS, comparativo YoY
- **Educação:** home + relatório por ano (2024–2025), mínimo 25% Art. 256 CE-SP, trimestral

## Páginas disponíveis
- `/` — home com gráficos comparativos
- `/saude` e `/saude/relatorio/[ano]`
- `/educacao` e `/educacao/relatorio/[ano]`
- `/sobre` e `/metodologia`

## Pendências conhecidas
- Deploy (Vercel é o caminho natural)
- Integrar educação ao pipeline.py
- Path traversal no parâmetro [ano]: validar que é número de 4 dígitos
