---
id: 2026-05-29-codex-validar-bucket-a-upgrade-status
date: 2026-05-29
agent: Claude Code para Codex
status: active
visibility: public
---

# Para Codex: validar Bucket A e propor upgrade de status_auditavel

Contexto: a reconciliacao de 29/05 (docs/reconciliacao-sorocaba-2026-05-29.md) identificou 9 fontes
marcadas como parcial ou coletado_pendente no auditavel que ja tem dataset PUBLICADO no disco.
Promover status silenciosamente e proibido — este handoff define o que Codex deve checar ANTES
de propor qualquer alteracao de status_auditavel (que afeta o score publico em apps/web/lib/lacunas.ts).

## O que checar por dataset (read-only, sem publicar)

Para cada fonte abaixo, confirmar DOIS requisitos:
1. Arquivo em data/public contem dados do periodo declarado (anos cobertos batem com o que ja existe);
2. Numero de registros em datasets_status.json e coerente com o arquivo fisico (wc -l ou head).

Se ambos OK -> propor status_auditavel = publicado no relatorio. Nao alterar o CSV direto.

| # | Fonte auditavel | Arquivo esperado em data/public | Status atual | Evidencia minima |
|---|---|---|---|---|
| 1 | Prefeitura/registro_de_empenhos | sorocaba/empenho/*.csv | parcial | 203.231 reg declarados |
| 2 | Prefeitura/conta_corrente_fornecedor | sorocaba/fornecedores/*.csv | parcial | 25.400 reg |
| 3 | Prefeitura/conta_corrente_restos_a_pagar_por_fornecedor | sorocaba/restos/*.csv | parcial | 3.979 reg |
| 4 | FNS/repasses_sus | sorocaba/saude/*.csv | coletado_pendente | extracted 2020-26; verificar se esta em public/saude |
| 5 | Portal_Transparencia_Federal/transferencias_para_sorocaba | sorocaba/transferencias/*.csv | parcial | 2.849 reg (via TCE-SP); flag pedido_lai verdadeiro mas dado ja disponivel por outra via |
| 6 | Camara/execucao_orcamentaria_legislativo | sorocaba/camara/*.csv | parcial | 24.417 reg (R$1,23B) |
| 7 | SAAE/receitas_despesas | sorocaba/autarquias/*.csv | coletado_pendente | 75.272 reg |
| 8 | FUNSERV/balancos_receitas_despesas | sorocaba/autarquias/*.csv | parcial | funserv-rpps + funserv-saude 9.154 reg |
| 9 | SICONFI/dca | sorocaba/fiscal/*.csv | coletado_pendente | 11.477 reg; siconfi-dca em datasets_status |

## Nota sobre pedido_lai

O campo pedido_lai = "sim" nao significa "dado bloqueado por LAI". Significa que um pedido foi
preparado. Varias linhas do Bucket A tem flag LAI mas o dado chegou por outra via (TCE-SP, API
federal, portal proprio). Isso deve ficar registrado em observacao, nao bloquear o upgrade.

## Saidas esperadas do Codex

1. Relatorio: para cada linha, "OK" ou "parcial/divergente" com o motivo.
2. Para as OK: proposta de status_auditavel = publicado (nao aplicar sozinho).
3. Rodar python tools/diagnostico/calc_score.py --dry-run se existir flag, ou calcular
   manualmente o score projetado com as promocoes.
4. Handoff de volta para usuario/Claude com o delta de score esperado.

## Restricoes (mesmas de sempre)
- Sem alterar data/public, data/manifests/sorocaba_100_auditavel.csv, apps/web ou datasets.csv.
- Sem commit, push, deploy, npm install, publicacao de dados.
- Sem promover status no CSV sem relatorio intermediario visto pelo usuario.
