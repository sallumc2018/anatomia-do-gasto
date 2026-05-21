# Pipeline De Dados

O pipeline coleta fontes oficiais, extrai dados, valida resultados e só então permite publicação no site.

## Pastas

```
data/raw/          # fontes brutas
data/extracted/    # resultado mecânico dos extratores
data/validated/    # dados aprovados localmente
data/public/       # dados lidos pelo site
pipelines/         # scripts Python
```

Por padrao, `data/raw` fica dentro do repo. No Windows operacional, os PDFs grandes devem ficar fora de `C:\Omega`, em `G:\Meu Drive`, para nao ocupar espaco no disco C. Para isso, defina `ANATOMIA_RAW_ROOT` apontando para a pasta externa que contem a subpasta do municipio, por exemplo:

```powershell
$env:ANATOMIA_RAW_ROOT = "G:\Meu Drive\Omega-data\raw"
```

Com essa variavel, os scripts que usam `pipelines/paths.py` leem e gravam brutos em `$env:ANATOMIA_RAW_ROOT\sorocaba\...`, enquanto `data/extracted`, `data/validated` e `data/public` continuam no repo. No Windows operacional atual, o destino canonico do acervo bruto e `G:\Meu Drive\Omega-data\raw`.

## Execução

Windows:

```powershell
.\.venv\Scripts\python.exe pipelines\pipeline.py --ano 2025
.\.venv\Scripts\python.exe pipelines\testes\verificar_dados.py --ano 2025
.\.venv\Scripts\python.exe pipelines\testes\verificar_dados_educacao.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025
.\.venv\Scripts\python.exe pipelines\testes\verificar_publicacao.py
```

Linux/WSL:

```bash
./.venv/bin/python pipelines/pipeline.py --ano 2025
./.venv/bin/python pipelines/testes/verificar_dados.py --ano 2025
./.venv/bin/python pipelines/testes/verificar_dados_educacao.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025
./.venv/bin/python pipelines/testes/verificar_publicacao.py
```

## Publicação

Depois de validar localmente:

```powershell
.\.venv\Scripts\python.exe pipelines\publicar_dados.py --area saude --ano 2025
.\.venv\Scripts\python.exe pipelines\publicar_dados.py --area educacao --ano 2025
```

O site oficial lê somente `data/public`.

## Arquivos De Saída

Saúde:

- `despesas_saude_sorocaba_YYYY.csv`
- `receitas_base_saude_sorocaba_YYYY.csv`
- `receitas_detalhamento_sorocaba_YYYY.csv`
- `rreo_despesas_saude_sorocaba_YYYY.csv`
- `rreo_receitas_sus_sorocaba_YYYY.csv`

Educação:

- `despesas_educacao_sorocaba_YYYY.csv`
- `receitas_base_educacao_sorocaba_YYYY.csv`

Segurança Pública (SICONFI DCA — anual, sem quadrimestres):

- `despesas_seguranca_sorocaba_YYYY.csv` — subfunções de segurança (Policiamento, Defesa Civil, Guarda Municipal, etc.)
- Raw: `data/raw/sorocaba/seguranca/entrada/YYYY_dca_siconfi.json` — snapshot bruto da API
- Fonte: SICONFI DCA-Anexo I-E. Diferente de saúde/educação: não usa PDFs do portal municipal.

Orçamento municipal por função (SICONFI RREO Anexo 02 — 6º bimestre):

- `despesas_executivo_sorocaba_YYYY.csv` — despesas municipais por função, incluindo Prefeitura, autarquias e Câmara Municipal, com colunas separadas para valores exceto intra e intra-orçamentários.

Receita e saúde fiscal (SICONFI):

- `receitas_sorocaba_YYYY.csv` — receitas municipais por categoria do RREO Anexo 01, 6º bimestre.
- `pessoal_sorocaba_YYYY.csv` — despesa com pessoal, RCL e RCL ajustada do RGF Anexo 01, 3º quadrimestre.
- `divida_sorocaba_YYYY.csv` — dívida consolidada e limites do RGF Anexo 02, 3º quadrimestre.
- `rcl_sorocaba_YYYY.csv` — composição das receitas correntes do RREO Anexo 03, 6º bimestre.

