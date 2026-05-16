# Mapa financeiro de Sorocaba

Objetivo: inventariar e coletar o máximo oficialmente disponível sobre o dinheiro público ligado a Sorocaba, sempre separando dado publicado, dado em validação, lacuna conhecida e pedido de informação.

O ponto de partida é que toda movimentação de dinheiro público precisa deixar rastro oficial. Quando o dado não estiver em portal aberto, ele deve ser buscado em outra fonte oficial, em órgão de controle ou por pedido de acesso à informação.

Roadmap operacional: `docs/roadmap-sorocaba-100.md`.

## Regra de nomenclatura

Usar sempre `Sorocaba` ou `Sorocaba/SP`.

Evitar qualquer forma que acrescente qualificador administrativo ou urbano antes de `de Sorocaba`. A redação padrão é somente `Sorocaba` ou `Sorocaba/SP`.

## Camadas do mapa financeiro

| Camada | O que rastrear | Fonte primária | Situação no projeto |
|---|---|---|---|
| Orçamento planejado | PPA, LDO, LOA, anexos e atas | Portal de Transparência da Prefeitura | Parcial |
| Receita arrecadada | Receita orçamentária mensal, receitas correntes, capital, impostos, taxas, contribuições e transferências | Portal da Prefeitura, SICONFI RREO, SICONFI DCA | Parcial |
| Despesa autorizada e executada | Dotação inicial, dotação atualizada, empenhado, liquidado, pago e restos a pagar | Portal da Prefeitura, SICONFI RREO/DCA, TCE-SP | Parcial |
| Despesa por função | Saúde, educação, segurança, transporte, previdência, administração, urbanismo e demais funções | SICONFI DCA Anexo I-E, RREO Anexo 02 | Parcial |
| Saúde | ASPS, SUS, recursos próprios, transferências, gasto por subfunção, mínimo constitucional | Relatórios da Prefeitura, SIOPS, FNS | Parcial |
| Educação | MDE, FUNDEB, remuneração dos profissionais, transferências FNDE, mínimo constitucional | Relatórios da Prefeitura, SIOPE/FNDE | Parcial |
| Pessoal | Remuneração, cargos, subsídios, folha, terceirizados, limites da LRF | Portal da Prefeitura, Câmara, FUNSERV, SICONFI RGF | Parcial |
| Dívida e capacidade fiscal | Dívida consolidada, DCL, RCL, garantias, operações de crédito | SICONFI RGF/DCA, SADIPEM, TCE-SP | Parcial |
| Compras públicas | Licitações, dispensas, inexigibilidades, contratos, aditivos, fornecedores | Portal da Prefeitura, PNCP, TCE-SP, Câmara, autarquias | Lacuna |
| Pagamentos detalhados | Favorecido, CNPJ/CPF quando publicável, empenho, liquidação, pagamento, fonte de recurso | Portal da Prefeitura, TCE-SP/AUDESP | Lacuna |
| Obras | Obra, contrato, empresa, cronograma, medição, pagamento, situação | Portal da Prefeitura, TCE-SP, Câmara, Diário Oficial | Lacuna |
| Câmara | Orçamento, execução, subsídios, verbas, contratos, produção legislativa vinculada a impacto fiscal | Câmara de Sorocaba, CEPA, Portal da Transparência | Parcial |
| Urbes | Transporte, multas, despesas mensais, remuneração do transporte público, contratos | Portal de Transparência da Urbes | Lacuna |
| SAAE | Água e esgoto, receitas, despesas, contratos, licitações, obras | Portal do SAAE, transparência própria | Lacuna |
| FUNSERV | Previdência e saúde dos servidores, investimentos, evolução patrimonial, avaliação atuarial | Portal da FUNSERV | Lacuna |
| Agência Metropolitana | Receitas, despesas e balanços quando ligados a Sorocaba | AGEM Sorocaba | Lacuna |
| Transferências federais | FPM, SUS, FNDE, emendas, convênios, transferências especiais e voluntárias | Portal da Transparência Federal, Transferegov, FNS, FNDE | Lacuna |
| Transferências estaduais | ICMS, IPVA, convênios, emendas, repasses setoriais | Governo de SP, Secretaria da Fazenda de SP, TCE-SP | Lacuna |
| Controle externo | Pareceres, alertas, julgamentos, apontamentos e recibos de prestação de contas | TCE-SP, AUDESP | Lacuna |
| Diário Oficial | Leis, decretos, nomeações, contratos, extratos, abertura de créditos | Jornal oficial e atos normativos | Lacuna |

## Base legal de divulgação

- Constituição Federal, art. 37: publicidade é princípio da administração pública.
- Lei Complementar 101/2000, arts. 48 e 48-A: relatórios fiscais, contas, pareceres, execução orçamentária e financeira precisam ter transparência, inclusive com informações pormenorizadas em meio eletrônico.
- Lei 12.527/2011, art. 8º: órgãos e entidades públicas devem divulgar informações de interesse coletivo ou geral independentemente de solicitação.
- Lei 14.133/2021: o PNCP é o portal oficial nacional de divulgação centralizada de contratações públicas.

## Fontes já localizadas

