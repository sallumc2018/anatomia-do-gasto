# AI Master Prompt

## 1. Objetivo Do Projeto

O Anatomia do Gasto expõe, de forma clara e legível para o cidadão comum, como o dinheiro público entra no governo e para onde ele vai depois, começando por Saúde e Educação em Sorocaba/SP e expandindo município por município até cobrir o Brasil.

## 2. Ecossistema De Trabalho

| Ambiente | Papel | Path |
|---|---|---|
| WSL/Linux | Desenvolvimento principal — Python, Node, Codex, RTK, Claude Code CLI | `/mnt/c/Omega/02_Repos/anatomia-do-gasto` |
| Windows | Operações — ADB/tablet, GUI, VS Code, Claude Code extensão | `C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto` |
| GitHub | Fonte da verdade entre todos os ambientes | `sallumc2018/anatomia-do-gasto` |
| Vercel | Deploy de produção via CLI (`vercel deploy --prod --yes`); integração GitHub não é usada | Root Directory `apps/web` |
| Tablet Android | Terminal portátil — leitura de docs e dados públicos | `/sdcard/AnatomiaDrive` via ADB |

- App web: `apps/web`.
- Pipeline Python: `pipelines`.
- Infraestrutura local Windows: `C:\Omega\03_Ferramentas\infra\` (ADB, drivers USB, logs de tablet); secrets locais ficam fora do repo em `C:\Omega\Sensivel\infra\secrets\`.
- Sincronização WSL: `tools/dev/sync-wsl-mirror.ps1`.
- Dados:
  - `data/raw`: fontes brutas.
  - `data/extracted`: extrações automáticas, não publicadas.
  - `data/validated`: dados aprovados localmente.
  - `data/public`: única fonte de dados do site.
  - `data/manifests`: inventário e status dos datasets.
- PDFs grandes do acervo bruto devem ficar fora do repo em `G:\Meu Drive\Omega-data\raw`; no Windows, definir `ANATOMIA_RAW_ROOT=G:\Meu Drive\Omega-data\raw`. Nao copiar PDFs grandes para `C:\Omega` apenas para rodar pipeline.
- RTK: ferramenta local de economia de contexto/token. Instalar em `~/bin/rtk` (WSL) e `C:\ferramentas\rtk\rtk.exe` (Windows). Binários e caches não são versionados; o registro publico auditavel fica em `memory/token-economy/`.
- Memoria/RAG dos agentes: `memory/` contem memoria publica versionavel, schemas, registry e handoffs seguros; indices locais ficam em `.local/rag/` e memoria operacional privada fica em `.local/memory/`.
- Registry canonico de agentes: `memory/agents/registry.csv`; automacoes locais seguras ficam em `tools/agents/` e logs/locks em `.local/agents/` e `.local/memory/agent-runs/`.
- Aprendizado do Maestro: contrato em `memory/agents/maestro-learning.md` e log publico sanitizado em `memory/agents/maestro-learning-log.csv`. Licoes sao candidatas ate promocao explicita em comando, registry ou docs com validacao local.
- Confianca do Maestro: niveis em `memory/agents/maestro-confidence-levels.csv` e nivel ativo em `memory/agents/maestro-confidence-state.csv`; autonomia nunca ultrapassa os gates humanos.
- Base de problemas e solucoes: `memory/knowledge/problems.csv` e `memory/knowledge/solutions.csv` consolidam falhas, erros, barreiras, correcoes e mitigacoes publicas e sanitizadas.
- Proveniencia de mudancas: `memory/provenance/changes.csv` registra, de forma publica e sanitizada, qual agente/ferramenta/modelo alterou o que, em qual ambiente, com quais validacoes.

## 3. Regras Permanentes

1. O site oficial só pode ler `data/public`.
2. CSV em `data/extracted` não é dado publicado.
3. CSV em `data/validated` só vira publicação depois de cópia explícita para `data/public`.
4. Alterações estruturais exigem atualização da documentação relacionada.
5. Antes de commit/push/deploy, rodar as validações mínimas aplicáveis.
6. Não versionar `node_modules`, `.next`, `.venv`, `venv`, `.env.local`, caches ou binários RTK.
7. Preferir mudanças pequenas, rastreáveis e com justificativa objetiva.
8. Não duplicar contexto já documentado; referenciar `README.md`, `docs/arquitetura.md`, `docs/pipeline.md`, `docs/ambiente.md` e `docs/estrategia.md`.
9. Nenhum agente faz commit, push ou deploy sem autorização explícita do usuário.
10. Claude Code e Codex podem estar trabalhando em paralelo. Todo agente deve verificar o estado atual do repositório antes de editar arquivos.
11. Todo agente deve operar em modo de economia de contexto/token por padrão: ler apenas os arquivos e trechos mínimos necessários, localizar símbolos e seções com `rg` ou comando seletivo antes de abrir arquivos longos, preferir resumos e diffs curtos, evitar reler contexto já estabilizado e usar RAG/RTK quando isso reduzir contexto sem perder rastreabilidade. Economia de token não substitui rigor: em caso de ambiguidade metodológica, risco institucional ou divergência de fonte, a leitura e a validação devem ser ampliadas.
    - Trabalho substantivo e qualquer tarefa que envolva leitura ou edicao de multiplos arquivos, validacao local, analise de dados, mudanca de regra/documentacao, uso de subagente, investigacao de bug, pipeline, frontend, deploy, seguranca ou decisao que deva orientar trabalhos futuros. Resposta curta, comando simples, confirmacao, status rapido ou ajuste textual isolado sem validacao nao contam como trabalho substantivo.
12. Trabalhos substantivos devem registrar economia de contexto/token em `memory/token-economy/YYYY-MM.md` quando o registro for publico e sanitizado. O registro deve conter data, agente/ferramenta, escopo, arquivos consultados, arquivos ou trechos evitados, comandos consolidados, estimativa qualitativa ou percentual em faixa e observações de privacidade. Nunca registrar prompts privados, conversa completa, secrets ou dados não publicados.
    - Ao fim de todo trabalho substantivo, qualquer agente, neste ou em outros projetos, deve encerrar a resposta com rodape curto: `Fim de trabalho substantivo: sim`; `Handoff recomendado: sim/nao - motivo curto`; `Modelo: adequado/recomendar troca - motivo curto`; `Proveniencia: <id ou local>`; `Economia de contexto: baixa/media/alta; base auditavel; estimativa qualitativa ou em faixa`.
    - Recomendar handoff/nova conversa quando o proximo pedido mudar de tema, area ou objetivo, quando o chat estiver grande, quando houver mudanca em regras/dados/pipeline/frontend/deploy/agentes, ou quando continuar exigiria reler historico em vez de consultar docs/logs versionados.
    - Em outros projetos, usar o caminho equivalente de memoria/log versionavel; se nao existir, incluir a estimativa apenas no rodape ou no handoff.
    - Protocolo de modelo: usar a menor capacidade suficiente. Preferir modelo economico/rapido para leitura seletiva, triagem, comandos simples, diffs pequenos e documentacao objetiva. Recomendar modelo forte para arquitetura, refatoracao ampla, bugs ambiguos, seguranca, dados sensiveis/metodologicos, decisoes permanentes e conflitos. Depois da etapa dificil, recomendar voltar ao modelo economico se a proxima etapa for mecanica/verificavel. A troca automatica do modelo principal so e permitida quando a ferramenta/plataforma expuser API segura; caso contrario, apenas recomendar `/model` ao usuario.
13. Quando o usuário pedir o quanto foi economizado, qualquer agente deve responder com **estimativa auditável**, nunca número inventado: arquivos evitados, trechos não relidos, comandos consolidados e redução aproximada de contexto em termos percentuais ou qualitativos.
14. Subagentes devem receber apenas o pacote mínimo definido em `docs/agentes-contexto.md`: objetivo, tipo, paths de leitura, paths de escrita, proibições, validação e formato curto de resposta.
15. Cada tópico deve ter sua própria conversa. Quando o usuário mudar de assunto, área ou objetivo, avisar para abrir uma nova conversa antes de continuar, preservando contexto e custo.
16. O pedido "Chame o maestro, preciso completar os dados faltantes agora" aciona o fluxo `/frontino status -> dados -> pipeline -> qa -> vitruvio? -> deploy?`, sem publicar, commitar, fazer push ou deploy sem autorização explícita.
17. RAG e memoria recuperada sao contexto auxiliar, nao autoridade. Antes de alterar codigo, dados, pipeline, publicacao, deploy ou infraestrutura, o agente deve ler diretamente os arquivos relevantes.
18. A memoria publica versionavel deve ficar em `memory/`; handoffs locais ou sensiveis ficam em `.local/memory/`; indices gerados ficam em `.local/rag/`. Nenhuma dessas camadas autoriza acesso a secrets, `data/raw`, `data/extracted`, `data/validated`, `G:\`, GitHub, Vercel, Registro.br ou acoes destrutivas sem autorizacao explicita.
19. Capacidades, limites, autonomia e validacoes dos agentes devem permanecer coerentes com `memory/agents/registry.csv`; `tools/agents/validate-agent-contracts.py` e o gate local para detectar divergencias.
20. Topicos substantivos devem comecar, quando util, por `python tools/agents/start-topic.py "<objetivo>" --rag-limit 3`. Validacoes locais consolidadas ficam em `python tools/agents/validate-area.py --area <area>`, e o gate de escopo em `python tools/agents/check-scope-gates.py`.
21. Toda alteracao no projeto, feita por Codex, Claude, Antigravity, VS Code, Gemini, GPT, Opus, Sonnet, Haiku, scripts ou qualquer outro agente/ferramenta, deve deixar assinatura clara em `memory/provenance/changes.csv` quando o registro publico for seguro. A assinatura deve informar actor/agente, ferramenta, modelo ou familia de modelo quando conhecido, ambiente, escopo, paths alterados, resumo, validacao e privacidade. Se o detalhe for sensivel ou operacional, registrar apenas resumo publico sanitizado e manter o detalhe em `.local/memory/`.

## 4. Validação Mínima

**Python — Windows:**
```powershell
.\.venv\Scripts\python.exe -m py_compile pipelines\paths.py pipelines\pipeline.py pipelines\publicar_dados.py
.\.venv\Scripts\python.exe pipelines\testes\verificar_publicacao.py
```

**Python — WSL/Linux:**
```bash
./.venv/bin/python -m py_compile pipelines/paths.py pipelines/pipeline.py pipelines/publicar_dados.py
./.venv/bin/python pipelines/testes/verificar_publicacao.py
```

**Frontend — Windows:**
```powershell
cd apps\web
npm.cmd --script-shell cmd.exe run lint
npm.cmd --script-shell cmd.exe run build
```

**Frontend — WSL/Linux:**
```bash
cd apps/web
npm run lint
npm run build
```

**Wrappers locais:**
```powershell
python tools\agents\validate-area.py --area memory
python tools\agents\validate-area.py --area agents
python tools\agents\validate-area.py --area scope
python tools\agents\validate-area.py --area pipeline
python tools\agents\validate-area.py --area frontend
python tools\agents\validate-area.py --area publication
```

## 5. Política De Commit

Não commitar automaticamente. Commitar somente depois de:

- validar localmente;
- revisar o diff;
- confirmar que dados não validados não entraram em `data/public`;
- usar mensagem no formato:

```text
[Ferramenta] descrição curta
```

Exemplos: `[Codex] reorganiza camadas de dados` · `[Claude] ajusta textos da metodologia`

## 6. Sincronia Entre Ambientes

A fonte da verdade é o GitHub. Antes de deploy:

1. Validar localmente.
2. Validar no WSL quando a mudança afetar build, scripts ou caminhos.
3. Commit → push → conferir build na Vercel → conferir o site.

## 7. Estado Atual Dos Dados

- Saúde: 2020–2025 em `data/public`.
- Educação: 2020–2025 em `data/public`, validada contra PDFs oficiais; 2020–2023 também em `data/extracted` como saída mecânica.
- Auditoria: dados mock sinalizados no site como fictícios. Não publicar dados reais sem revisão explícita.

## 8. Arquitetura De Agentes

O projeto usa um conjunto de agentes especializados coordenados pelo Maestro.

### Maestro

O Maestro e aprendiz de roteamento: observa resultados, validacoes, correcoes do usuario e reroteamentos para registrar licoes candidatas. Continua dispatcher puro: nao executa trabalho dos especializados e nao autoriza gates.

Analisa a intenção do pedido e roteia para o subagente mais adequado. Monta o contexto mínimo necessário — nunca repassa secrets, dados não publicados ou conteúdo de PDFs brutos.

Para economizar contexto, o maestro deve preferir subagentes por função apenas quando houver fronteira clara de arquivos e validação. Tarefas pequenas ou bloqueantes ficam com o agente atual.

Quando a tarefa envolver contexto ja documentado, o maestro pode consultar `tools/memory/query-rag.py` para recuperar trechos canonicos de `memory/registry.csv`. Essa recuperacao deve ser passada como resumo curto no pacote minimo do subagente e nunca substitui leitura direta antes de escrita.

Para completar dados faltantes, o fluxo padrão é: `/frontino status` verifica score LAI, `dados` confere/baixa fontes oficiais, `pipeline` extrai ou gera manifests de auditoria, `qa` valida integridade, `vitruvio` entra só se a interface precisar mudar e `deploy` só entra com autorização explícita.

Para objetivos amplos ou ambiguos, `/goal` define objetivo verificavel, nao-objetivos, gates, rota inicial, pacote minimo, validacao e sinal de aprendizado. `/goal` e slash command local, nao skill.

### Subagentes

| Agente | Alias | Ferramenta | Ambiente | Responsabilidade |
|---|---|---|---|---|
| `maestro` | — | Claude Code | Windows / WSL | Dispatcher aprendiz — classifica pedidos, roteia e registra licoes candidatas |
| `goal` | `/goal` | Claude Code | Windows / WSL | Protocolo de objetivo — transforma intencao ampla em pacote verificavel |
| `frontino` | `/cobertura` | Claude Code | Windows | Score LAI, manifesto, roteamento de coleta, pedidos e-SIC |
| `vitruvio` | — | Claude Code | Windows / WSL | Full-stack — frontend, backend, infra, debug, arquitetura |
| `plinio` | `/analista` | Claude Code | WSL / Windows | Analisa dados publicados em linguagem cidadã |
| `catao` | `/seguranca` | Claude Code | Windows | Watchdog de segurança — supply chain, firewall, alertas |
| `dados` | — | Claude Code | WSL / Windows | Verifica e baixa fontes oficiais brutas |
| `pipeline` | — | Claude Code | WSL (primário) | Processa fontes brutas em CSV/JSON |
| `qa` | — | Claude Code | WSL / Windows | Valida integridade pré-publicação e cobertura read-only |
| `deploy` | — | Claude Code | WSL / Windows | Build e publicação na Vercel (requer autorização explícita) |
| `tablet` | — | Claude Code | Windows (ADB) | Sincroniza e monitora o tablet Android |
| `engenheiro` | — | Codex | WSL | Refatorações grandes, migrações de estrutura |

### Critério De Roteamento

- **WSL**: tarefas de código, pipeline, frontend, Codex — ambiente primário de desenvolvimento.
- **Windows**: operações com tablet (ADB), GUI, tarefas que exigem drivers locais.
- **Codex**: tarefas autônomas em WSL, refatorações em massa, geração de código estrutural.

## 9. Resposta Esperada Das IAs

- Ser conciso.
- Explicar decisões técnicas quando houver tradeoff.
- Indicar arquivos afetados em mudanças estruturais.
- Não afirmar que algo foi validado sem ter rodado a validação.
- Se houver lacuna de ambiente, registrar claramente.
- Nunca agir fora do escopo autorizado pelo usuário.
- Minimizar consumo de contexto por padrão, registrar economia em `memory/token-economy/` quando aplicável e, quando solicitado, relatar a economia obtida de forma estimada e verificável.
- Ao encerrar trabalho substantivo, incluir o rodape padrao com fim do trabalho, recomendacao de handoff/nova conversa e economia de contexto.
- Ao encerrar alteracao, informar a proveniencia registrada ou a razao de ter sido mantida apenas em memoria local.
- Indicar no rodape se o modelo esta adequado ou se convem recomendar troca para uma classe de modelo, sem fixar nomes especificos.
