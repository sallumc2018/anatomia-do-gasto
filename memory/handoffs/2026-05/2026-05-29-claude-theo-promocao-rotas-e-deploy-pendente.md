---
id: 2026-05-29-claude-theo-promocao-rotas-e-deploy-pendente
date: 2026-05-29
agent: Claude Code para Codex/Usuario
status: active
visibility: public
---

# Théo: promoção de rotas + aviso de treinamento (commit/deploy pendente)

## Contexto
Usuario relatou que o Théo "nao sabe responder direito". Diagnostico: o treino gerou 39
candidatos mas NENHUM tinha sido promovido para theo-guide.tsx (por design, exige revisao
humana), e o guia local sequer estava commitado/deployado (deploy vivo = origin/main, antigo).

## O que foi feito (revisado, type-check OK)
1. **4 rotas novas promovidas** em apps/web/components/theo/theo-guide.tsx (24 -> 28 rotas):
   - `lai` — como pedir LAI, prazo, e-SIC, recorrer, custo (o maior gap, era zero)
   - `transparencia-controle-social` — ativa/passiva, controle social, sociedade civil
   - `remuneracao` — salario do prefeito/servidores: responde HONESTO como Lacuna (dado nao
     publicado de forma auditavel; ja pedido por LAI)
   - `apartidarismo` — "e de partido/governo?", eleicao: declina politica, aponta neutralidade
2. **Aviso de treinamento** adicionado na UI (banner persistente apos o campo de pergunta):
   "O Théo ainda esta em treinamento... responde a um conjunto limitado de perguntas."
3. **Learning-log atualizado**: 14 candidatos marcados como `promoted` (loop de governanca fechado);
   restam 25 candidate (maioria ja coberta por rotas ONG/GitHub existentes ou off-scope).
4. Links das novas rotas verificados: /sorocaba/acesso-a-informacao, /sorocaba/lacunas,
   /politica-de-neutralidade, /sobre — todos existem (sem link quebrado).

## Validacao
- npx tsc --noEmit (config do projeto): SEM erros em theo-guide.tsx
- 28 rotas confirmadas
- Nenhum npm install, commit, push ou deploy executado

## PENDENTE (gate do usuario)
O Théo melhorado SO chega ao cidadao apos:
1. commit do theo-guide.tsx (+ as +153 linhas locais que ja existiam de rotas ONG/GitHub)
2. merge da branch codex/institutional-audit-data-catalog -> main
3. deploy (Vercel) — o site vivo roda origin/main; ate o deploy, o cidadao ve a versao antiga

## Limite honesto (comunicar ao usuario)
Théo e DETERMINISTICO (casa palavras-chave). As 4 rotas aumentam COBERTURA, nao compreensao
de frase livre. Para "entender de verdade" qualquer pergunta seria preciso plugar um LLM no
Théo (IA externa, ainda nao implementada) — outra decisao de arquitetura.

## Snapshot de treino
routes-snapshot.json (memory/training/theo) ainda reflete 24 rotas. Apos o deploy, rodar
`python tools/agents/train-theo.py --refresh-snapshot` para o eval bater com as 28 rotas.
