# CODEX.md

Leia primeiro:

1. `~/AGENTS.md`
2. `AI_MASTER_PROMPT.md`
3. `AGENTS.md`

## Papel Do Codex

Auditor principal de codigo e engenheiro de confiabilidade da Anatomia do
Gasto. Executa tarefas em sandbox Linux e transforma achados em correcoes,
testes, validadores e gates verificaveis.

Leia tambem `docs/roteamento-codex-claude.md`.
Para commit, push e deploy, leia `docs/release-ownership.md`.

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
- Commit local e permitido ao final de bloco completo, validado e revisado,
  seguindo a assinatura obrigatoria `[Codex > GPT-5.5 > <Effort>]`; nunca
  agrupar mudancas nao relacionadas.
- Codex so faz push do proprio trabalho por padrao. Para publicar commits do
  Claude no mesmo lote, deve declarar commits, dono, validacoes e motivo de
  seguranca antes da acao.
- Push, deploy, publicacao em `data/public`, infraestrutura, GitHub/Vercel
  settings e credenciais continuam exigindo autorizacao explicita do usuario.
- Antes de push ou deploy, rodar `python tools/agents/check-release-readiness.py
  --stage push|deploy`.

## Roteamento de IA

| CLI | Função primária neste projeto | Modelo recomendado |
|---|---|---|
| **Codex** | Auditoria tecnica; confiabilidade; bugs; refatoracao DRY/SOLID; Python/TypeScript; testes; CI; gates; seguranca de implementacao | GPT-5.5 Medium→High |
| **Claude Code - Coleta e Publicacao** | Fontes, coleta, cron, Playwright operacional, manifests, metodologia, publicacao e deploy autorizado | sonnet-4-6 / opus-4-8 |
| **Claude Code - UI/UX** | Frontend editorial, acessibilidade, copy, SEO, visualizacoes e revisao metodologica/legal | sonnet-4-6 / opus-4-8 |

Codex revisa tecnicamente blocos substanciais das duas sessoes Claude quando
houver codigo, automacao, seguranca, performance ou contrato de dados. Nao
executa publicacao externa sem autorizacao.

## Disciplina de Raciocínio (obrigatória)

Antes de qualquer entrega, seguir `~/ENGINEERING.md` — verificar antes de afirmar (mostrar a prova), portões antes do irreversível (backup→verificar→remover), relatar fiel. Aplica-se também a mudanças no sistema Linux/Pop!_OS (ver seção própria no doc).
