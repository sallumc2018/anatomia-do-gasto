# Orquestrador

Leia primeiro `AI_MASTER_PROMPT.md`.

Este arquivo define a lógica de decisão compartilhada entre Claude Code e Codex. Todo agente deve aplicar este roteamento antes de agir em qualquer pedido.

## 1. Fluxo De Decisão

```
Pedido recebido
    │
    ▼
Verificar estado do repositório (git status)
    │
    ▼
Classificar a tarefa (ver § 2)
    │
    ▼
Selecionar agente (ver § 3)
    │
    ▼
Montar contexto mínimo (ver § 4)
    │
    ▼
Executar — e registrar o que foi feito
```

Regra transversal: o orquestrador deve sempre montar o **menor contexto suficiente** para cada subagente, reduzindo consumo de token sem sacrificar auditabilidade.

## 2. Classificação Da Tarefa

| Tipo | Palavras-chave / sinais |
|---|---|
| `dados` | baixar, portal, PDF, fonte, atualizar dados |
| `pipeline` | processar, extrair, converter, CSV, JSON, pipeline |
| `analista` | analisar, comparar, percentual, execução orçamentária, relatório |
| `frontend` | página, componente, visual, layout, Next.js, TypeScript |
| `deploy` | publicar, subir, Vercel, produção, build |
| `engenheiro` | refatorar, migrar, reorganizar estrutura, mover arquivos em massa |
| `composto` | pedido que combina dois ou mais tipos acima |

Para tarefas compostas: decompor em subtarefas, rotear cada uma separadamente, executar na ordem lógica.

## 3. Seleção Do Agente

| Agente | Ferramenta | Ambiente | Quando usar |
|---|---|---|---|
| `dados` | Claude Code | WSL / Windows | Acesso ao portal, download de PDFs |
| `pipeline` | Claude Code | WSL (primário) | Processamento com venv Python |
| `analista` | Claude Code | WSL / Windows | Análise iterativa com feedback em tempo real |
| `frontend` | Claude Code | WSL (primário) | Dev server, lint/build, validação visual |
| `deploy` | Claude Code | WSL / Windows | Build + push + Vercel — requer autorização explícita |
| `tablet` | Claude Code | Windows (ADB) | Sincronizar e monitorar tablet Android |
| `engenheiro` | Codex | WSL | Refatorações grandes, geração de código em massa |

**Google Drive não faz parte desta arquitetura.** GitHub é a fonte da verdade entre ambientes.

**Regra de desempate:** WSL para código; Windows para operações com hardware (ADB); Codex para tarefas autônomas que afetam muitos arquivos de uma vez.

## 4. Contexto Mínimo Por Agente

Cada agente recebe apenas o que é necessário para a tarefa. O orquestrador nunca repassa:

- Conteúdo de arquivos `.env` ou qualquer secret
- Conteúdo bruto de PDFs de `data/raw`
- Dados de `data/extracted` ou `data/validated` como destino de escrita
- Informações pessoais ou dados de auditoria não publicados

| Agente | Contexto que recebe |
|---|---|
| `dados` | URL do portal + paths de destino em `data/raw` |
| `pipeline` | Paths de entrada (`data/raw`) + paths de saída (`data/extracted`) + script relevante |
| `analista` | Paths de `data/public` + ano(s) de interesse + métrica solicitada |
| `frontend` | Paths de `apps/web` afetados + regras de frontend do `CLAUDE.md` |
| `deploy` | Nenhum dado sensível — apenas confirmação de autorização |
| `engenheiro` | Paths afetados + objetivo estrutural + regras do `CODEX.md` |

Também deve evitar repassar:

- arquivo completo quando diff, trecho curto ou resumo rastreável bastar;
- contexto já estabilizado em `README.md`, `docs/arquitetura.md`, `docs/pipeline.md`, `docs/ambiente.md` e `docs/estrategia.md`;
- histórico redundante de chat quando a evidência já estiver em arquivo.

## 5. Coordenação Entre Agentes

Claude Code e Codex podem estar trabalhando em paralelo.

Antes de editar qualquer arquivo:
1. Rodar `git status` para ver modificações em andamento.
2. Se o arquivo já foi modificado recentemente por outro agente, ler o estado atual antes de editar.
3. Nunca usar `git checkout --` ou `git restore` sem autorização explícita — isso apaga trabalho em andamento.

## 6. Limites De Autorização

O orquestrador nunca autoriza por conta própria:

- Commit, push ou deploy
- Mover dados para `data/public`
- Deletar arquivos ou branches
- Instalar dependências novas

Qualquer uma dessas ações exige confirmação explícita do usuário antes de executar.

## 7. Registro

Ao concluir, registrar de forma concisa:
- Qual agente foi usado
- O que foi feito
- O que ainda precisa de validação ou autorização humana
