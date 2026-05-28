# Agentes e Economia de Contexto

> Referenciado por `CLAUDE.md` e `ORQUESTRADOR.md`. Leia este arquivo em vez de re-ler o maestro inteiro.

Este guia define como dividir trabalho entre agentes sem gastar contexto lendo arquivos irrelevantes.

## Principio

O maestro deve criar ou acionar subagentes apenas quando a tarefa puder ser isolada por funcao, arquivos e validacao. Um subagente nunca deve receber historico completo da conversa se um objetivo, paths e trechos rastreaveis bastarem.

O Maestro agora e aprendiz de roteamento, nao executor. Ele pode registrar licoes candidatas sobre rotas, pacotes minimos e sinais de validacao em `memory/agents/maestro-learning-log.csv`, seguindo `memory/agents/maestro-learning.md`. Candidatas nao sao politica ate serem promovidas por mudanca explicita de comando, registry ou documentacao e validacao local.

A autonomia do Maestro depende do nivel de confianca em `memory/agents/maestro-confidence-state.csv`, interpretado por `memory/agents/maestro-confidence-levels.csv`. No nivel inicial C2, ele pode decidir rotas read-only, pacote minimo e registros publicos sanitizados; qualquer execucao, gate humano, promocao de politica ou conflito de paths deve ser escalado.

Falhas, erros, barreiras e correcoes reutilizaveis devem ser registradas em `memory/knowledge/problems.csv` e `memory/knowledge/solutions.csv`, sempre como conteudo publico e sanitizado.

Antes de trabalhos substantivos, todo agente deve localizar fontes com `rg` ou comando seletivo, abrir apenas arquivos e trechos necessarios, evitar reler documentacao ja estabilizada e consolidar comandos quando isso nao esconder evidencia relevante.

Trabalho substantivo e qualquer tarefa que envolva leitura/edicao de multiplos arquivos, validacao local, analise de dados, mudanca de regra/documentacao, uso de subagente, investigacao de bug, pipeline, frontend, deploy, seguranca ou decisao que oriente trabalhos futuros. Nao e substantivo: resposta curta, explicacao conceitual, comando simples, confirmacao, status rapido ou ajuste textual isolado sem validacao.

Quando houver memoria publica ja indexada, o maestro pode recuperar contexto com `tools/memory/query-rag.py` e incluir somente os trechos relevantes no pacote minimo. RAG nao substitui leitura direta de arquivos antes de editar, publicar, validar ou fazer deploy.

Cada topico deve ter sua propria conversa. Quando o usuario mudar de assunto, area ou objetivo de trabalho, o agente deve avisar: "Este e um novo topico; abra uma nova conversa para economizar contexto." So continuar na conversa atual se o usuario confirmar que quer seguir mesmo assim.

## Protocolo Otimizado

Inicio read-only de qualquer topico substantivo:

```powershell
python tools\agents\start-topic.py "<objetivo>" --rag-limit 3
```

Para objetivos amplos, ambiguos ou reutilizaveis, use primeiro:

```powershell
/goal <objetivo>
```

`/goal` e slash command local, nao skill. Ele define sucesso, nao-objetivos, gates, rota inicial, pacote minimo, validacao e sinal de aprendizado.

Pedido recomendado para usuario ou handoff entre agentes:

```text
Novo topico: <area>. Objetivo: <resultado>. Pode editar: <paths>. Nao pode: <gates>. Validacao: <comandos>. Entrega: diff + validacao + handoff curto.
```

Gates e validacoes locais por area:

```powershell
python tools\agents\check-scope-gates.py
python tools\agents\validate-area.py --area memory
python tools\agents\validate-area.py --area agents
python tools\agents\validate-area.py --area pipeline
python tools\agents\validate-area.py --area frontend
python tools\agents\validate-area.py --area publication
```

`check-scope-gates.py` falha se o frontend referenciar `data/raw`, `data/extracted` ou `data/validated`, se um arquivo marcado como nao publicavel em `data/manifests/datasets.csv` aparecer em `data/public`, se algum dataset nao tiver classificacao LAI/LGPD de UI, se o mindmap gerado estiver defasado, ou se automacoes locais de agentes/memoria contiverem comandos de release/instalacao sem gate humano.

