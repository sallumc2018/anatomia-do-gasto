# Pipeline Anatomia do Gasto — Visão Geral

## Arquitetura de pipelines

```
Fontes externas
  │
  ▼
[baixar_*.py]          → data/raw/          (gitignored)
  │
  ▼
[extrator_*.py]        → data/extracted/    (gitignored)
  │
  ▼
[Gate: pre_publicacao] → validação de schema, fontes, mínimo de linhas
  │
  ▼
[publicar_dados.py]    → data/public/       (commitado ao repo)
  │
  ▼
[gerar_datasets_json]  → data/manifests/datasets_status.json
                       → apps/web/lib/datasets_status.json
  │
  ▼
[Gate: pre_deploy]     → manifests sync, score, working tree, tracing
  │
  ▼
[git commit + push]    → origin/main  (Claude Code via terminal)
  │
  ▼
[vercel deploy]        → anatomiadogasto.ong.br  (Antigravity EXCLUSIVAMENTE)
```

## Roteamento de CLIs

| Tarefa | CLI | Por quê |
|--------|-----|---------|
| Analisar dados, auditar, revisar metodologia | **Claude Code** | raciocínio legal/LGPD, análise longa |
| Escrever pipelines Python, componentes Next.js | **Codex** | refatoração multi-arquivo |
| Executar deploy, pipelines, git push | **Antigravity** | comandos de sistema e infra |

## Documentos deste diretório

| Arquivo | Conteúdo |
|---------|----------|
| [01-dados.md](./01-dados.md) | Coleta → publicação de dados |
| [02-deploy.md](./02-deploy.md) | Deploy Vercel passo a passo |
| [03-ai-routing.md](./03-ai-routing.md) | Roteamento de AI por tarefa |
| [04-seguranca.md](./04-seguranca.md) | Política de segurança e o que nunca commitar |

## Convenções obrigatórias

- Todo commit: assinatura `[CLI > Modelo > Esforço]` no final da mensagem
- Todo CSV publicado: deve ter pelo menos uma entrada em `mapa_cobertura.csv`
- Todo deploy: executar `python3 tools/gates/pre_deploy.py` antes
- Dado ausente ≠ zero: campos sem dado ficam vazios ou null, nunca `0`
