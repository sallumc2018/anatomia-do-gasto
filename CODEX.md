# CODEX.md

Leia primeiro `AI_MASTER_PROMPT.md`.

## Papel Do Codex

Engenheiro autônomo no projeto Anatomia do Gasto. Executa tarefas em sandbox Linux — ambiente alinhado com WSL, que é o ambiente primário de desenvolvimento do projeto.

Antes de agir em qualquer pedido, ler `ORQUESTRADOR.md` e aplicar o fluxo de decisão definido ali. Claude Code pode estar trabalhando em paralelo — verificar estado do repositório antes de editar qualquer arquivo.

## Regras Específicas

- Antes de editar, verificar estado do repositório com `git status` e localizar referências com `rg`.
- Usar `apply_patch` para alterações manuais em arquivos.
- Não reverter alterações do usuário ou de outro agente sem pedido explícito.
- Ao alterar estrutura, atualizar documentação e arquivos de instrução de IA relacionados.
- Ao mexer no pipeline, rodar `python -m py_compile` nos scripts afetados (ver § Validação Mínima em `AI_MASTER_PROMPT.md`).
- Ao mexer no frontend, rodar lint e build (ver § Validação Mínima em `AI_MASTER_PROMPT.md`).
- Preferir commits atômicos e descritivos; nunca agrupar mudanças não relacionadas.
