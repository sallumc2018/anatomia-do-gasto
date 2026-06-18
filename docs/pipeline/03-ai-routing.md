# Roteamento de AI — Runbook

## Os três ecossistemas

### Claude Code (este CLI)
**Papel neste projeto**: pensar, revisar, documentar, arquitetar.

| Tipo de tarefa | Modelo | Esforço |
|---|---|---|
| Análise de cobertura, gaps, manifests | `claude-sonnet-4-6` | Medium |
| Revisão legal: LAI, LGPD, transparência | `claude-sonnet-4-6` | Medium |
| Auditoria de segurança, ameaças, CVEs | `claude-opus-4-8` | High |
| Arquitetura de pipeline, decisões de design | `claude-sonnet-4-6` | Medium |
| Escrita de documentação longa | `claude-sonnet-4-6` | Medium |

**NÃO usar para**: deploy, execução de pipelines Python, git push, npm install.

### Codex (IDE/API)
**Papel neste projeto**: escrever e refatorar código.

| Tipo de tarefa | Modelo | Esforço |
|---|---|---|
| Pipelines Python novos (DuckDB, APIs) | `GPT-5.5` | Medium |
| Componentes Next.js / TypeScript | `GPT-5.5` | Medium |
| Refatoração multi-arquivo | `GPT-5.5` | High |
| Queries e transformações de dados | `GPT-5.5` | Medium |

**NÃO usar para**: análise legal, auditorias de segurança, decisões de arquitetura.

### Antigravity (CLI / Agent Mode)
**Papel neste projeto**: executar, deployar, integrar.

| Tipo de tarefa | Modelo | Esforço |
|---|---|---|
| `git push origin main` | `Gemini 3.5 Flash` | Low |
| `npx vercel deploy --prod --yes` | `Gemini 3.5 Flash` | Low |
| Execução de pipelines Python | `Gemini 3.5 Flash` | Low/Medium |
| Playwright e scraping | `Gemini 3.5 Flash` | Medium |
| Debugging de race conditions/infra | `Claude Opus 4.6 (Thinking)` | High |

**EXCLUSIVO para**: deploy Vercel, git push, npm install, pipelines de sistema.

## Regras de handoff

1. **Claude Code → Antigravity**: quando a saída é um comando de sistema
2. **Claude Code → Codex**: quando a saída é código multi-arquivo
3. **Codex → Antigravity**: quando o código está pronto para execução
4. **Antigravity → Claude Code**: quando o resultado precisa de análise/interpretação

## Assinatura de commits por CLI

Cada CLI assina seus commits de forma rastreável:

```
[Claude Code > claude-sonnet-4-6 > Medium]
[Codex > GPT-5.5 > High]
[Antigravity > Gemini 3.5 Flash > Low]
[Claude > claude-opus-4-8 > High]
```

Formato validado pelo hook `commit-msg` (Husky).

## Escalonamento

| Situação | Ação |
|---|---|
| Decisão de escopo de dados | Claude Code Opus |
| Bug em pipeline Python em produção | Codex → Antigravity verifica logs |
| Deploy falhou com > 250MB | Claude Code analisa → Codex corrige config → Antigravity re-deploya |
| Dado sensível detectado em staged | Claude Code decide — NÃO commitar |
