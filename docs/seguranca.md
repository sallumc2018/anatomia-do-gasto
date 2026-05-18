# Segurança

Este documento descreve a política de segurança do Anatomia do Gasto e como reportar vulnerabilidades.

## Superfície de Ataque

Na versão atual, o site é gerado estaticamente pelo Next.js e servido pela Vercel. Não há:

- Banco de dados
- Sistema de login
- Entrada de usuário (formulários, uploads, comentários)

A superfície de ataque é mínima.

## Quando a Segurança se Torna Relevante

A superfície aumentará quando forem implementados:

- **Câmara 2 (Guarda de Moderadores):** autenticação de moderadores voluntários.
- **Câmara 3 (Praça Pública):** comentários de cidadãos, upload de documentos, login via gov.br.

Nesse momento, serão adotadas medidas adicionais:

- Autenticação via OAuth 2.0 (gov.br)
- Proteção contra CSRF e XSS
- Rate limiting em rotas públicas
- Validação e sanitização de entradas

## Como Reportar Vulnerabilidades

Se você encontrar uma falha de segurança, **não abra uma issue pública**.

Envie um e-mail para [contato@anatomiadogasto.ong.br](mailto:contato@anatomiadogasto.ong.br) com:

- Descrição clara da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestão de correção (se tiver)

O mantenedor responderá em até 72 horas.

## Práticas Atuais

- **Dependências:** atualizadas periodicamente com `npm update` e `pip install --upgrade`.
- **Variáveis de ambiente:** `.env.local` está no `.gitignore`.
- **HTTPS:** forçado pela Vercel (certificado automático).
- **Headers de segurança:** CSP básica, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS configurados no frontend.

## Princípio De Auditabilidade Independente

Toda decisão de tornar um dado público ou não público deve ser justificável por fonte independente.

Isso vale especialmente para:

- `data/raw`
- `data/extracted`
- `data/validated`

Regra prática:

- o fato de um arquivo existir localmente não basta para publicá-lo;
- o fato de a fonte original ser pública não basta para republicar a extração estruturada;
- a finalidade institucional e o risco de exposição adicional precisam estar documentados.

Ver [auditoria-seguranca-publicacao.md](C:/projetos/anatomia-do-gasto/docs/auditoria-seguranca-publicacao.md).
Ver tambem [politica-publicacao-dados.md](C:/projetos/anatomia-do-gasto/docs/politica-publicacao-dados.md).

## Colaboradores e Dispositivos Próprios

O projeto deve permitir colaboração a partir de computadores pessoais, tablets e ambientes WSL, mas sem compartilhar credenciais pessoais.

Regras operacionais:

- Cada colaborador deve usar sua própria conta GitHub e, quando necessário, seu próprio acesso Vercel.
- Senhas, tokens, chaves SSH, chaves ADB e arquivos `.env*` nunca devem ser versionados.
- O site oficial deve continuar lendo apenas `data/public`.
- Dados extraídos em `data/extracted` e dados validados em `data/validated` só viram publicação após validação local e cópia explícita para `data/public`.
- Dispositivos auxiliares, como tablets de campo, devem receber apenas dados públicos, documentação e backups sem segredos.

## Tablet Operacional

O tablet da ONG funciona como terminal de status e armazenamento portátil. A automação fica em `tools/tablet/`.

Política de segurança do tablet:

- O tablet armazena somente `docs`, `data/manifests`, `data/public` e backups públicos.
- Não copiar `.git`, `.env.local`, chaves SSH, chaves ADB, tokens, dumps pessoais ou dados não publicados.
- ADB deve ser usado apenas em computadores confiáveis.
- Se o tablet for perdido, revogar pareamentos ADB e trocar senhas usadas no Termux.
- O debloat usa `pm uninstall --user 0`, que remove apps para o usuário atual sem alterar a partição de sistema.

## Divulgação Responsável

Após a correção de uma vulnerabilidade, o mantenedor publicará um aviso no repositório (tag `security`) em até 30 dias, dando crédito ao reportador, se autorizado.

## Infraestrutura Local Do Tablet

