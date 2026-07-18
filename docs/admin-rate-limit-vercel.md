# Plano de rate limit Vercel para login administrativo

Data: 2026-07-16  
Escopo: `POST /api/admin/login`

Este documento transforma a pendência de brute force do login administrativo em
um plano operacional executável no Vercel Firewall. Ele não registra segredo,
token, cookie, IP privado nem credencial.

## Objetivo

Complementar o throttle local do aplicativo com um controle compartilhado na
borda da Vercel.

O throttle atual em `apps/web/lib/admin-security.js` usa memória de processo. Ele
é útil em desenvolvimento, instância única e como defesa adicional, mas não fecha
o risco em runtime distribuído/serverless porque cada instância pode ter seu
próprio estado.

## Regra recomendada

Nome sugerido:

```text
Admin Login Rate Limit
```

Condições:

| Campo | Operador | Valor |
| --- | --- | --- |
| Path | equals | `/api/admin/login` |
| Method | equals | `POST` |

Ação inicial recomendada:

```text
Rate Limit → Fixed Window → Log
```

Parâmetros iniciais:

| Parâmetro | Valor |
| --- | --- |
| Janela | `60s` |
| Limite | `5` requests |
| Chave | `IP` |

Após observar tráfego legítimo por um período controlado, mudar a ação para:

```text
Default 429
```

ou, se a interface/conta permitir e fizer sentido operacional:

```text
Deny
```

Não usar `Challenge` como primeira ação para API de login sem testar o efeito no
cliente, porque challenge de navegador pode interferir em clientes não
interativos.

## Passo a passo no painel Vercel

1. Abrir o projeto do Anatomia do Gasto no painel Vercel.
2. Entrar em `Firewall`.
3. Selecionar `Configure`.
4. Criar `+ New Rule`.
5. Nomear a regra como `Admin Login Rate Limit`.
6. Adicionar as condições:
   - `Path` equals `/api/admin/login`;
   - `Method` equals `POST`.
7. Em `Then`, selecionar `Rate Limit`.
8. Selecionar `Fixed Window`.
9. Configurar:
   - `Time Window`: `60s`;
   - `Request Limit`: `5`;
   - counting key: `IP`.
10. Começar com ação `Log`, se disponível.
11. Salvar a regra.
12. Revisar as mudanças.
13. Publicar as mudanças.
14. Observar o tráfego no painel Firewall.
15. Depois de validar impacto, trocar a ação para `Default 429` ou `Deny`.

## Critério de validação

Considerar a pendência fechada apenas quando houver evidência de:

- regra publicada no Vercel Firewall;
- regra restrita a `POST /api/admin/login`;
- tráfego legítimo de login continua funcionando;
- tentativas repetidas excedendo o limite recebem resposta de bloqueio, 429 ou
  ação equivalente configurada;
- painel Firewall mostra eventos da regra;
- este documento e `docs/seguranca.md` foram atualizados com a data da aplicação.

## Limitações conhecidas

- Contadores do Vercel WAF Rate Limiting são por região. Tráfego distribuído por
  múltiplas regiões pode exceder o limite nominal por chave.
- Em plano Hobby, pode haver limite de quantidade de regras de rate limit e de
  regras customizadas. Se o projeto já tiver outras regras, revisar o orçamento
  de regras antes de publicar.
- Rate limit de borda não substitui senha forte, rotação de credenciais,
  autenticação multifator, logging de tentativa e alertas.

## Rollback

Se houver bloqueio indevido:

1. Voltar ao painel `Firewall`.
2. Desativar a regra `Admin Login Rate Limit` ou mudar a ação para `Log`.
3. Publicar a alteração.
4. Registrar o incidente e ajustar janela/limite antes de reativar bloqueio.

## Fontes oficiais consultadas

- Vercel Firewall: https://vercel.com/docs/vercel-firewall
- WAF Rate Limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting

