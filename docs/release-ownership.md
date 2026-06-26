# Ownership de Commit, Push e Deploy

Este documento define como Codex e Claude fecham trabalho sem misturar escopos.
Ele prevalece sobre instrucoes antigas quando houver conflito.

## Principio

- Cada agente commita apenas o proprio diff.
- Cada agente pode fazer push apenas quando o branch estiver limpo, alinhado com
  `origin/main` e o push contiver somente commits que ele revisou.
- Deploy so ocorre depois de push validado e autorizacao explicita do usuario.
- Deploy manual via `vercel deploy --prod --yes` esta bloqueado enquanto
  `STATUS.md` mantiver esse comando como blocker.

## Dono Por Escopo

| Escopo | Dono primario | Revisao obrigatoria |
|---|---|---|
| Refatoracao, bugs, testes, CI, gates, seguranca de codigo | Codex | Codex self-review; Claude se houver metodologia/UI |
| Coleta, cron, manifests, dados publicados, Playwright operacional | Claude Coleta e Publicacao | Codex se houver codigo, automacao ou risco de seguranca |
| UI/UX, copy, SEO editorial, acessibilidade, documentos longos | Claude UI/UX | Codex se houver TS/Next substancial, performance ou contrato de dados |
| Deploy, Vercel, GitHub Actions, release publica | Agente que produziu o lote autorizado | Codex valida gates tecnicos; usuario autoriza acao externa |

## Checklist Antes De Commit

- `git status -sb` revisado.
- Diff limitado a um escopo e um dono.
- Nenhuma alteracao nao relacionada foi incluida.
- Gates da area afetada rodaram e passaram.
- `tools/agents/check-commit-gate.py --staged` passou.
- Mensagem de commit termina com assinatura do agente/modelo/effort.

## Checklist Antes De Push

- Working tree limpo.
- `git fetch origin main` executado.
- Branch nao esta atras de `origin/main`.
- Commits locais foram listados e revisados.
- `tools/agents/check-release-readiness.py --stage push` passou.
- Usuario autorizou push, salvo instrucao explicita previa para este lote.

## Checklist Antes De Deploy

- Push ja confirmado no remoto.
- `tools/agents/check-release-readiness.py --stage deploy` passou.
- Vercel/GitHub Actions revisados sem usar secrets no terminal.
- Usuario autorizou deploy.
- Se a integracao GitHub/Vercel for o caminho ativo, aguardar/inspecionar o
  deploy automatico em vez de rodar deploy manual.

## Regra De Fronteira

Se um agente precisar publicar commits de outro, deve dizer explicitamente:

- quais commits sao seus;
- quais commits sao do outro agente;
- quais validacoes cobrem cada grupo;
- por que e seguro empurrar o lote inteiro.

Sem essa declaracao, o agente so pode publicar o proprio trabalho.
