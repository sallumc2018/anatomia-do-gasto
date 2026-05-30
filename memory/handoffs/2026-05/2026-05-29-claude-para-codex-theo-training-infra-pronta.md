---
id: 2026-05-29-claude-para-codex-theo-training-infra-pronta
date: 2026-05-29
agent: Claude Code
status: active
visibility: public
---

# Handoff - Claude -> Codex

- Scope: setup completo da infraestrutura de aprendizado autônomo do Théo + redução de permission prompts
- Done:
  - Scaffolding completo de Théo learning (espelhado no padrão Maestro)
  - Confiança inicial Théo: C0 (manual / log-only)
  - 40 cases de treino seedadas (37 in-scope + 3 off-scope)
  - 1 ciclo de treino rodado: 1 good, 26 candidate_keyword, 11 candidate_route, 2 scope_leak
  - Théo registrado em registry.csv (22 -> 23 agentes)
  - Maestro command atualizado com seção "Agente em Treinamento" e roteamento /theo
  - settings.json em C:/Omega/.claude expandido (54 -> 94 entradas) para reduzir prompts durante turno noturno
- Output:
  - memory/agents/theo-learning.md
  - memory/agents/theo-confidence-{state,levels}.csv
  - memory/agents/theo-learning-log.csv (39 entradas)
  - memory/training/theo/{README,scope,promotion-criteria}.md
  - memory/training/theo/cases.csv (40)
  - memory/training/theo/routes-snapshot.json (24 rotas)
  - tools/agents/eval-theo-training.py (eval estático)
  - tools/agents/train-theo.py (cycle, summary, refresh-snapshot)
  - .claude/commands/theo.md
- Validation:
  - python tools/agents/validate-agent-contracts.py -> OK (22 agents; Théo aderente)
  - python tools/agents/eval-theo-training.py -> OK (40 cases, 24 rotas, C0)
  - python tools/agents/train-theo.py --cycle -> exit code 2 (intencional: 2 scope leaks flagados em T-037 "o prefeito atual e quem", T-035 "quanto ganha o prefeito")
- Blockers:
  - Cobertura LAI no Théo: zero rotas dedicadas (todas as 6 cases de LAI cairam em fallback ou mismatch)
  - Cobertura GitHub-specifics no Théo: 6 candidatos de keyword (fork, issue, PR, licença, audit)
  - 2 scope leaks: queries sobre "prefeito" cruzam fiscal e auditoria-dados — precisa decisão sobre filtragem off-scope explícita
- Next step (Codex):
  - Avaliar candidatos em memory/agents/theo-learning-log.csv (39 candidatos)
  - Decidir se LAI vira rota nova dedicada ou expansão de auditoria-dados
  - Propor patch para scope leak (sugestão: adicionar pre-check off-scope por keyword)
  - Treinar Maestro em paralelo se quiser executar python tools/agents/eval-maestro-training.py
- Related paths:
  - apps/web/components/theo/theo-guide.tsx (24 rotas atuais — fonte canônica)
  - memory/agents/theo-* (todos)
  - memory/training/theo/* (todos)
  - tools/agents/{eval,train}-theo-training.py
  - .claude/commands/theo.md
  - .claude/commands/maestro.md (seção "Agente em Treinamento")
  - C:/Omega/.claude/settings.json (94 entradas)

## Protocolo de troca contínua (acordado com usuário)

Claude e Codex devem ficar em standby trocando informações via handoffs públicos sanitizados. A cada ciclo:

```powershell
git status -sb
Get-ChildItem memory\handoffs\2026-05 | Sort-Object LastWriteTime -Descending | Select-Object -First 5
python tools/agents/validate-area.py --area agents
```

(Recomendação direta do Codex via usuário em 2026-05-29.)

## Regras do turno noturno (do handoff anterior do Codex)

- Sem commit, push, deploy, publicação de dados, instalação de dependência
- Sem prompts de permissão (se algo pedir permissão, registrar como bloqueio aqui)
- Modo: treino + auditoria + handoff
- Final: relatório do Maestro com melhorias em dados, pipeline, frontend, Théo, Maestro, agentes, memória, segurança, GitHub, revisão, publicação, deploy, documentação, operação local

## Sinal para próximo Claude/Codex

Théo training infra está PRONTA e rodando. Maestro treinou Théo com sucesso (C0 produziu primeiros 37 candidatos sanitizados). Próximo ciclo pode focar em:

1. (Codex) Revisar candidatos e propor patches em ordem de impacto
2. (Claude) Continuar Maestro training (cases.csv pode crescer com cenários novos)
3. (Ambos) Documentar primeiros aprendizados de roteamento em memory/agents/maestro-learning-log.csv

Aprendizado registrável agora: a infra de aprendizado Théo segue o mesmo padrão Maestro (state/levels/log/training/snapshot/eval/cycle), o que sugere um GENERAL PATTERN para futuros agentes aprendizes (ex.: Plínio, Frontino, Catão eventualmente). Isso poderia virar `memory/agents/learning-pattern.md`.
