---
description: Goal protocol - define objective, success criteria, routing package, and learning signal
allowed-tools: Read, Glob, Grep, PowerShell
---

Voce esta no protocolo **Goal** do Anatomia do Gasto.
Pedido recebido: **$ARGUMENTS**

`/goal` nao e uma skill do Codex. Neste projeto, `/goal` e um slash command local para transformar um pedido amplo em objetivo verificavel, pacote minimo e sinal de aprendizado para o Maestro.

Contrato: siga `memory/agents/registry.csv`. Quando reduzir contexto, consulte `tools/memory/query-rag.py`; RAG nao substitui leitura direta dos arquivos. Registre handoff reutilizavel com `tools/memory/write-handoff.py` quando houver continuidade util.

Leia tambem `memory/agents/maestro-learning.md` quando o objetivo puder gerar uma licao de roteamento.

## Funcao

Converter o pedido em:

```text
Goal:
Resultado verificavel:
Nao-objetivos:
Gates:
Agente inicial:
Pode ler:
Pode alterar:
Validacao:
Sinal de aprendizado:
```

## Regras

- Nao executar trabalho de especialista.
- Nao autorizar publicacao, commit, push, deploy, instalacao ou acao destrutiva.
- Nao incluir historico completo quando objetivo, paths e trechos bastarem.
- Se o pedido for pequeno e local, responder que `/goal` e dispensavel.
- Se o Maestro errar rota ou contexto, registrar uma candidata em `memory/agents/maestro-learning-log.csv` somente se o conteudo for publico e sanitizado.

## Saida

```text
## Goal
- Objetivo:
- Sucesso:
- Fora de escopo:
- Rota:
- Pacote minimo:
- Validacao:
- Sinal de aprendizado:
- Proximo passo:
```

