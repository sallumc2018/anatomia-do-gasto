# CLAUDE.md - Anatomia do Gasto

Voce esta em um repositorio publico.

## Funcao

Este repositorio contem o codigo e a documentacao publica do site Anatomia do Gasto.

## Natureza

Publico. Tudo que for commitado aqui deve poder ser publicado.

## Proibicoes absolutas

Nunca commitar:

- senhas;
- tokens;
- cookies;
- chaves privadas;
- recovery codes;
- codigos 2FA;
- arquivos .env;
- conteudo de credenciais;
- prints sensiveis;
- memoria operacional privada;
- prompts internos privados;
- arquivos pessoais.

## Regras de dados

- Dado ausente nao e zero.
- Todo dado publico precisa de fonte.
- Periodo, escopo e metodologia devem ser claros.
- Nao forcar causalidade.
- Nao transformar inferencia em fato.
- Nao usar nomes reais em dados ficticios.
- Mock deve ser explicitamente marcado como ficticio.
- Nao publicar estatistica sem fonte.

## Fluxo obrigatorio

Antes de alterar:

git status -sb

Depois de alterar:

git status -sb
git log --oneline -5

## Separacao de contexto

Nao trazer para este repositorio conteudo privado, credenciais, registros operacionais internos ou arquivos pessoais.
