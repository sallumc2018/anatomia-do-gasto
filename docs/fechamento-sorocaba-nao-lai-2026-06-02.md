# Fechamento Sorocaba nao-LAI

Data: 2026-06-02

## Resultado

O bloco nao-LAI de Sorocaba esta fechado para continuidade operacional: `qa_lacunas_sorocaba` terminou com 86 OK, 0 warn e 0 fail.

Este fechamento nao significa que todos os dados desejaveis estao publicados. Significa que as frentes sem LAI foram coletadas, publicadas, corrigidas ou tiveram limite documentado com gate que impede publicacao equivocada.

## Publicado ou corrigido

- Fiscal/SICONFI: 50 arquivos ja estavam em `data/public` por hash igual ao extraido.
- URBES: indices OCR sanitizados publicados; contratos transporte corrigido para 47/47.
- FUNSERV: APR publico corrigido para 71/71; indices textuais sanitizados continuam como indices, nao series financeiras.
- PNCP: arquivo publico corrigido para 2.101 registros, todos com CNPJ do Municipio de Sorocaba.
- TCE pareceres: inventario municipal validado em `data/extracted`; sem publicacao nova.
- SIOPS: proxy local RREO SUS aceito no MVP; SIOPS federal direto fica como validacao futura.

## Limites aceitos por decisao

- SAAE contratos/licitacoes/obras: normalizados em `data/extracted`, mas nao publicados neste fechamento. Contratos e licitacoes podem ser publicados futuramente com cautela; obras ficam como inventario parcial ate obter descricao por fonte melhor ou LAI.
- PNCP `pncp_sorocaba_atas_2023.csv`: contem 1 registro UFMG/Belo Horizonte fora do CNPJ de Sorocaba; o consolidador publico filtra esse registro e o arquivo publico esta correto.
- TCE-SP generico: mantido como fonte auxiliar de cruzamento, nao evidencia direta municipal sem referencia explicita.

## Regra para proximos agentes

Nao reabrir Sorocaba nao-LAI apenas porque SAAE tem campos ausentes ou porque PNCP extraido tem o registro UFMG. Esses casos estao aceitos por decisao documentada e protegidos por QA/publicacao.

Reabrir apenas se houver:

- nova fonte oficial;
- resposta LAI;
- autorizacao explicita para publicar SAAE contratos/licitacoes;
- necessidade de tornar um pipeline recorrente multi-municipio;
- erro novo em `data/public` detectado por QA.

## Validacao

- `python tools\data\qa_lacunas_sorocaba.py --markdown docs\qa-lacunas-sorocaba-2026-06-02.md --date 2026-06-02`
- `python pipelines\testes\verificar_publicacao.py --strict`
- `python tools\agents\check-scope-gates.py`
