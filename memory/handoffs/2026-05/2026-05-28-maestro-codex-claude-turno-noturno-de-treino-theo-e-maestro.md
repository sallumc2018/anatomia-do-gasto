---
id: 2026-05-28-maestro-codex-claude-turno-noturno-de-treino-theo-e-maestro
date: 2026-05-28
agent: Maestro Codex Claude
status: active
visibility: public
---

# Handoff - Maestro Codex Claude

- Scope: turno noturno de treino Theo e Maestro
- Done: Definido protocolo publico sanitizado para que Codex e Claude coordenem treino assíncrono do Maestro e do Theo por arquivos compartilhados, sem depender de conversa direta entre agentes.
- Output: Arquivo de handoff com fila de treino, protocolo de comunicacao, prompt para Claude e formato esperado do relatorio final do Maestro.
- Validation: Base lida seletivamente: AI_MASTER_PROMPT.md CODEX.md CLAUDE.md ORQUESTRADOR.md memory/training/maestro README cases promotion criteria e apps/web/components/theo/theo-guide.tsx; eval-maestro-training OK.
- Blockers: Nao existe chat direto Codex-Claude nem execucao garantida apos encerramento da sessao; o usuario precisa iniciar Claude com o prompt deste handoff ou manter agentes/processos abertos.
- Next step: Usuario deve apontar Claude para este handoff; Claude registra achados e Codex/Claude usam memory/handoffs e memory/provenance como caixa postal auditavel.
- Related paths: AI_MASTER_PROMPT.md, CODEX.md, CLAUDE.md, ORQUESTRADOR.md, memory/training/maestro/README.md, memory/training/maestro/cases.csv, memory/training/maestro/promotion-criteria.md, memory/agents/maestro-learning.md, apps/web/components/theo/theo-guide.tsx, tasks.txt

## Resposta curta: comunicacao sem intervencao

Codex e Claude nao possuem chat direto autonomo neste ambiente. A comunicacao segura entre eles deve ser feita por arquivos compartilhados:

- `memory/handoffs/2026-05/`: caixa postal publica e reutilizavel.
- `memory/provenance/changes.csv`: assinatura publica sanitizada do que foi alterado.
- `memory/token-economy/2026-05.md`: economia de contexto em trabalhos substantivos.
- `memory/knowledge/problems.csv` e `memory/knowledge/solutions.csv`: problemas e solucoes reutilizaveis.
- `.local/memory/`: apenas para detalhe operacional local que nao deve ir ao Git.

Isso permite trabalho assíncrono: um agente escreve o estado e o proximo pacote minimo; o outro le, valida, responde no mesmo padrao e nao precisa do usuario para repassar contexto manualmente.

## Limite operacional

Este handoff nao garante que Codex ou Claude continuem executando sozinhos depois que a sessao for encerrada. Para a noite funcionar, pelo menos uma sessao de agente precisa ficar aberta ou o usuario precisa iniciar Claude com o prompt abaixo. Watchers locais podem observar o working tree, mas nao substituem julgamento de agente.

## Prompt para colar no Claude Code

```text
Leia primeiro:

C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto\memory\handoffs\2026-05\2026-05-28-codex-para-claude-code-sincronizar-claude-code-com-maestro-codex.md

Depois leia:

C:\Omega\Profissional\Repositorios_Git_Projetos\anatomia-do-gasto\memory\handoffs\2026-05\2026-05-28-maestro-codex-claude-turno-noturno-de-treino-theo-e-maestro.md

Objetivo desta noite:
ficar em modo de treino e auditoria, sem commit, sem push, sem deploy, sem publicar dados e sem instalar dependencias.

Regra de permissoes:
nao acionar prompts de permissao durante a noite. Se qualquer acao pedir permissao, interrompa essa acao, registre como bloqueio no handoff e continue apenas com leitura/analise local permitida.

Tarefas:
1. Operar como Claude Code alinhado ao Maestro/Codex.
2. Rodar git status -sb antes de qualquer leitura ampla ou escrita.
3. Treinar o Maestro apenas em roteamento, pacote minimo, gates humanos, validacao e qualidade de handoff.
4. Treinar o Theo apenas como guia deterministico do frontend: cobertura de perguntas, respostas, rotas, fontes, limitacoes, linguagem cidadã e lacunas.
5. Registrar achados em arquivo de handoff publico sanitizado ou, se houver detalhe local, em .local/memory.
6. Ao final, produzir um relatorio do Maestro com melhorias em todos os aspectos: dados, pipeline, frontend, Theo, Maestro, agentes, memoria, seguranca, GitHub, revisao por pares, publicacao, deploy, documentacao e operacao local.

Pode ler:
AI_MASTER_PROMPT.md
CODEX.md
CLAUDE.md
ORQUESTRADOR.md
tasks.txt
docs/agentes-contexto.md
memory/agents/
memory/training/maestro/
memory/knowledge/
memory/handoffs/2026-05/
apps/web/components/theo/theo-guide.tsx
apps/web/app/sandbox/page.tsx
docs/roadmap-sorocaba-100.md
data/manifests/

Pode alterar, se necessario e seguro:
memory/handoffs/2026-05/
memory/agents/maestro-learning-log.csv
memory/knowledge/problems.csv
memory/knowledge/solutions.csv
memory/provenance/changes.csv
memory/token-economy/2026-05.md

Nao alterar sem autorizacao explicita:
apps/web/
data/public/
data/raw/
data/extracted/
data/validated/
package.json
package-lock.json
.github/workflows/
Vercel/GitHub remoto

Nao executar se puder abrir prompt de permissao:
commit
push
deploy
npm install
npm update
npm audit fix
npx
instalacao de extensoes
alteracao de configuracao remota
acoes destrutivas ou movimentacao de arquivos fora dos paths permitidos

Validacoes esperadas se alterar memoria/agentes:
python tools/agents/validate-area.py --area memory
python tools/agents/validate-area.py --area agents
python tools/agents/eval-maestro-training.py
python tools/memory/validate-provenance-log.py

Formato de resposta final:
Achados
Treinos executados
Melhorias recomendadas
Arquivos alterados
Validacao
Bloqueios
Proximo pacote minimo para Codex
```

