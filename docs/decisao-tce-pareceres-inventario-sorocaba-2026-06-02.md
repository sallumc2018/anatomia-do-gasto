# Decisao: TCE pareceres como inventario municipal de Sorocaba

Data: 2026-06-02

## Decisao

Os pareceres e decisoes de contas encontrados no portal oficial de transparencia da Prefeitura de Sorocaba ficam registrados como inventario municipal em `data/extracted`, sem publicacao em `data/public` neste bloco.

## Evidencia

- Inventario: `data/extracted/sorocaba/tce/contas_municipais/pareceres_tce_sorocaba.csv`
- Fonte pagina: `https://fazenda.sorocaba.sp.gov.br/transparencia/`
- Resultado validado: 20 links PDF oficiais.
- Prefeitura Municipal de Sorocaba: 12 pareceres previos, exercicios 2012 a 2023.
- Camara Municipal de Sorocaba: 8 decisoes, exercicios 2015 a 2022.

## Correcao aplicada

O inventario anterior contava 21 linhas porque uma ancora/cabecalho de secao do portal foi capturada como item documental. O extrator passou a aceitar apenas itens com ano de exercicio e URL PDF.

## Limite de uso

Este bloco valida a trilha de links oficiais, nao o conteudo integral dos PDFs. Qualquer publicacao futura deve ser decidida explicitamente e classificada como inventario ou como dataset extraido/OCR, conforme o tratamento aplicado aos documentos.

O inventario generico do TCE-SP de contas anuais permanece util como fonte auxiliar de cruzamento, mas nao deve ser usado como evidencia direta de contas municipais de Sorocaba sem referencia municipal explicita.

## Validacao local

- `python tools\data\inventariar_tce_pareceres_sorocaba.py`
- `python tools\data\qa_lacunas_sorocaba.py --markdown docs\qa-lacunas-sorocaba-2026-06-02.md --date 2026-06-02`
