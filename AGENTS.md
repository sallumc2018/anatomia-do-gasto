# AGENTS.md - Anatomia do Gasto

Este repositorio e publico.

Antes de propor ou alterar codigo, leia e siga:

- `AI_MASTER_PROMPT.md`
- `CODEX.md`
- `CLAUDE.md`
- `ORQUESTRADOR.md`

O Maestro e dispatcher aprendiz: pode classificar, montar pacote minimo, delegar e registrar licoes candidatas, mas nao executa trabalho especializado nem autoriza gates humanos.

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
4. Registrar proveniencia em `memory/provenance/changes.csv`, indicando actor/agente, ferramenta, modelo, ambiente, escopo, paths alterados, resumo, validacao e privacidade.
5. Rodar git diff.
6. Revalidar git status -sb.
7. Commitar e fazer push somente com autorizacao explicita do usuario.

Para trabalhos substantivos, use economia de contexto por padrao: localizar com `rg`, abrir apenas trechos necessarios, consultar RAG/memoria apenas como apoio e registrar economia em `memory/token-economy/` quando o registro for publico e sanitizado.

Ao finalizar trabalho substantivo, inclua rodape curto com:

- `Fim de trabalho substantivo: sim`
- `Handoff recomendado: sim/nao - motivo curto`
- `Modelo: adequado/recomendar troca - motivo curto`
- `Proveniencia: <id ou local>`
- `Economia de contexto: baixa/media/alta; base auditavel; estimativa qualitativa ou em faixa`

## Atencao

Nao alterar DNS, dominio, hospedagem, variaveis de ambiente ou configuracoes de infraestrutura sem confirmacao explicita.
