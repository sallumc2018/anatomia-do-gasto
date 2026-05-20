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
- PDFs grandes do acervo bruto devem permanecer fora de `C:\Omega`, preferencialmente em `G:\Meu Drive\Omega-data\raw`; use `ANATOMIA_RAW_ROOT=G:\Meu Drive\Omega-data\raw` para apontar o pipeline para esse acervo externo.

## Fluxo obrigatorio

Antes de alterar:

git status -sb

Antes de instalar dependencias npm ou rodar scripts que possam disparar lifecycle hooks, leia `docs/seguranca-dependencias-npm.md`. Durante a campanha Mini Shai-Hulud, nao rode `npm install`, `npm update`, `npm audit fix`, `npx` ou scripts de pacote sem autorizacao explicita; comece por triagem read-only do `package-lock.json`.

Depois de alterar:

git status -sb
git log --oneline -5

## Edicao concorrente (Claude + Codex)

Quando Claude e Codex estiverem ativos ao mesmo tempo, o risco real e editar o mesmo arquivo sem que um saiba do outro. O `git status` antes de editar mitiga, mas nao previne totalmente.

Protocolo:
- Antes de qualquer escrita, verifique `git status -sb` e leia o timestamp dos arquivos alvo.
- Se um arquivo tiver modificacao recente nao commitada e voce nao foi quem fez, pare e informe antes de escrever.
- Nunca faca commit silencioso quando o working tree ja tiver mudancas: descreva o que e seu e o que nao e.
- Em caso de conflito real, prefira `git stash` ou branch temporaria em vez de sobrescrever.

## Separacao de contexto

Nao trazer para este repositorio conteudo privado, credenciais, registros operacionais internos ou arquivos pessoais.

Ao usar agentes ou subagentes, siga `docs/agentes-contexto.md`: envie apenas objetivo, paths permitidos, proibicoes, validacao esperada e formato curto de resposta. Nao repasse historico completo quando diff, trecho ou resumo rastreavel bastar.

Se o usuario disser "Chame o orquestrador, preciso completar os dados faltantes agora", acione o fluxo composto `dados -> pipeline -> analista -> frontend? -> deploy?` descrito em `docs/agentes-contexto.md` e `.claude/commands/orquestrador.md`.

Cada topico deve ter sua propria conversa. Se o usuario mudar de assunto, area ou objetivo, avise para abrir uma nova conversa antes de continuar.
