# Fontes reutilizaveis SP/MG e nacionais

Data: 2026-06-02

## Contexto

Durante o fechamento de Sorocaba, algumas fontes ou candidatos foram mantidos fora da publicacao municipal porque nao eram evidencia direta de Sorocaba ou porque exigem outro escopo. Elas nao devem ser descartadas: podem acelerar expansao para outros municipios.

## Reutilizaveis no Estado de Sao Paulo

- TCE-SP generico de contas anuais: `data/extracted/sorocaba/tce/contas_anuais/inventario_pdfs_contas_anuais.csv`.
  - Uso correto: fonte auxiliar para cruzamento em municipios paulistas.
  - Limite: nao e evidencia direta de Sorocaba sem referencia municipal explicita.
- TCE-SP alertas, links relevantes e amostras de transparencia:
  - `data/extracted/sorocaba/tce/alertas/`
  - `data/extracted/sorocaba/tce/links_relevantes_tce_sorocaba.csv`
  - `data/extracted/sorocaba/tce/transparencia/amostras_api_transparencia.csv`
  - Uso correto: reaproveitar padroes de coleta/QA para outros municipios de SP, ajustando municipio/CNPJ/orgaos.

## Reutilizaveis nacionalmente, inclusive MG e SP

- PNCP:
  - Pipeline atual filtra Sorocaba por `orgao_cnpj=46634044000174`.
  - O registro UFMG/Belo Horizonte encontrado em `data/extracted/sorocaba/pncp/saida/pncp_sorocaba_atas_2023.csv` nao e erro publicavel em Sorocaba; e sinal de que buscas amplas podem trazer orgaos de MG.
  - Uso correto em MG/SP: parametrizar CNPJ/municipio antes de publicar; nunca reaproveitar candidato PNCP sem filtro de `orgao_cnpj`.
- SICONFI/RREO/RGF/DCA:
  - Reutilizavel para qualquer municipio com codigo/ente correto.
  - Uso correto: motor multi-municipio com config por municipio.
- SIOPS/FNS/Portal da Transparencia federal:
  - Reutilizaveis nacionalmente como fontes de validacao independente.
  - Uso correto: manter como fonte direta quando coletada; quando houver proxy local, documentar como proxy e nao declarar coleta federal direta.

## Reutilizaveis condicionalmente

- TDAPortal/eTransparencia:
  - Usado no SAAE Sorocaba.
  - Pode existir em outros entes, mas os IDs de pagina, categorias e colunas variam.
  - Uso correto: reaproveitar estrategia de coleta/normalizacao, nao os caminhos nem pressupostos de campo.
- Scripts dry-run de publicacao:
  - `tools/data/gerar_urbes_indices_publicos.py`
  - `tools/data/gerar_funserv_apr_publicacao.py`
  - `pipelines/gerar_pncp_publicacao.py`
  - Uso correto: manter dry-run por padrao e evoluir para `--municipio` quando a segunda cidade exigir o mesmo fluxo.

## Nao reutilizar diretamente

- URBES, FUNSERV e SAAE como orgaos sao especificos de Sorocaba.
- Para MG, TCE-SP nao substitui TCE-MG.
- Para SP, TCE-SP ajuda; para MG, usar TCE-MG e manter PNCP/SICONFI/SIOPS como fontes nacionais.

## Regra de arquitetura

Mudancas em pipeline recorrente devem caminhar para multi-municipio: `--municipio`, config por CNPJ/URLs/orgaos e writer dry-run por padrao. Nao generalizar antes de ter segundo municipio real no mesmo fluxo.