- Portal de Transparência da Prefeitura: reúne relatórios de saúde, RGF, aplicação em ensino, balancetes de receita, LOA/LDO/PPA, boletins de receitas e despesas e documentos de prestação de contas.
- SICONFI/Tesouro Nacional: API pública para RREO, RGF, DCA, MSC e extratos de entrega.
- TCE-SP: Portal da Transparência Municipal e AUDESP para controle externo, prestação de contas e dados enviados ao Tribunal.
- SIOPS/FNS: receitas e despesas públicas em saúde.
- SIOPE/FNDE: dados municipais de educação, FUNDEB, RREO da educação, MDE e indicadores.
- Portal da Transparência Federal e Transferegov: transferências federais, convênios e parcerias.
- Urbes: contratos, compras diretas, informações orçamentárias e financeiras, relação mensal de despesas, recursos humanos e remuneração do transporte público.
- SAAE: transparência, licitações, portal de RH e e-SIC.
- FUNSERV: movimentações financeiras, programação financeira, rentabilidade, evolução patrimonial, balanços, licitações, avaliação atuarial e decisões do TCE-SP.
- AGEM Sorocaba: receitas, despesas e balanços financeiros.
- PNCP: licitações, contratos e contratações diretas publicadas nos termos da Lei 14.133/2021.
- Jornal oficial: atos normativos, extratos de contrato, editais, créditos adicionais e publicações que não aparecem de forma estruturada nos portais.

## Inventário de coleta obrigatória

Fila operacional: `data/manifests/inventario_fontes_sorocaba.csv`.

| Grupo | Fonte | URL inicial | Dados esperados | Periodicidade alvo |
|---|---|---|---|---|
| Prefeitura | Portal de Transparência | https://fazenda.sorocaba.sp.gov.br/transparencia/ | Balancetes de receita e despesa, livros contábeis, LOA, LDO, PPA, RGF, saúde, educação, precatórios, acórdãos do TCE-SP | Mensal, bimestral, quadrimestral e anual |
| Prefeitura | Audiências públicas | https://fazenda.sorocaba.sp.gov.br/audienciapublica/ | LOA, LDO, PPA, documentos de participação e anexos | Anual |
| Tesouro | SICONFI | https://www.gov.br/conecta/catalogo/apis/siconfi-extratos-das-declaracoes-contabeis | RREO, RGF, DCA, MSC, extratos de entrega | Mensal, bimestral, quadrimestral e anual |
| Saúde | SIOPS/FNS | https://portalfns.saude.gov.br/siops/ | Receita e despesa em saúde, ASPS, transferências SUS, indicadores de aplicação | Bimestral/anual |
| Educação | SIOPE/FNDE | https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope/relatorios-municipais | MDE, FUNDEB, receitas e despesas da educação | Bimestral/anual |
| Transferências federais | Portal da Transparência Federal | https://portaldatransparencia.gov.br/transferencias | Transferências constitucionais, legais, voluntárias, emendas e convênios | Mensal |
| Compras | PNCP | https://www.gov.br/pncp/pt-br | Licitações, contratos, atas, contratações diretas e contratos com recursos de emendas | Contínua |
| Controle externo | TCE-SP/AUDESP | https://www.tce.sp.gov.br/ | Contas, alertas, pareceres, dados enviados ao Tribunal e fiscalização | Contínua/anual |
| Câmara | Câmara e CEPA | https://sorocaba.camarasempapel.com.br/ | Leis, projetos, emendas, impacto fiscal, orçamento legislativo e atos da Câmara | Contínua |
| Urbes | Portal da Urbes | https://www.urbes.com.br/transparencia/index | Relação mensal de despesas, contratos, compras diretas, licitações, remuneração do transporte público | Mensal/contínua |
| SAAE | Portal do SAAE | https://www.saaesorocaba.com.br/transparencia/ | Receitas, despesas, licitações, contratos, obras, RH e e-SIC | Mensal/contínua |
| FUNSERV | Portal da FUNSERV | https://funservsorocaba.sp.gov.br/transparencia/portal-da-transpar%C3%AAncia | Balanços, avaliação atuarial, investimentos, receitas, despesas e decisões do TCE-SP | Mensal/anual |
| AGEM | AGEM Sorocaba | https://www.agemsorocaba.sp.gov.br/habit_ag_sorocaba/transparencia/receitas%20e%20despesas | Receitas, despesas e balanços quando ligados a Sorocaba | Mensal/anual |
| Atos oficiais | Jornal oficial | https://noticias.sorocaba.sp.gov.br/jornal-do-municipio/ | Leis, decretos, nomeações, contratos, editais, convênios e créditos adicionais | Diário/contínua |

## Próxima ordem de coleta

1. Fechar inventário das fontes por órgão: Prefeitura, Câmara, Urbes, SAAE, FUNSERV e AGEM.
2. Para cada fonte, registrar URL, periodicidade, formato, anos disponíveis, granularidade e método de extração.
3. Separar `raw`, `extracted`, `validated` e `public` sem atalhos.
4. Validar cada série por totais independentes: Portal da Prefeitura contra SICONFI, TCE-SP e relatórios setoriais.
5. Só publicar em `data/public` o que tiver fonte, período, escopo, metodologia e validação local.

## Critério de 100%

`100%` significa: todo dado oficialmente disponível, rastreável e legalmente publicável foi inventariado; toda ausência tem fonte consultada, data de consulta, evidência da ausência e, quando necessário, pedido de informação preparado.

Se uma fonte oficial não publicar a granularidade necessária, isso não encerra a investigação. A lacuna entra no backlog de cobrança: e-SIC, Ouvidoria, TCE-SP, Ministério Público ou pedido direto ao órgão responsável.
