# Pipeline de Dados

Este documento descreve o funcionamento interno do pipeline de extração de dados (Câmara 1).

## Pré-requisitos

- Python 3.12 ou superior
- Dependências em `requirements.txt` (pdfplumber, pandas, tqdm)

## Estrutura do Pipeline

```
scripts/
├── pipeline.py ← orquestrador principal
├── baixar_pdfs.py ← download de PDFs de saúde
├── baixar_pdfs_educacao.py ← download de PDFs de educação
├── baixar_rreo_sus.py ← download de PDFs do RREO
├── extrator_saude.py ← extrai dados de saúde
├── extrator_educacao.py ← extrai dados de educação
├── extrator_rreo.py ← extrai dados do RREO
├── extrator_rreo_sus.py ← extrai receitas SUS do RREO
├── extrator_universal.py ← extrator genérico (base para novos setores)
├── gerar_html.py ← (legado) gerava HTML estático
├── gerar_index.py ← (legado) gerava índice HTML
└── testes/
├── verificar_dados.py ← verificação de integridade
└── test_table_format.py ← teste de formatos de tabela
```

## Como Executar

### Pipeline completo para um ano
```bash
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025
```

## Opções

# Múltiplos anos
```bash
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2024 --ano 2025
```

```bash
# Pular download (PDFs já baixados)
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025 --pular-download
```

```bash
# Forçar re-extração
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025 --forcar
```

## Verificação de integridade
```bash
.\venv\Scripts\python.exe scripts\testes\verificar_dados.py --ano 2025
```

## Fluxo Detalhado
1. Download: pipeline.py chama os scripts de download para obter os PDFs do portal.
2. Extração: Os extratores usam pdfplumber para ler tabelas dos PDFs e pandas para estruturar.
3. Tratamento: Normalização de nomes, remoção de totalizadores, ajuste de codificação.
4. Exportação: CSVs em sorocaba/{area}/saida/ e cópia em frontend/data/{area}/saida/.
5. Verificação: verificar_dados.py confere o CSV gerado contra o PDF original.

## Formatos de Saída
### Saúde
#### Arquivo                            Conteúdo
despesas_saude_sorocaba_YYYY.csv	    Despesas com saúde por período e função
receitas_base_saude_sorocaba_YYYY.csv	Receitas base para cálculo do mínimo constitucional
receitas_detalhamento_sorocaba_YYYY.csv	Detalhamento de receitas (recursos próprios, SUS, etc.)
rreo_despesas_saude_sorocaba_YYYY.csv	Despesas de saúde do RREO
rreo_receitas_sus_sorocaba_YYYY.csv	    Receitas SUS do RREO

### Educação
#### Arquivo	                            Conteúdo
despesas_educacao_sorocaba_YYYY.csv	        Despesas com educação por trimestre
receitas_base_educacao_sorocaba_YYYY.csv	Receitas base para cálculo do mínimo constitucional

## Tratamento de PDFs com Texto RTL
Alguns PDFs do portal têm texto em ordem reversa (RTL). O extrator_universal.py detecta automaticamente essa condição e inverte o texto antes da extração.

## Integração com o Frontend
Os CSVs gerados são copiados para frontend/data/{area}/saida/ e lidos pelo Next.js via lib/data.ts usando fs.readFileSync.

## Troubleshooting
### Problema	            Solução
ModuleNotFoundError	        Execute pip install -r requirements.txt
PDF não encontrado	        Verifique se o portal mudou a URL; atualize o script de download
Extração com dados faltando	Execute com --forcar para re-extrair do zero
Verificação falha	        O verificar_dados.py apontará a linha com divergência; confira o PDF manualmente