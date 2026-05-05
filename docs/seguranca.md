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
- **CSP (Content Security Policy):** será implementado quando o frontend amadurecer.

## Divulgação Responsável

Após a correção de uma vulnerabilidade, o mantenedor publicará um aviso no repositório (tag `security`) em até 30 dias, dando crédito ao reportador, se autorizado.