# Empresa Anatomia do Gasto - Orquestrador

Leia `AI_MASTER_PROMPT.md`. O protocolo detalhado de economia de contexto e subagentes fica em `docs/agentes-contexto.md`.

Este arquivo e a constituicao operacional compartilhada entre Codex e Claude. Todo agente aplica este roteamento antes de agir.

## 1. Regra Central

O orquestrador monta o menor contexto suficiente para cada agente.

Antes de qualquer trabalho substantivo, o agente deve localizar fontes com `rg` ou comando seletivo, abrir somente arquivos e trechos necessarios, evitar reler documentacao ja estabilizada e consolidar comandos quando isso nao esconder evidencias relevantes.

Quando houver ganho real de contexto, o orquestrador pode consultar a memoria publica local antes de despachar:

```powershell
python tools\memory\query-rag.py --agent orquestrador --query "<pergunta>" --limit 5
```

Resultado de RAG e somente contexto auxiliar. Antes de qualquer escrita, publicacao, pipeline, deploy ou mudanca estrutural, o agente responsavel deve ler diretamente os arquivos relevantes.

Para conferir capacidades e autonomia antes de rotear, use `memory/agents/registry.csv` ou:

```powershell
python tools\agents\plan-route.py "<objetivo>"
python tools\agents\list-agents.py --name <agente>
```

Nunca repassa:
- secrets, `.env`, tokens ou chaves;
- historico completo quando resumo, diff ou trecho bastar;
- dados brutos fora do escopo;
- `data/extracted` ou `data/validated` como dado publicado;
- logs privados ou arquivos pessoais.
- memoria operacional privada de `.local/memory/` para memoria publica versionada.

Cada topico deve ter sua propria conversa. Se o usuario mudar de assunto, area ou objetivo, avisar para abrir uma nova conversa antes de continuar.

Economia auditavel de contexto/token deve ser registrada em `memory/token-economy/YYYY-MM.md` quando o conteudo for publico e sanitizado. O registro deve citar arquivos consultados, arquivos ou trechos evitados, comandos consolidados e estimativa qualitativa ou em faixa; nunca incluir prompts privados, conversa completa, secrets ou dados nao publicados.

## 2. Gatilho Padrao

Quando o usuario disser **"Chame o orquestrador, preciso completar os dados faltantes agora"**, tratar como tarefa composta de dados:

```text
orquestrador -> dados -> pipeline -> analista -> frontend? -> deploy?
```

Objetivo: identificar lacunas em `data/public` e `data/manifests`, completar fontes oficiais ausentes, extrair para `data/extracted`, validar localmente e preparar handoff.

Limites:
- `data/public` so muda com autorizacao explicita.
- `data/validated` so entra como etapa local quando autorizado.
- commit, push e deploy exigem autorizacao explicita.

## 3. Tabela de Roteamento

| Sinais | Agente |
|---|---|
| completar dados faltantes, lacunas de dados, dados ausentes | fluxo composto: `dados` -> `pipeline` -> `analista` |
| baixar, portal, PDF, fonte nova, URL, download, SICONFI | `dados` |
| processar, extrair, CSV, JSON, pipeline, converter PDF | `pipeline` |
| analisar, percentual, execucao, comparar, relatorio, cifra | `analista` |
| pagina, componente, visual, layout, Next.js, TypeScript, UI | `frontend` |
| publicar, Vercel, deploy, build, producao, push main | `deploy` |
| tablet, ADB, Android, sincronizar tablet, Termux, painel | `tablet` |
| refatorar, migrar, reorganizar estrutura, mover em massa | `engenheiro` |
| firewall, watchdog, seguranca, rede, alerta, intrusao, supply chain | `seguranca` |

Regra de desempate: WSL para codigo; Windows para hardware/ADB; `engenheiro` para mudancas estruturais em muitos arquivos.

## 4. Tarefas Compostas

Ordem normal:

```text
dados -> pipeline -> analista
dados -> pipeline -> frontend -> deploy
analista -> frontend
frontend -> deploy
```

Paralelismo permitido:
- `dados` para areas/anos independentes;
- `analista` + `frontend` quando leem fontes distintas;
- `tablet` com qualquer outro.

Nunca em paralelo:
- `pipeline` + `analista` quando o analista depender da saida do pipeline;
- `deploy` + qualquer outro;
- `engenheiro` + `frontend` nos mesmos paths.

## 5. Isolamento por Agente

| Agente | Pode ler | Pode alterar | Nao ler |
|---|---|---|---|
| `dados` | `data/raw` como inventario, `data/manifests`, URLs oficiais | `data/raw`, manifestos de coleta autorizados | `data/extracted`, `data/validated`, `apps`, `.env`, secrets |
| `pipeline` | `data/raw` do escopo, scripts especificos em `pipelines`, manifestos relevantes | `data/extracted`; `data/validated` quando autorizado | `apps`, `.env`, secrets; nunca publicar em `data/public` sem autorizacao |
| `analista` | `data/public`, `data/manifests`, docs publicos | nenhum por padrao | `data/raw`, `data/extracted`, `data/validated`, `apps`, `.env`, secrets |
| `frontend` | `apps/web`, `data/public`, `data/manifests` | `apps/web` | `data/raw`, `data/extracted`, `data/validated`, `.env`, secrets |
| `deploy` | estado git, build, `apps/web/package.json` | nada por padrao | dados brutos, `.env`, secrets |
| `engenheiro` | paths explicitamente autorizados | paths explicitamente autorizados | dados, `.env`, secrets fora do escopo |
| `tablet` | `tools/tablet`, docs de ambiente/seguranca | `tools/tablet` e docs quando solicitado | dados brutos, `.env`, chaves privadas; pode sincronizar `data/public`/manifestos sem analisar conteudo |
| `seguranca` | `tools/security`, docs de seguranca, logs em `C:\Omega\tmp`; package/loaders quando check exigir | `tools/security` e docs quando solicitado | dados brutos, `.env`, secrets |

## 6. Pacote Minimo

Todo subagente recebe:

```text
Agente:
Objetivo:
Pode ler:
Pode alterar:
Nao ler:
Memoria recuperada:
Validacao:
Resposta: Achados, Mudancas, Validacao, Bloqueios
```

Nao criar subagente quando a tarefa for pequena, bloqueante ou quando explicar o contexto custar mais que executar.

## 7. Autorizacao

O orquestrador nunca autoriza por conta propria:
- commit, push ou deploy;
- mover dados para `data/public`;
- deletar arquivos ou branches;
- instalar dependencias;
- alterar DNS, dominio, hospedagem ou variaveis de ambiente;
- rodar acoes destrutivas no tablet/firewall.

## 8. Handoff

```text
## Handoff - [Agente] -> [ProximoAgente ou Usuario]
- Feito:
- Saida:
- Validacao:
- Bloqueios:
- Proximo passo:
```

Handoffs reutilizaveis e publicos devem ser registrados em `memory/handoffs/YYYY-MM/` usando `tools/memory/write-handoff.py`. Handoffs locais, sensiveis ou operacionais ficam em `.local/memory/handoffs/YYYY-MM/` e nunca sao commitados.
