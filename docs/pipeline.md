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

Execução financeira detalhada:

- `conta_corrente_fornecedor_sorocaba_YYYY.csv`
- `despesa_orcamentaria_sorocaba_YYYY.csv`

## Educação 2020-2025

Os CSVs de educação 2020-2023 foram validados contra os PDFs oficiais locais e publicados junto com 2024-2025. A cópia em `data/extracted/sorocaba/educacao/saida` continua preservada como saída mecânica do extrator; o site lê somente `data/public/sorocaba/educacao/saida`.

## Rastro De Execução 2020 E 2024

Os primeiros dados de rastro usam os livros oficiais da Secretaria da Fazenda:

- `Livro Conta Corrente de Fornecedor`
- `Livro Registro Analitico da Despesa Orçamentária`

Eles ficam em `data/raw/sorocaba/execucao/livros_contabeis/YYYY` e geram CSVs em `data/extracted/sorocaba/execucao/saida`. Nesta fase, os dados não estão publicados no site. A verificação local inicial é:

```powershell
python pipelines\testes\verificar_rastro_execucao.py --ano 2020 --ano 2024
```

O rastro extraído cobre fornecedor, código do fornecedor, nota de empenho, documento de despesa, valor pago, órgão, unidade, natureza da despesa e programa de trabalho. Campos como conta bancária individual, ordenador, fiscal do contrato, unidade física final e comprovante bancário só podem entrar se aparecerem em fonte oficial específica.

Na listagem oficial consultada, 2020 e 2024 tinham os dois livros essenciais em tamanho pequeno. Para 2021-2023, pelo menos um dos livros essenciais estava acima de 900 MB; esses anos exigem estratégia separada antes de baixar e extrair. O livro anual de 2025 ainda não apareceu na listagem consultada.

O inventário público dessa camada fica em `data/manifests/fontes_execucao_sorocaba.csv`, com:

- URL oficial do portal;
- nome esperado do PDF bruto;
- CSV extraído correspondente, quando existir;
- script de download;
- script de extração;
- validação local aplicável.

Isso permite auditoria externa do rastro de execução sem transformar `data/extracted/sorocaba/execucao/saida` em publicação automática.
