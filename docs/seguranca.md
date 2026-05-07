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

- O estado local do ADB no Windows deve ficar em `C:\infra\android-adb-home`, não em `C:\tmp`, para não ser apagado por rotinas de limpeza.
- Logs e inventários do tablet devem ficar em área persistente fora de `C:\tmp`, preferencialmente `C:\infra\logs\tablet`.
- `C:\tmp` deve ser tratado como área descartável e nunca como armazenamento persistente de pareamentos ADB ou artefatos operacionais do tablet.