Para uma checagem local completa antes de commit/push/deploy autorizado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\release\check-local-release.ps1
```

Use `-SkipFrontend` quando ainda nao houver autorizacao para rodar `npm run lint` e `npm run build`.

## Gatilho Padrao Do Maestro

Quando o usuario disser algo como **"Chame o maestro, preciso completar os dados faltantes agora"**, Codex e Claude devem tratar isso como pedido composto de dados e executar o roteamento abaixo com contexto minimo.

Objetivo padrao: checar score LAI, identificar lacunas em `data/public` e `data/manifests`, completar fontes oficiais ausentes, extrair para `data/extracted`, validar localmente com `qa` e preparar handoff. Publicacao em `data/public`, commit, push e deploy continuam exigindo autorizacao explicita.

Fluxo padrao:

1. `/frontino status`: verifica score LAI + fila de acao por fase.
2. `dados`: confere inventario e baixa fontes oficiais ausentes para `data/raw`.
3. `pipeline`: processa as fontes baixadas para `data/extracted` e, quando autorizado, usa `data/validated` como etapa local de validacao.
4. `qa`: valida integridade pre-publicacao ou reconciliacao read-only de `data/public` quando o escopo for publicacao/cobertura.
5. `plinio` (alias `analista`): le apenas `data/public` para apontar lacunas publicadas e impactos de leitura cidada.
6. `vitruvio`: so entra se a mudanca exigir pagina, componente, loader ou qualquer alteracao tecnica no site.
7. `deploy`: so entra depois de autorizacao explicita para commit/push/deploy.

Pacote minimo para esse gatilho:

```text
Agente: <dados|pipeline|qa|analista|frontend|deploy>
Objetivo: completar dados faltantes de <area> <anos>
Pode ler: paths estritamente necessarios
Pode alterar: somente o destino normal do agente
Nao ler: secrets, .env, historico de conversa e dados fora do escopo
Validacao: comando/check especifico do agente
Resposta: Achados, Mudancas, Validacao, Bloqueios
```

## Pacote Minimo De Tarefa

Todo subagente deve receber:

1. objetivo especifico;
2. tipo de agente;
3. arquivos ou diretorios que pode ler;
4. arquivos ou diretorios que pode alterar;
5. dados que nao pode ler;
6. validacao esperada;
7. formato curto de resposta.

Modelo:

```text
Agente: <frontend|pipeline|qa|dados|analista|seguranca|tablet|engenheiro|deploy>
Objetivo: <resultado verificavel>
Pode ler: <paths exatos>
Pode alterar: <paths exatos ou "nenhum">
Nao ler: <secrets, data/raw, data/extracted, data/validated, etc. quando nao pertinentes>
Memoria recuperada: <trechos curtos de memory/RAG quando houver>
Validacao: <comando ou checagem>
Resposta: achados, arquivos tocados, validacao, bloqueios
```

## Funcoes

| Agente | Leitura normal | Escrita normal | Validacao |
|---|---|---|---|
| `frontend` | `apps/web`, docs de UI, `data/public` necessario | `apps/web` | `npm run lint`, `npm run build`, checagem local de rotas |
| `pipeline` | `pipelines`, paths de entrada, manifest relevante; `data/public` em auditoria de cobertura | `pipelines`, `data/extracted`, `data/manifests` para auditorias, `data/validated` quando autorizado | `python -m py_compile`, teste especifico |
| `qa` | `data/extracted`, `data/validated`, `data/manifests`; `data/public` em QA de publicacao/cobertura | nenhum | `verificar_publicacao.py --strict`, relatorio PASS/FAIL |
| `dados` | fonte oficial, manifest de coleta, destino operacional | `data/raw`, manifest de fontes | conferencia de download e checksum quando houver |
| `analista` | `data/public`, docs de metodologia, manifest publico | docs ou texto analitico autorizado | checagem de fonte, escopo e periodo |
| `seguranca` | `.gitignore`, `CLAUDE.md`, docs de seguranca, `tools/security` | docs e scripts de seguranca | `check-site-local.ps1`, triagem supply-chain |
| `tablet` | `tools/tablet`, `docs/ambiente.md`, `docs/seguranca.md` | `tools/tablet`, docs relacionadas | checagem ADB/SSH quando autorizada |
| `engenheiro` | paths afetados pela refatoracao, `CODEX.md`, `ORQUESTRADOR.md` (constituicao operacional) | escopo explicitamente definido | testes do modulo alterado |
| `deploy` | estado de build e autorizacao humana | nenhum por padrao | build local, depois autorizacao para push/deploy |

## Regras De Isolamento

- `frontend` nao le `data/raw`, `data/extracted` ou `data/validated`.
- `analista` trabalha com `data/public` e manifests; nao usa dado interno como fato publicado.
- `pipeline` pode citar `data/raw`, `data/extracted` e `data/validated`, mas nao publica para `data/public` sem decisao explicita.
- `pipeline` deve usar filtros de camada quando o pacote minimo proibir `data/raw`, `data/extracted` ou `data/validated`.
- `qa` pode ler `data/public` somente para validar publicacao/cobertura em modo read-only; nunca escreve dados.
- `dados` nao recebe conteudo bruto de PDFs quando nome, URL, path e checksum bastarem.
- `seguranca` nunca recebe secrets; valida nomes, paths e regras.
- `tablet` nao recebe chaves, tokens, fingerprints privados ou dumps pessoais.
- `deploy` exige autorizacao explicita antes de commit, push ou Vercel.

## Budget de Tokens por Agente

Metas a respeitar. Se a tarefa exigir mais, avisar o usuário antes de continuar.

| Agente         | Budget alvo  | Motivo                                      |
|----------------|-------------|---------------------------------------------|
| `maestro`      | < 500 tok   | Só classifica e despacha — não executa      |
| `frontino`     | < 3 K tok   | Lê manifesto, calcula score, roteia coleta  |
| `dados`        | < 3 K tok   | Checa arquivos + portal, sem análise        |
| `pipeline`     | < 5 K tok   | Roda script, lê output, reporta             |
| `analista`     | < 8 K tok   | Lê ~3 CSVs, calcula, formata relatório      |
| `frontend`     | < 12 K tok  | Código mais complexo, múltiplos arquivos    |
| `deploy`       | < 2 K tok   | Só comandos — nada de conteúdo de arquivo   |
| `engenheiro`   | por tarefa  | Escopo autorizado explicitamente            |
| `tablet`       | < 2 K tok   | Só scripts, sem dados                       |
| `seguranca`    | < 3 K tok   | Logs e status, sem dados do projeto         |

## Paralelismo entre Agentes

Permitido:
- `analista` + `frontend` (leem fontes distintas)
- `dados` para múltiplas áreas/anos simultaneamente
- `tablet` + qualquer outro (ambiente separado)

Proibido:
- `pipeline` + `analista` (pipeline escreve o que analista leria)
- `pipeline` + `qa` no mesmo escopo
- `deploy` + qualquer outro (gate de publicação)
- `engenheiro` + `frontend` (podem editar os mesmos arquivos)

## Protocolo de Handoff

Todo agente que conclui emite:

```
## Handoff — [NomeAgente] → [ProximoAgente ou Usuário]
- **Feito:** [resumo em 1-2 linhas]
- **Saída:** [paths gerados ou alterados]
- **Pendente:** [o que precisa de validação ou autorização]
- **Próximo passo:** [/slash-command argumento OU ação do usuário]
```

Se o handoff for reutilizavel e seguro para o repositorio publico, registre tambem em `memory/handoffs/YYYY-MM/` com:

```powershell
python tools\memory\write-handoff.py --agent <agente> --scope "<escopo>" --done "<feito>" --output "<saida>" --validation "<validacao>" --next-step "<proximo passo>" --related-path <path>
```

Se houver qualquer conteudo operacional privado, detalhe local, log sensivel ou dado nao publicado, use `.local/memory/handoffs/YYYY-MM/` com `--visibility local-safe`.

## Quando Criar Subagente

Criar subagente quando:

- duas trilhas independentes podem andar em paralelo;
- a tarefa tem fronteira clara de arquivos;
- a resposta esperada cabe em resumo curto;
- o subagente nao precisa do historico completo.

Nao criar subagente quando:

- a proxima acao depende diretamente da resposta dele;
- a tarefa e pequena e local;
- o custo de explicar o contexto e maior que executar;
- ha risco de conflito em arquivos ja alterados por outro agente.

## Resposta Esperada

Cada subagente deve responder em no máximo quatro blocos:

- `Achados`: problemas ou confirmações relevantes.
- `Mudanças`: arquivos alterados, se houver.
- `Validação`: comando rodado e resultado.
- `Bloqueios`: autorização ou ambiente faltante.

Não incluir narrativa longa, histórico de conversa, logs extensos ou conteúdo de dados sensíveis.

## Rodape De Encerramento

Ao fim de todo trabalho substantivo, qualquer agente deve encerrar a resposta com:

```text
Fim de trabalho substantivo: sim.
Handoff recomendado: <sim/nao> - <motivo curto>.
Modelo: <adequado|recomendar troca para modelo economico|recomendar troca para modelo forte> - <motivo curto>.
Proveniencia: <id publico em memory/provenance/changes.csv ou local>.
Economia de contexto: <baixa/media/alta>; base: <evidencia auditavel>; estimativa: <faixa ou qualitativo>.
```

Recomendar handoff/nova conversa quando:
- o trabalho substantivo terminou e o proximo pedido muda de tema, area ou objetivo;
- o chat ja estiver grande;
- houve mudanca em regras, dados, pipeline, frontend, deploy ou agentes;
- continuar exigiria reler historico em vez de consultar docs, logs ou handoffs versionados.

Esta regra e portavel para qualquer projeto. Quando nao houver `memory/token-economy/`, registrar a economia no mecanismo equivalente do projeto, no handoff, ou apenas no rodape da resposta.

## Protocolo De Modelo

Todo agente deve usar a menor capacidade suficiente para maximizar produtividade e economia de tokens ao mesmo tempo.

- Usar ou recomendar modelo economico/rapido para leitura seletiva, triagem, comandos simples, diffs pequenos e documentacao objetiva.
- Usar ou recomendar modelo forte para arquitetura, refatoracao ampla, bugs ambiguos, seguranca, dados sensiveis/metodologicos, decisoes permanentes e conflitos.
- Depois da etapa dificil, recomendar voltar a modelo economico se a proxima etapa for mecanica, repetitiva ou facilmente verificavel.
- Nao trocar silenciosamente o modelo principal da conversa, salvo quando a ferramenta/plataforma expuser API segura para isso.
- Quando houver subagentes com modelo/tier explicito, rotear subtarefas isoladas para o modelo adequado e manter pacote minimo de contexto.
- Se o chat estiver grande, recomendar handoff/nova conversa antes de recomendar `/model`.

## Memoria e RAG

Fontes publicas indexaveis sao registradas em `memory/registry.csv`. O indice SQLite FTS5 local e gerado em `.local/rag/anatomia_public.sqlite` e nunca deve ser versionado.

Capacidades e limites dos agentes sao registradas em `memory/agents/registry.csv`. Automacoes locais e read-only ficam em `tools/agents/`; logs e locks ficam em `.local/agents/` e `.local/memory/agent-runs/`.

Checks da memoria:

```powershell
python -m compileall -q tools/memory
python tools\memory\audit-memory-scope.py
python tools\memory\build-rag-index.py --check
python tools\memory\build-rag-index.py
python tools\memory\write-token-economy.py --check
python tools\agents\validate-agent-contracts.py
python tools\agents\check-scope-gates.py
```

O agente deve preferir fontes `canonical` e `reference`; fontes `historical` ou `deprecated` nao entram na recuperacao normal.

## Verificação de Economia de Token

Para trabalhos substantivos com conteudo publico/sanitizado, registrar uma entrada em `memory/token-economy/YYYY-MM.md`:
- Data: [AAAA-MM-DD]
- Agente/ferramenta: [Codex, Claude, subagente]
- Escopo: [resultado verificavel]
- Arquivos consultados: [lista curta]
- Arquivos/trechos evitados: [lista curta]
- Comandos consolidados: [lista curta]
- Estimativa: [faixa percentual ou qualitativa]
- Privacidade: [confirmacao de que nao ha prompts privados, secrets, conversa completa ou dados nao publicados]

Preferir o escritor validado quando o registro for publico:

```powershell
python tools\memory\write-token-economy.py --agent Codex --scope "<escopo>" --consulted "<arquivos>" --avoided "<trechos evitados>" --commands "<comandos>" --estimate "<faixa ou qualitativo>"
```

Quando solicitado ("quanto economizamos?"), responder com estimativa auditável:
- Arquivos evitados: [lista]
- Trechos não relidos: [quantos, de qual arquivo]
- Redução estimada: [faixa qualitativa — ex: "~40-60% menos contexto que re-ler arquitetura completa"]

Nunca inventar número exato. Sempre baseado em evidência verificável.