Execução financeira detalhada:

- `fornecedores_agregado_sorocaba_YYYY.csv`
- `restos_agregado_sorocaba_YYYY.csv`
- `despesa_orcamentaria_sorocaba_YYYY.csv`
- `empenho_sorocaba_YYYY.csv`

## Educação 2020-2025

Os CSVs de educação 2020-2023 foram validados contra os PDFs oficiais locais e publicados junto com 2024-2025. A cópia em `data/extracted/sorocaba/educacao/saida` continua preservada como saída mecânica do extrator; o site lê somente `data/public/sorocaba/educacao/saida`.

## Rastro De Execução 2020-2025

Os primeiros dados de rastro usam os livros oficiais da Secretaria da Fazenda:

- `Livro Conta Corrente de Fornecedor`
- `Livro Registro Analitico da Despesa Orçamentária`

Eles ficam no acervo bruto operacional e geram CSVs internos antes da publicação. A série publicada em `data/public` cobre fornecedores agregados, restos a pagar, despesa orçamentária e empenhos de 2020 a 2025. A verificação local inicial é:

```powershell
python pipelines\testes\verificar_rastro_execucao.py --ano 2020 --ano 2024
```

O rastro extraído cobre fornecedor, código do fornecedor, nota de empenho, documento de despesa, valor pago, órgão, unidade, natureza da despesa e programa de trabalho. Campos como conta bancária individual, ordenador, fiscal do contrato, unidade física final e comprovante bancário só podem entrar se aparecerem em fonte oficial específica.

Na listagem oficial consultada, alguns anos tinham PDFs grandes; por isso os brutos grandes ficam no acervo externo configurado por `ANATOMIA_RAW_ROOT`. A rastreabilidade pública fica nos manifests e em `data/public`; camadas internas não são lidas pelo site.

O inventário público dessa camada fica em `data/manifests/fontes_execucao_sorocaba.csv`, com:

- URL oficial do portal;
- nome esperado do PDF bruto;
- CSV extraído correspondente, quando existir;
- script de download;
- script de extração;
- validação local aplicável.

Isso permite auditoria externa do rastro de execução sem transformar `data/extracted/sorocaba/execucao/saida` em publicação automática.

## Coletores Internos Em Andamento

Os coletores abaixo preservam fontes oficiais e geram saídas internas, mas não publicam automaticamente:

- `baixar_cepa_emendas.py`: emendas CEPA, dotações e eventos.
- `baixar_fns_repasses.py`: repasses FNS/FAF por município.
- `baixar_transferencias_estaduais_sp.py`: repasses estaduais Sefaz-SP.
- `baixar_transferegov_sorocaba.py`: recortes Transferegov/SICONV filtrados para Sorocaba.
- `baixar_pncp_sorocaba.py`: PNCP com checkpoint; permanece parcial até cobertura confiável.
- `baixar_saae_dados_abertos.py`, `baixar_urbes_transparencia.py`, `baixar_funserv.py` e `baixar_tce_sorocaba.py`: inventário/coleta oficial de autarquias e controle externo.

Esses dados só viram publicação após normalização, validação local e cópia explícita para `data/public`.

## Gate De Publicacao

`pipelines\publicar_dados.py` consulta `data/manifests/datasets.csv` antes de copiar qualquer CSV. Somente linhas com `Origem_Dir=public` podem ser publicadas por esse script. Linhas `validated`, `extracted` ou `public_aux` exigem fluxo especifico e autorizacao explicita.

Antes de release, rode:

```powershell
python pipelines\testes\verificar_publicacao.py --strict
```

Esse teste deve falhar se um arquivo marcado como nao publicavel aparecer em `data/public`.
