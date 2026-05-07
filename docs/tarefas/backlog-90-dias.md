# Tarefa para Codex — Backlog de 90 dias

Leia `docs/estrategia.md` antes de começar. Este documento é o briefing completo.

## Objetivo

Montar a matriz executiva de 90 dias do Anatomia do Gasto como:
1. Documento estruturado em `docs/plano-90-dias.md`
2. Issues no GitHub (uma por objetivo principal)

## Contexto

O Anatomia do Gasto é um rastreador de fluxo de dinheiro público para Sorocaba/SP.
O objetivo dos próximos 90 dias **não é ampliar cobertura**, mas provar adoção real do core existente.

Site: https://www.anatomiadogasto.ong.br
Repositório: https://github.com/sallumc2018/anatomia-do-gasto

## O que produzir

### 1. `docs/plano-90-dias.md`

Estrutura esperada:

```markdown
# Plano de 90 dias — Anatomia do Gasto

## Objetivos principais (4–5)
Para cada objetivo:
- Descrição
- Tarefas técnicas concretas
- Métrica de sucesso
- Prazo (semanas 1-4 / 5-8 / 9-12)

## Backlog mínimo (congelado por 90 dias)
Lista de tarefas técnicas priorizadas — nada de novas cidades, 
nada de novas seções até saúde/educação estarem sólidas.

## Lista de 10–15 usuários-alvo em Sorocaba
- Jornalistas locais
- Assessorias de vereadores
- Conselhos (saúde, educação, assistência social)
- Sindicatos e ONGs de fiscalização
- Professores/pesquisadores da UFSCar Sorocaba

Para cada usuário-alvo: perfil + pergunta de abertura + prova de uso relevante.

## Rotina editorial quinzenal
Template de relatório: "Principais achados de saúde/educação em Sorocaba — [data]"
Campos: total gasto, função com maior variação, execução orçamentária, link para fonte.

## Métricas de ativação (30 / 60 / 90 dias)
Baseadas em: usuário entrou → buscou → clicou na fonte → voltou.
```

### 2. Issues no GitHub

Criar uma issue para cada objetivo principal, com:
- Título claro
- Descrição do objetivo
- Lista de tarefas técnicas como checkboxes
- Label: `estrategia-90-dias`

## Restrições

- Não criar novas páginas ou seções além do que já existe
- Não sugerir expansão para outros municípios
- Não propor features não relacionadas à adoção do core existente
- Seguir regras de commit: `[Codex] descrição curta`
- Não commitar sem validar localmente

## Referências

- `docs/estrategia.md` — posicionamento e prioridades
- `AI_MASTER_PROMPT.md` — regras do projeto
- `ORQUESTRADOR.md` — arquitetura de agentes
- `apps/web/` — código do site
- `data/public/` — dados já publicados
