# Política de Segurança — O que nunca commitar

## Regra de ouro

**Se tiver dúvida se pode commitar, não commita.**  
Consulte este documento ou abra uma nova conversa Claude Code para decidir.

## Nunca commitar — dados pessoais

| Tipo | Exemplos |
|------|----------|
| Documentos pessoais | CPF, RG, CNH, passaporte de cidadão privado |
| Saúde | Laudos médicos, prontuários, relatórios psiquiátricos |
| Privacidade | Endereço residencial, telefone pessoal, e-mail privado |
| Financeiro pessoal | Extratos bancários, declarações IR de pessoa física privada |
| Diário/memórias | Diário pessoal, registros operacionais internos |

**Exceção**: dados de agentes públicos no exercício do cargo (nome, cargo, remuneração) são públicos por lei (LAI).

## Nunca commitar — credenciais e segredos

| Tipo | Padrão de detecção |
|------|-------------------|
| GitHub tokens | `ghp_*`, `github_pat_*` |
| OpenAI/Anthropic keys | `sk-*` |
| AWS keys | `AKIA[0-9A-Z]{16}` |
| JWTs | `eyJ*.eyJ*` |
| Chaves SSH/TLS | `-----BEGIN ... PRIVATE KEY-----` |
| Arquivos .env | `.env`, `.env.local`, `.env.production` |
| Credenciais Google | `credentials.json` (OAuth2) |
| Recovery codes | qualquer arquivo com "recovery_codes" no nome |

O hook `pre-commit` detecta automaticamente os padrões acima.

## Nunca commitar — prompts e memórias internas

| Tipo | Motivo |
|------|--------|
| Prompts internos de AI (`CLAUDE.md` privado) | Revelar estratégia operacional |
| Memórias Claude (`~/.claude/projects/`) | Contém contexto privado e pessoal |
| Planos de negócio privados | Informação sensível do projeto |
| Handoffs internos com dados pessoais | Cruzamento de informações privadas |

## O que SIM pode commitar

- Dados públicos já publicados (portais governamentais abertos)
- Código de pipelines (sem credenciais hardcoded)
- Documentação pública do projeto
- Dados de servidores públicos (cargo, remuneração, despesas no exercício)
- Manifests e schemas de dados públicos

## Processo de remediação (se dado sensível entrar no repo)

1. **NÃO fazer git push** — se ainda local, o dano é reversível
2. Remover da staging area: `git restore --staged <arquivo>`
3. Se já commitado mas não pushado: `git reset HEAD~1` (nunca `--hard` sem backup)
4. Se já pushado: avisar o responsável, considerar `git filter-repo` e rotacionar credenciais

## Verificações automáticas

| Hook | Quando | O que verifica |
|------|--------|----------------|
| `pre-commit` | Antes de cada commit | Caminhos privados + padrões de token no diff |
| `commit-msg` | Antes de aceitar mensagem | Assinatura `[CLI > Modelo > Esforço]` |
| `pre_publicacao.py` | Antes de promover para data/public | Schema, mock data, mínimo de linhas |
| `pre_deploy.py` | Antes de `vercel deploy` | Manifests, score, working tree, Lambda tracing |
