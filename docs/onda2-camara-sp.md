# Onda 2 — Câmara Municipal de SP (`baixar_camara_sp.py`)

Parte do hub `EXPANSAO-SP-CAPITAL.md`. Fontes verificadas 2026-06-13 em `saopaulo.sp.leg.br/transparencia/dados-abertos/`.
Formato misto: **XML, TXT, ZIP e web services SOAP (.asmx)** — para os SOAP, puxar o WSDL (`<url>?WSDL`) e gerar cliente.

## Alvos (prioridade dentro da Onda 2)

| Prioridade | Dado | Endpoint | Formato |
|---|---|---|---|
| **1 (alto valor)** | **Custos de mandato / verba de gabinete** (55 vereadores, ~R$416k/ano cada) | SisGV `https://sisgvconsulta.saopaulo.sp.leg.br/ws/ws2.asmx` + ZIPs históricos 2007–2017 | SOAP + ZIP |
| 2 | Votações em plenário (resultado por sessão legislativa) | `.../atividade-legislativa/sessao-plenaria/votacao-em-plenario/` | XML por data |
| 2 | Presença/frequência em plenário | `.../atividade-legislativa/sessao-plenaria/presenca-em-plenario/` | XML por data |
| 3 | Proposituras / projetos de lei / tramitação | SPLEGIS `https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx` | SOAP |
| 3 | Vereadores (cadastro 1948–2017) | `https://www.saopaulo.sp.leg.br/static/dados_abertos/vereador/vereador.txt` | TXT |
| 3 | Projetos históricos 1948–1991 | `.../static/dados_abertos/projetos_1948-1991/{projetos,assunto,autor}.txt` | TXT |
| 4 | Orçamento + balancetes da Câmara | `?p=1071` (orçamento), `?p=1077` (balancetes) | a inspecionar |
| 4 | Funcionários da Câmara (RH/folha) | `.../institucional/recursos-humanos/funcionarios/` | XML |

## Notas de implementação (Codex)
- **SisGV é o ouro**: detalha cada gabinete (gráfica, correio, transporte, material…). Cruzar SOAP atual + ZIPs históricos para série longa. Mapear por vereador + mês + categoria de despesa.
- **SOAP**: inspecionar `?WSDL`, listar métodos, paginar por sessão legislativa/ano. Salvar resposta bruta em `raw` (→ GDrive) antes de extrair.
- **Funcionários da Câmara (folha)**: aplicar o **mesmo gate de scrub do parecer LAI/LGPD** (`parecer-lai-lgpd-folha-sp.md`) — núcleo Tema 483, remover sensíveis.
- **Votações/presença**: XML por data → varrer o calendário de sessões da legislatura atual + anteriores disponíveis.

## Contrato (igual Onda 1)
- raw → GDrive (`gdrive:00-Omega/anatomia-do-gasto/sp-capital/raw/camara/...`); local só extracted+manifests.
- Manifest por dataset (municipio, orgao=Câmara Municipal SP, area, periodo, fonte_url, status, lacuna). Sem `public`/deploy sem autorização.
