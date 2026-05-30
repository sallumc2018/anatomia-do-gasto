---
id: 2026-05-29-claude-papel-codex-qa-reconciliacao
date: 2026-05-29
agent: Claude Code (papel Codex)
status: active
visibility: public
---

# Claude assumindo papel do Codex - QA e reconciliacao (29/05)

Contexto: usuario sem limites no Codex ate 03/06. Claude assumiu o papel de QA/publicacao,
parando antes de commit/push/deploy.

## Descoberta principal
O Codex JA havia publicado quase todo o dado estruturado SICONFI/FUNSERV antes do limite acabar:
- data/public/sorocaba/fiscal/saida/: rreo_receita_orcamentaria, rreo_pessoal_siconfi,
  rreo_restos_siconfi, rreo_saude_siconfi, rreo_receitas_previdenciarias, rreo_metas_fiscais,
  dca_balanco_orcamentario, dca_demonstrativo_variacao (todos 2020-2025)
- data/public/sorocaba/autarquias/funserv/saida/: funserv_apr + indices de documentos
- data/public/.../urbes/saida/: urbes_contratos_*_ocr_indice (Codex ja tinha feito indice limpo)
- Tudo registrado em datasets.csv e qa.csv

## Erro que cometi e corrigi (transparencia)
Meu script qa_gate (redundante) criou DUPLICATAS com nomes diferentes e sobrescreveu 1 arquivo
do Codex. Corrigido:
- Removi rreo_receita_despesa_orcamentaria (dup de rreo_receita_orcamentaria do Codex)
- Removi dca_variacao_patrimonial (dup de dca_demonstrativo_variacao do Codex)
- Restaurei dca_balanco_orcamentario para a versao raw do Codex (a partir de data/extracted)
- Removi as 2 entradas orfas que criei no qa.csv
- Deletei o script qa_gate_coleta_2026_05_29.py para evitar re-execucao acidental
- verificar_publicacao.py OK apos limpeza

## Correcao de qualidade aplicada (alinhada ao padrao do Codex)
O Codex publicou 4 arquivos FUNSERV com coluna texto_bruto (despejo de texto de PDF):
funserv_atuarial, funserv_governanca, funserv_balanco_previdenciario, funserv_balanco_saude.
Isso e o risco de "texto cru publicado como dado" que o usuario alertou.
Apliquei o MESMO padrao que o Codex usou para Urbes (indice sem texto_bruto):
- Removida coluna texto_bruto dos 4 arquivos publicados
- Convertidos para indice de documentos: arquivo, ano, categoria, paginas, chars, tem_texto, fonte
- Contagens significam n. de documentos PDF disponiveis (atuarial=18, governanca=66,
  balanco_previdenciario=178, balanco_saude=192)
- Texto completo preservado em data/extracted
- qa.csv observacao atualizada: "indice de documentos, nao serie financeira estruturada"

## Avaliacao de qualidade dos dados de hoje (resposta a pergunta do usuario)
ESTRUTURADO E CONFIAVEL (publicado): SICONFI RREO/RGF/DCA, FUNSERV APR (66 com valor),
  as 18 areas previas validadas.
INDICE DE DOCUMENTOS (publicado, honesto): FUNSERV atuarial/governanca/balanco, Urbes OCR.
  Urbes OCR tem extracao de campo FRACA (ex: contratos_transporte 4/39 com n. contrato;
  alguns numero_contrato sao misparse tipo "9/4/99"). Util como catalogo, NAO como base
  de analise de contratos. Recomendo curadoria/reparse antes de usar para analise.
AINDA NAO USAVEL: SAAE contratos/despesas/licitacoes (paineis de filtro, nao dados);
  Camara docs (atas de audiencia em texto, nao series fiscais).
NAO FEITO: remuneracao GeneXus (spider documentado em handoff separado).

## Pendente para Codex quando voltar (03/06)
1. Revisar a conversao dos 4 FUNSERV para indice (concordar ou ajustar)
2. Decidir reparse dos OCR Urbes (campos fracos) ou manter so como catalogo
3. Atualizar lacunas.ts/calc_score.py (frontend) com os datasets publicados hoje
4. Finalizar spider GeneXus remuneracao
5. Separar commits por pacote (working tree tem ~73 arquivos)

## Restricoes respeitadas
Sem commit, push, deploy, npm install. Publicacao em data/public feita sob autorizacao
explicita do usuario (papel Codex ate 03/06). Toda mudanca registrada em qa.csv e provenance.
