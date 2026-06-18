# Lacunas com dados reais - Sorocaba - 2026-06-02

Este registro atualiza a frente nao-LAI de Sorocaba sem publicar novos dados. Saidas novas permanecem em `data/extracted` ate decisao explicita de publicacao; mencoes a `data/public` indicam publicacoes anteriores ou problemas nelas detectados.

## Resolvido ou encaminhado

- Fiscal/SICONFI: 50 arquivos em `data/extracted/sorocaba/fiscal/saida` sao identicos por SHA-256 aos 50 arquivos em `data/public/sorocaba/fiscal/saida`; lote ja publicado, QA local OK, sem nova copia neste bloco.
- URBES: 47/47 PDFs em OCR para contratos; reparse passou a excluir CNPJs institucionais, usar padroes de operadora/contratada e validar o valor OCR original. QA atual: outros 23 fornecedores/22 valores, receitas 62 fornecedores/37 valores, transporte 14 fornecedores/13 valores. Revisao de publicabilidade: indices OCR sanitizados sao publicaveis com cautela; indice publico de contratos_transporte foi corrigido para 47/47 apos autorizacao explicita.
- TCE municipal: a trilha generica de contas anuais nao era evidencia municipal de Sorocaba; validado inventario oficial de pareceres no portal da Prefeitura com 20 links PDF oficiais: 12 pareceres previos da Prefeitura de 2012 a 2023 e 8 decisoes da Camara de 2015 a 2022. A ancora/cabecalho sem ano foi removida do extrator.
- TCE-SP generico: mantido como fonte auxiliar de cruzamento e controle, mas nao como evidencia direta de contas municipais.
- FUNSERV: inventario oficial refeito com 818 documentos; 5 APR de 2021 foram reparadas por OCR pontual e agora tem valor. Revisao de publicabilidade: indices textuais publicos estao sanitizados e alinhados por contagem; APR publico foi corrigido para 71/71 apos autorizacao explicita.
- SAAE: contratos, licitacoes e obras normalizados em `data/extracted/sorocaba/saae/normalizado`; QA semantico atual: contratos 22 linhas com 1 contrato sem datas no recorte, licitacoes 77 linhas com 56 dispensas/inexigibilidades sem abertura aplicavel, obras 85 processos com descricao ausente no recorte TDAPortal. Contratos/licitacoes sao candidatos a publicacao cautelosa; obras permanece inventario parcial ate fonte melhor/LAI.
- PNCP: publicacao parcial corrigida com 2.101 registros em `data/public/sorocaba/contratos/saida/pncp_sorocaba_2022_2026.csv`, todos com `orgao_cnpj=46634044000174`. A fonte extraida `atas_2023` ainda contem 1 registro fora do CNPJ, mas o consolidador filtra esse registro antes da publicacao.
- Saude/SIOPS: proxy local RREO SUS tem 12 arquivos 2020-2025; decisao registrada para aceitar o proxy no MVP e diferir SIOPS federal direto como validacao independente futura.

## Limites aceitos por decisao

- TCE generico nao deve ser descartado; deve ser usado como fonte auxiliar de cruzamento quando houver correspondencia municipal explicita.
- SIOPS direto nao foi coletado; nao declarar coleta direta federal antes de executar essa etapa.
- SAAE contratos/licitacoes/obras permanecem como `data/extracted` normalizado; contratos e licitacoes sao candidatos cautelosos, obras nao deve ser publicado como base completa enquanto todos os registros tiverem descricao ausente.
- PNCP extraido `atas_2023` contem 1 registro UFMG/Belo Horizonte fora do CNPJ de Sorocaba; o arquivo publico esta corrigido e candidatos PNCP nao devem ser publicados sem passar pelo consolidador filtrado.
- Fechamento operacional registrado em `docs/fechamento-sorocaba-nao-lai-2026-06-02.md`.

## Validacao local

- `python -m py_compile pipelines\reparse_urbes_contratos.py tools\data\qa_lacunas_sorocaba.py tools\data\normalizar_saae_lacunas.py tools\data\inventariar_tce_pareceres_sorocaba.py tools\data\gerar_urbes_indices_publicos.py tools\data\gerar_funserv_apr_publicacao.py`
- `python tools\data\normalizar_saae_lacunas.py`
- `python tools\data\gerar_urbes_indices_publicos.py`
- `python tools\data\gerar_urbes_indices_publicos.py --write-public`
- `python tools\data\gerar_funserv_apr_publicacao.py`
- `python tools\data\gerar_funserv_apr_publicacao.py --write-public`
- `python tools\data\inventariar_tce_pareceres_sorocaba.py`
- `python pipelines\gerar_pncp_publicacao.py --write-public`
- `python tools\data\qa_lacunas_sorocaba.py --markdown docs\qa-lacunas-sorocaba-2026-06-02.md --date 2026-06-02`
