# AGENTS.md - Anatomia do Gasto

Este repositorio e publico.

## Escopo permitido

- codigo do site;
- dados publicos permitidos;
- documentacao publica;
- correcoes de acessibilidade;
- correcoes de SEO;
- correcoes de build;
- melhorias de visualizacao;
- ajustes de metodologia publica.

## Escopo proibido

Nao commitar:

- .env;
- senhas;
- tokens;
- cookies;
- chaves privadas;
- recovery codes;
- prompts privados;
- memoria operacional privada;
- prints sensiveis;
- credenciais;
- arquivos pessoais.

## Regras de qualidade de dados

- Dado ausente deve permanecer ausente.
- Nao converter ausencia em zero.
- Nao inventar dado publico.
- Nao usar mock sem aviso.
- Nao usar nomes reais em dados ficticios.
- Citar fonte, periodo e escopo quando houver dado.

## Fluxo de trabalho

1. Rodar git status -sb.
2. Fazer alteracao minima e verificavel.
3. Validar build/teste quando aplicavel.
4. Rodar git diff.
5. Commitar com mensagem clara.
6. Fazer push.
7. Revalidar git status -sb.

## Atencao

Nao alterar DNS, dominio, hospedagem, variaveis de ambiente ou configuracoes de infraestrutura sem confirmacao explicita.