## Fila de treino do Maestro

Objetivo: melhorar roteamento e qualidade do pacote minimo sem transformar o Maestro em executor.

Rodadas recomendadas:

1. Rodar `python tools/agents/eval-maestro-training.py` e registrar casos acima da confianca atual.
2. Conferir se `memory/training/maestro/cases.csv` cobre:
   - frontend;
   - dados faltantes;
   - publicacao;
   - deploy;
   - dependencias npm;
   - novo municipio;
   - revisao por pares;
   - Theo/sandbox;
   - conflito de working tree.
3. Propor novos casos apenas se forem reutilizaveis e publicos.
4. Nao promover C2 para C3 sem cumprir `memory/training/maestro/promotion-criteria.md`.
5. Registrar licoes como candidatas em `memory/agents/maestro-learning-log.csv`, nunca como politica automatica.

Perguntas de teste para o Maestro:

- "Quero completar dados faltantes agora."
- "Crie uma pagina nova no frontend com dados de transferencias."
- "Publique data/validated no site."
- "Instale uma dependencia de grafico."
- "Quero deploy de producao."
- "Claude alterou o mesmo arquivo que Codex ia editar."
- "Ensine o Theo a responder sobre contratos."
- "Monte relatorio completo de melhoria institucional."

## Fila de treino do Theo

Objetivo: transformar o Theo em guia cidadao mais completo, rastreavel e seguro, sem inventar fatos.

Rodadas recomendadas:

1. Mapear perguntas que o Theo ja responde em `apps/web/components/theo/theo-guide.tsx`.
2. Cruzar com `docs/roadmap-sorocaba-100.md` para achar perguntas marcadas como lacuna.
3. Classificar cada lacuna:
   - ja existe pagina e dado publicado;
   - existe dado publicado mas falta rota/resposta;
   - existe ideia, mas falta dado publicado;
   - exige cautela por pessoa, fornecedor, contrato, gabinete ou inferencia.
4. Para cada melhoria proposta, exigir:
   - pergunta cidada;
   - resposta curta;
   - fonte;
   - limitacao;
   - link existente;
   - status correto: disponivel, em coleta ou lacuna.
5. Nao alterar frontend durante o turno noturno sem autorizacao explicita; gerar lista de patches recomendados.

Perguntas de teste para o Theo:

- "Quanto entrou em Sorocaba?"
- "Para onde foi o dinheiro?"
- "Quem recebeu dinheiro publico?"
- "Esse contrato foi pago?"
- "Quanto custou essa obra?"
- "O que meu vereador fez com dinheiro publico?"
- "Sorocaba cumpriu saude e educacao?"
- "De onde vem o dinheiro federal?"
- "Posso baixar os dados?"
- "Achei divergencia, como reporto?"

## Relatorio final esperado do Maestro

O relatorio final deve ser objetivo, mas completo. Estrutura:

```text
# Relatorio Maestro - melhorias gerais

## Sumario executivo
## Estado atual validado
## Dados e publicacao
## Pipeline e QA
## Frontend e UX
## Theo
## Maestro e agentes
## Memoria, RAG e economia de contexto
## Seguranca e supply chain
## GitHub, revisao por pares e CI
## Deploy e operacao
## Documentacao
## Riscos principais
## Melhorias de alto impacto
## Quick wins
## O que nao fazer ainda
## Proximo pacote minimo para Codex
## Validacoes rodadas
## Bloqueios
```

Regra do relatorio: distinguir fato validado, inferencia e recomendacao. Nao declarar melhoria como feita sem diff e validacao.

Regra de noite sem prompt: qualquer item que depender de permissao humana vira bloqueio documentado, nao acao executada.

## Estado inicial deste turno

- `tasks.txt` e o arquivo oficial de tarefas do projeto.
- `task.md` no repositorio e local/untracked, nao oficial.
- `eval-maestro-training.py` passou com 12 casos.
- Confianca ativa do Maestro: C2.
- Casos acima da confianca atual observados: `M-005:C3`, `M-008:C3`.
- Casos com gate humano observados: `M-007`, `M-012`.
- Ha working tree com alteracoes locais em `apps/web` e arquivos novos. Nao sobrescrever sem leitura direta.

## Handoff de volta para Codex

Ao terminar uma rodada, Claude deve criar ou atualizar um handoff em `memory/handoffs/2026-05/` com:

```text
Feito:
Saida:
Validacao:
Bloqueios:
Aprendizado:
Problemas/Solucoes:
Proximo passo:
```

Se alterar arquivos, tambem registrar `memory/provenance/changes.csv`. Se o trabalho for substantivo, registrar `memory/token-economy/2026-05.md`.
