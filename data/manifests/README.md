# Manifests De Dados

Esta pasta registra o ciclo de vida dos dados usados pelo projeto.

Estados:

- `raw`: fonte bruta preservada.
- `extracted`: saída mecânica dos extratores.
- `validated`: aprovado por verificação local.
- `public`: disponível para o site oficial.

Antes de mover qualquer CSV para `data/public`, registre a origem e a validação em um manifesto.

## Papel Institucional

`data/manifests` e a camada publica de prova.

Ela existe para permitir auditoria independente sem exigir, por padrao, que o projeto publique todas as camadas operacionais em:

- `data/raw`
- `data/extracted`
- `data/validated`

A regra institucional e:

1. `data/public` e o dado publicado.
2. `data/manifests` e a trilha publica de auditabilidade.
3. `data/raw`, `data/extracted` e `data/validated` sao internos por padrao, salvo decisao auditavel em contrario.

## O Que Um Manifesto Precisa Provar

Para cada dataset publicado, um auditor externo deve conseguir responder:

1. qual foi a fonte oficial;
2. qual arquivo bruto originou a extracao;
3. quando o arquivo foi coletado;
4. qual script ou processo foi usado;
5. se houve validacao local;
6. qual arquivo final foi promovido para `data/public`;
7. como verificar se a fonte mudou.

## Schema Minimo Recomendado

O manifesto principal de datasets deve evoluir para registrar, no minimo:

- `municipio`
- `area`
- `anos`
- `status`
- `fonte_nome`
- `fonte_url`
- `fonte_arquivo`
- `coletado_em`
- `sha256_raw`
- `script_extracao`
- `validado_por`
- `validado_em`
- `publicado_em`
- `arquivo_publico`
- `observacao`

Nem todos os campos precisam estar preenchidos para datasets ainda nao publicados, mas `fonte_url`, `fonte_arquivo`, `status` e `observacao` devem existir sempre que possivel.

## Regra De Publicacao

Se um auditor puder verificar:

- a URL oficial;
- o nome exato do arquivo de origem;
- o hash do bruto;
- o script usado;
- e o arquivo final publicado;

entao o projeto consegue oferecer transparencia forte sem publicar indiscriminadamente as camadas internas.

## Benchmark E Expansao Municipal

Manifestos auxiliares criados para a fase de benchmark:

- `benchmark_targets.csv`: lista sites, portais e iniciativas comparadoras a medir.
- `benchmark_http_latest.csv`: saida gerada por `tools/benchmark/measure-http.ps1`; mede apenas HTTP simples, nao Lighthouse.
- `municipios_pipeline.csv`: fila publica de municipios e estado de cobertura.
- `paulinia_seed_sources.csv`: fontes oficiais iniciais para inventario de Paulinia.

Esses arquivos nao publicam dados novos no site. Eles registram meta, escopo e evidencia de medicao.

## Classificacao De Publicacao E UI

`publication_classification.csv` classifica cada linha de `datasets.csv` em uma destas classes:

- `publicavel`
- `publicavel_com_cautela`
- `nao_destacar_na_ui`

A classificacao orienta a interface publica. Ela nao remove transparencia: evita apenas que
dados pessoais, saude, judicializacao, credores, fornecedores ou nomes em documentos oficiais
sejam destacados como perfil individual, ranking nominal ou inferencia de conduta.

O gate `python tools\agents\check-scope-gates.py` falha quando algum dataset nao tem classificacao.

## Estado Atual

<!-- AUTO:coverage-start -->
**Cobertura atual:**

- **Cidades:** Sorocaba
- **Datasets publicados:** 90
- **Datasets em validação:** 2
- **Atualizado em:** 2026-05-30
<!-- AUTO:coverage-end -->
