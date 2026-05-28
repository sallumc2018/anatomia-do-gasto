# CODEX.md

Leia primeiro `AI_MASTER_PROMPT.md`.

## Papel Do Codex

Engenheiro autônomo no projeto Anatomia do Gasto. Executa tarefas em sandbox Linux — ambiente alinhado com WSL, que é o ambiente primário de desenvolvimento do projeto.

Antes de agir em qualquer pedido, ler `ORQUESTRADOR.md` (constituição operacional — agora usa linguagem Maestro) e aplicar o fluxo de decisão definido ali. Claude Code pode estar trabalhando em paralelo — verificar estado do repositório antes de editar qualquer arquivo.

## Regras Específicas

- Antes de editar, verificar estado do repositório com `git status` e localizar referências com `rg`.
- Para iniciar topico substantivo com baixo contexto, preferir `python tools/agents/start-topic.py "<objetivo>" --rag-limit 3` antes de abrir arquivos longos.
- Para objetivos amplos ou reutilizaveis, tratar `/goal` como slash command/protocolo local, nao como skill: definir objetivo verificavel, nao-objetivos, gates, rota inicial, pacote minimo, validacao e sinal de aprendizado antes do roteamento.
- Registrar falhas, erros, barreiras e correcoes reutilizaveis em `memory/knowledge/problems.csv` e `memory/knowledge/solutions.csv`, sempre de forma publica e sanitizada.
- Registrar toda alteracao em `memory/provenance/changes.csv` com actor/agente, ferramenta, modelo ou familia de modelo, ambiente, escopo, paths alterados, resumo, validacao e privacidade. Para trabalho sensivel ou operacional, registrar somente resumo publico sanitizado e manter detalhes fora do Git em `.local/memory/`.
- Antes de trabalhos substantivos, economizar contexto por padrão: localizar fontes com `rg` ou comando seletivo, abrir apenas arquivos e trechos necessários, evitar reler documentação já estabilizada e consolidar comandos quando isso não esconder evidência relevante.
- Para contexto amplo ja documentado, pode consultar `tools/memory/query-rag.py`; antes de editar, ler diretamente os arquivos relevantes. RAG nao substitui verificacao de fonte.
- Quando houver economia auditavel e o conteúdo for publico/sanitizado, registrar em `memory/token-economy/YYYY-MM.md`: data, agente/ferramenta, escopo, arquivos consultados, arquivos ou trechos evitados, comandos consolidados, estimativa em faixa ou qualitativa e observação de privacidade. Nunca registrar prompts privados, conversa completa, secrets ou dados não publicados.
- Trabalho substantivo e qualquer tarefa com multiplos arquivos, validacao local, analise de dados, mudanca de regra/documentacao, subagente, investigacao, pipeline, frontend, deploy, seguranca ou decisao reutilizavel. Ao finalizar, incluir rodape: `Fim de trabalho substantivo: sim`; `Handoff recomendado: sim/nao - motivo curto`; `Modelo: adequado/recomendar troca - motivo curto`; `Proveniencia: <id ou local>`; `Economia de contexto: baixa/media/alta; base auditavel; estimativa em faixa ou qualitativa`.
- Essa regra e portavel para qualquer projeto: quando nao houver `memory/token-economy/`, registrar a economia no mecanismo equivalente do projeto, no handoff, ou apenas no rodape da resposta.
- Protocolo de modelo: usar a menor capacidade suficiente; recomendar `/model` para modelo forte quando a tarefa exigir arquitetura, refatoracao ampla, bugs ambiguos, seguranca, dados sensiveis/metodologicos, decisoes permanentes ou conflitos; recomendar modelo economico/rapido para triagem, leitura seletiva, comandos simples, diffs pequenos e documentacao objetiva. Nao trocar silenciosamente o modelo principal salvo API segura da plataforma; quando houver subagentes com modelo/tier explicito, rotear subtarefas isoladas para o modelo adequado.
- Para tarefas com subagentes, aplicar `docs/agentes-contexto.md`: delegar somente tarefas isoladas, com paths de leitura/escrita e validação explícitos.
- Se o usuário disser "Chame o maestro, preciso completar os dados faltantes agora", tratar como fluxo composto `/frontino status -> dados -> pipeline -> qa -> vitruvio? -> deploy?`, seguindo o gatilho padrão de `docs/agentes-contexto.md`.
- Cada tópico deve ter sua própria conversa; ao perceber mudança de assunto, área ou objetivo, avisar o usuário para abrir uma nova conversa antes de continuar.
- Usar `apply_patch` para alterações manuais em arquivos.
- Não reverter alterações do usuário ou de outro agente sem pedido explícito.
- Ao alterar estrutura, atualizar documentação e arquivos de instrução de IA relacionados.
- Ao alterar memoria, agentes, handoffs, proveniencia ou RAG, rodar `python -m compileall -q tools/memory`, `python tools/memory/audit-memory-scope.py`, `python tools/memory/validate-provenance-log.py` e `python tools/memory/build-rag-index.py --check`.
- Ao alterar registry, automacao de agentes ou aprendizado do Maestro, rodar `python -m compileall -q tools/agents`, `python tools/agents/validate-agent-contracts.py`, `python tools/agents/validate-maestro-learning.py`, `python tools/agents/check-scope-gates.py` e `python tools/agents/plan-route.py "completar dados faltantes sorocaba"`.
- Para validacao padronizada por area, usar `python tools/agents/validate-area.py --area memory|agents|scope|pipeline|frontend|publication`.
- Ao mexer no pipeline, rodar `python -m py_compile` nos scripts afetados (ver § Validação Mínima em `AI_MASTER_PROMPT.md`).
- Ao mexer no frontend, rodar lint e build (ver § Validação Mínima em `AI_MASTER_PROMPT.md`).
- Preferir commits atômicos e descritivos; nunca agrupar mudanças não relacionadas.
