# Publicacao SAAE e Camara - 2026-05-29

## Escopo

Gate autorizado pelo usuario em 2026-05-29 para promover dados de SAAE e Camara de `data/extracted` para `data/public` apos QA local.

## Arquivos publicados

| Orgao | Arquivo | Origem validada | Observacao |
| --- | --- | --- | --- |
| SAAE | `data/public/sorocaba/autarquias/saae/pessoal/saida/saae_folha_totais_sorocaba_2026.csv` | `data/extracted/sorocaba/saae/tdaportal/20260529_091316/pessoal/tabela_45.csv` | Totais agregados por tipo de folha; sem nomes ou matriculas. |
| SAAE | `data/public/sorocaba/autarquias/saae/pessoal/saida/saae_pessoal_cargos_amostra_sorocaba_2026.csv` | `data/extracted/sorocaba/saae/tdaportal/20260529_091316/pessoal/tabela_32.csv` | Amostra exibida pelo portal: 100 de 139 linhas; total informado pelo portal mantido separadamente. |
| Camara | `data/public/sorocaba/camara/documentos_orcamentarios/saida/camara_documentos_orcamentarios_sorocaba_2017_2027.csv` | `data/extracted/sorocaba/camara/{ldo,lrf,metas,ppa,prestacao}/camara_*_sorocaba.csv` | Inventario/texto de PDFs oficiais com status de qualidade por documento. |

## QA

- SAAE pessoal: publicada somente visao agregada, sem campo de nome, matricula, holerite ou identificador individual.
- SAAE cargos: arquivo marcado como amostra porque o portal retornou `Show 100 of 139 lines`; a soma dos cargos extraidos nao deve ser tratada como total completo.
- Camara documentos: 19 registros publicados; 11 com `texto_extraido`, 6 com `texto_curto_revisar` e 2 com `sem_texto_extraivel`.
- Receitas/despesas SAAE e despesas Camara TCE ja estavam em `data/public`; o gate atual tambem atualizou o manifesto auditavel para refletir essa cobertura.

## Manifestos atualizados

- `data/manifests/datasets.csv`
- `data/manifests/publication_classification.csv`
- `data/manifests/sorocaba/qa.csv`
- `data/manifests/sorocaba_100_auditavel.csv`

## Limites restantes

- SAAE TDAPortal granular de receitas, despesas, contratos, licitacoes e obras continua pendente de normalizacao semantica.
- SAAE cargos precisa de export completo ou parametrizacao adicional do portal para substituir a amostra.
- Camara documentos ainda precisa de normalizacao numerica para valores orcamentarios; este gate publicou inventario/texto auditavel, nao uma serie contabil estruturada.
