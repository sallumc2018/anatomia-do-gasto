# AGENTS.md - Anatomia do Gasto

> ⚠️ **LEIA `CONSTITUICAO.md` — é a fonte única de regras compartilhadas.**
> Este arquivo continua válido como contrato mestre do agente, mas todas as
> regras compartilhadas (roteamento, commit, proveniência, economia de contexto,
> footer, escopo proibido, flows, isolamento, assinatura) foram consolidadas em
> **`CONSTITUICAO.md`**.

Este repositorio e publico.

Mapa oficial de caminhos e artefatos: `CANONICAL_PATHS.md`.

Antes de propor ou alterar codigo, leia e siga:

- **`CONSTITUICAO.md`** ⬅️ fonte única de regras compartilhadas
- `~/AGENTS.md`
- `AI_MASTER_PROMPT.md`
- `codex.md`
- `CLAUDE.md`
- `ORQUESTRADOR.md`
- `docs/roteamento-codex-claude.md`
- `ENGINEERING_SCOPE.md`

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
7. Commitar localmente quando o bloco estiver completo, validado, revisado e publicamente auditavel.
8. Fazer push, deploy, publicacao em `data/public` ou mudanca de infraestrutura somente com autorizacao explicita do usuario.

Para trabalhos substantivos, use economia de contexto por padrao: localizar com `rg`, abrir apenas trechos necessarios, consultar RAG/memoria apenas como apoio e registrar economia em `memory/token-economy/` quando o registro for publico e sanitizado.

Ao finalizar trabalho substantivo, inclua rodape curto com:

- `Fim de trabalho substantivo: sim`
- `Handoff recomendado: sim/nao - motivo curto`
- `Modelo: adequado/recomendar troca - motivo curto`
- `Proveniencia: <id ou local>`
- `Economia de contexto: baixa/media/alta; base auditavel; estimativa qualitativa ou em faixa`

## Atencao

Nao alterar DNS, dominio, hospedagem, variaveis de ambiente ou configuracoes de infraestrutura sem confirmacao explicita.

## Roteamento de IA

| CLI | Função primária neste projeto | Modelo recomendado |
|---|---|---|
| **Codex** | Auditor principal de codigo; confiabilidade; bugs; refatoracao DRY/SOLID; Python/TypeScript; testes; CI e gates | GPT-5.5 Medium→High |
| **Claude Code - Coleta e Publicacao** | Fontes, coleta, cron, pipelines operacionais, Playwright, manifests, publicacao e deploy autorizado | sonnet-4-6 / opus-4-8 |
| **Claude Code - UI/UX** | Interface, acessibilidade, linguagem cidada, SEO editorial, metodologia e documentos longos | sonnet-4-6 / opus-4-8 |

Antigravity/Gemini nao integra a operacao ativa. Ver o contrato completo em
`docs/roteamento-codex-claude.md`.

## Disciplina de Raciocínio (obrigatória)

Antes de qualquer entrega, seguir `~/ENGINEERING.md` — verificar antes de afirmar (mostrar a prova), portões antes do irreversível (backup→verificar→remover), relatar fiel. Aplica-se também a mudanças no sistema Linux/Pop!_OS (ver seção própria no doc).