- O estado local do ADB no Windows deve ficar em `C:\Omega\03_Ferramentas\infra\android-adb-home`, não em `C:\tmp`, para não ser apagado por rotinas de limpeza.
- Logs e inventários do tablet devem ficar em área persistente fora de `C:\tmp`, preferencialmente `C:\Omega\03_Ferramentas\infra\logs\tablet`.
- `C:\tmp` deve ser tratado como área descartável e nunca como armazenamento persistente de pareamentos ADB ou artefatos operacionais do tablet.
- O watchdog local de segurança fica em `tools/security/` e escreve status temporário em `C:\Omega\tmp\omega-security-*`.
- Alertas do watchdog podem ser enviados por email SMTP usando configuração local em `C:\Omega\03_Ferramentas\infra\omega-security-alerts.json` e credencial criptografada por usuário Windows em `C:\Omega\Sensivel\infra\secrets\`. Esses arquivos não pertencem ao repositório.
- O tablet pode receber cópia read-only do status do PC e do watchdog por `tools/tablet/update-tablet-status.ps1`, em `/sdcard/AnatomiaTerminal/`.
- Sem USB, o tablet deve receber status por SSH/SCP no Termux, com chave dedicada e fingerprint do host fixada em `C:\Omega\03_Ferramentas\infra\omega-tablet-ssh.json`. Não usar automação de tela nem sessão web para transportar status operacional.

## Pentest 2026-05-17 — Resultados e Riscos Aceitos

Pentest autorizado realizado em 2026-05-17 contra `https://www.anatomiadogasto.ong.br`. Todos os testes foram read-only. Resultados:

### Controles confirmados efetivos

| Controle | Resultado |
|----------|-----------|
| Path traversal na API `/api/dados/` | Bloqueado — todos os vetores retornam 404 |
| `.env`, `.git`, `package.json` via URL | Bloqueados — 404 |
| Clickjacking | Bloqueado — `X-Frame-Options: DENY` + `frame-ancestors 'none'` |
| HSTS | Ativo — `max-age=63072000; includeSubDomains; preload` |
| HTTP→HTTPS redirect | Ativo — 308 Permanent Redirect |
| Source maps | Não expostos — `.js.map` retorna 404 |
| `X-Powered-By` | Oculto — `poweredByHeader: false` funciona |
| `Permissions-Policy` | Ativo — câmera, microfone, geolocalização bloqueados |
| Supply chain npm | Limpo — nenhum indicador encontrado |
| Arquivos sensíveis versionados | Nenhum |

### Riscos aceitos (sem ação necessária agora)

**SRI ausente nos chunks JS (L2):** Chunks `_next/static/` servidos sem atributos `integrity`. Risco baixo porque são servidos do mesmo origin via TLS com ETag. Next.js não suporta SRI nativo para chunks gerados dinamicamente.

**`Server: Vercel` exposto (L3):** Vercel não permite ocultar esse header. Sem mitigação possível. Risco informacional.

**CDN cache stale (L4):** `Age` elevado nos headers indica conteúdo antigo no edge. Invalida automaticamente a cada deploy. Não é um risco de segurança.

**CSVs da API retornam 404 em produção (L5):** Os arquivos existem localmente mas o deploy atual é anterior aos commits pendentes. Resolve no próximo deploy sem nenhuma ação adicional.

### Itens com ação pendente (ao implementar Câmara 2)

- **`script-src 'unsafe-inline'` no CSP (H1):** Migrar para nonces quando houver input de usuário. Sem risco imediato (nenhum input renderizado ainda).
- **`Access-Control-Allow-Origin: *` (M1):** Intencional para site público sem autenticação. Restringir para domínio explícito antes de adicionar login. Documentado em `next.config.ts`.

## Gate Local Antes De Release

Antes de preparar release, push ou deploy do site, execute a auditoria local em modo read-only:

```powershell
powershell -ExecutionPolicy Bypass -File tools\security\check-site-local.ps1 -SkipBuild
```

Essa checagem falha quando scripts operacionais sensiveis de tablet/SSH/status sync aparecem como modificados ou untracked em `tools/tablet`, ou quando nomes tipicos de segredo, credencial, `known_hosts`, logs, screenshots, dumps e artefatos `omega-*` aparecem no pacote local.

Scripts de setup SSH, status sync, firewall e hardening sao operacao local. Eles nao devem entrar inadvertidamente em release do site; quando precisarem ser versionados, devem passar por revisao separada e autorizacao explicita.

Quando a validacao for explicitamente apenas do site, sem empacotar operacao local, use:

```powershell
powershell -ExecutionPolicy Bypass -File tools\security\check-site-local.ps1 -SkipBuild -SiteOnly
```

O modo `-SiteOnly` limita a auditoria de escopo Git a `apps/web` e `data/public`. Ele serve para validar o pacote publico do site mesmo quando ha scripts operacionais locais em `tools/tablet` ou firewall fora do release. Esse modo nao autoriza publicar tablet, SSH, firewall, credenciais, logs ou artefatos locais; esses itens continuam exigindo revisao separada no modo completo.
