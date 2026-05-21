# CODEX.md

Leia primeiro `AI_MASTER_PROMPT.md`.

## Papel Do Codex

Engenheiro autônomo no projeto Anatomia do Gasto. Executa tarefas em sandbox Linux — ambiente alinhado com WSL, que é o ambiente primário de desenvolvimento do projeto.

Antes de agir em qualquer pedido, ler `ORQUESTRADOR.md` e aplicar o fluxo de decisão definido ali. Claude Code pode estar trabalhando em paralelo — verificar estado do repositório antes de editar qualquer arquivo.

## Regras Específicas

- Antes de editar, verificar estado do repositório com `git status` e localizar referências com `rg`.
- Para contexto amplo ja documentado, pode consultar `tools/memory/query-rag.py`; antes de editar, ler diretamente os arquivos relevantes. RAG nao substitui verificacao de fonte.
- Para tarefas com subagentes, aplicar `docs/agentes-contexto.md`: delegar somente tarefas isoladas, com paths de leitura/escrita e validação explícitos.
- Se o usuário disser "Chame o orquestrador, preciso completar os dados faltantes agora", tratar como fluxo composto `dados -> pipeline -> analista -> frontend? -> deploy?`, seguindo o gatilho padrão de `docs/agentes-contexto.md`.
- Cada tópico deve ter sua própria conversa; ao perceber mudança de assunto, área ou objetivo, avisar o usuário para abrir uma nova conversa antes de continuar.
- Usar `apply_patch` para alterações manuais em arquivos.
- Não reverter alterações do usuário ou de outro agente sem pedido explícito.
- Ao alterar estrutura, atualizar documentação e arquivos de instrução de IA relacionados.
- Ao alterar memoria, agentes, handoffs ou RAG, rodar `python -m compileall -q tools/memory`, `python tools/memory/audit-memory-scope.py` e `python tools/memory/build-rag-index.py --check`.
- Ao alterar registry ou automacao de agentes, rodar `python -m compileall -q tools/agents`, `python tools/agents/validate-agent-contracts.py` e `python tools/agents/plan-route.py "completar dados faltantes sorocaba"`.
- Ao mexer no pipeline, rodar `python -m py_compile` nos scripts afetados (ver § Validação Mínima em `AI_MASTER_PROMPT.md`).
- Ao mexer no frontend, rodar lint e build (ver § Validação Mínima em `AI_MASTER_PROMPT.md`).
- Preferir commits atômicos e descritivos; nunca agrupar mudanças não relacionadas.
