# Governanca DevOps - 2026-06-01

Escopo: regras de commit, GitHub Actions, Vercel, VS Code, seguranca de dependencias e gates locais.

## Estado corrigido

- Commit local passa a ser permitido ao fim de bloco completo, validado, revisado e publicamente auditavel.
- Push, deploy, publicacao em `data/public`, infraestrutura, GitHub/Vercel settings e credenciais continuam exigindo autorizacao explicita.
- `sync-docs.yml` foi rebaixado para check read-only de README gerado.
- `sorocaba-pipeline.yml` foi rebaixado para piloto manual PNCP sem commit/push remoto.
- A documentacao da Vercel foi corrigida: a integracao GitHub pode existir para previews/checks, mas nao substitui gate local nem autorizacao de producao.

## Onde a governanca falhava

1. A regra antiga bloqueava commit local mesmo quando o bloco estava pronto. Isso criava worktrees grandes e aumentava risco de misturar mudancas de agentes diferentes.
2. `sync-docs.yml` tinha `contents: write`, commit e push automatico. Isso contornava o contrato local de revisao.
3. `sorocaba-pipeline.yml` tinha cron, `contents: write`, escrita em `data/public`, commit e push automatico. Isso contrariava a regra de publicacao explicita.
4. A documentacao dizia que a integracao GitHub da Vercel nao era usada, mas metadados recentes de deploy indicavam GitHub Integration ativa.
5. Git nao esta configurado com assinatura criptografica local (`commit.gpgsign`/SSH signing nao aparecem no config). A assinatura vigente e operacional: autor do commit + provenance em `memory/provenance/changes.csv`.
6. VS Code esta configurado com Prettier e `formatOnSave`, mas o CI nao tem um check Prettier dedicado. Hoje a qualidade de frontend depende de ESLint/build.
7. Hooks locais existem em `tools/hooks`, mas hooks Git versionados/instalados nao aparecem como contrato central. A protecao principal vem de scripts e validadores.

## Decisoes recomendadas

- Manter commits locais atomicos por agente e por bloco validado.
- Manter push/deploy somente com autorizacao explicita.
- Usar GitHub Actions remotas como check/read-only, nao como publicadoras.
- Se for exigir assinatura criptografica, configurar SSH/GPG signing no Git local e documentar no `docs/revisao-pares-github.md`.
- Adicionar um check Prettier somente se o custo de churn for aceitavel; por ora, ESLint/build e `.gitattributes` cobrem o principal.
