# Lacunas com dados reais - 2026-06-01

Escopo: Sorocaba e Paulinia, usando apenas manifestos locais, `data/public`, `data/extracted`, QA local e evidencias ja registradas. Este documento nao autoriza promocao para `data/public`.

## Decisao curta

- Sim: grande parte do que resta como LAI em Sorocaba e manual ou depende de fonte oficial indisponivel/incompleta.
- Nao: ainda existem lacunas nao-LAI que podem ser fechadas com dados reais, principalmente por QA, reparo de extratores e inventario de portais.
- Prioridade pratica: fechar primeiro o que ja esta coletado em `data/extracted`, depois adaptar extratores para Paulinia, depois atacar portais com Playwright.

## Fechado neste bloco

- Sorocaba / Urbes / contratos de transporte: OCR reprocessado de 39/47 para 47/47 PDFs brutos.
- `pipelines/reparse_urbes_contratos.py` reexecutado apos o OCR.
- `docs/qa-extracted-sorocaba-2026-06-01.md` registra QA estrutural: Urbes 8 OK, fiscal 50 OK, Camara 12 OK, TCE 11 OK, Funserv 7 OK + 1 aviso legado.
- Nenhuma promocao para `data/public` foi feita.

## Sorocaba: dados reais aproveitaveis sem LAI agora

- SICONFI fiscal: RREO, RGF e DCA estao em `data/extracted/sorocaba/fiscal/saida`; QA estrutural indicou 50 arquivos OK. Proximo passo: QA semantico por area e decisao de promocao.
- Urbes contratos: `contratos_outros`, `contratos_receitas` e `contratos_transporte` estao extraidos e reparseados. Proximo passo: revisar campos fracos de fornecedor/CNPJ/valor antes de qualquer indice publico novo.
- Camara: 12 arquivos extraidos passaram no QA estrutural. Proximo passo: separar o que e documento institucional publicavel do que exige cautela ou complemento.
- TCE-SP controle: 11 arquivos passaram estruturalmente, mas a trilha de contas anuais ainda exige validacao semantica para nao misturar fonte estadual/governador com contas municipais.
- FUNSERV: APR e series principais estao extraidas; resta aviso legado em `inventario_funserv_documentos.csv`, que nao bloqueia o pacote novo mas precisa limpeza documental.
- Urbes relacao mensal de despesas e remuneracao do transporte: ha evidencia de PDFs brutos coletados; proximo passo e extrair texto/series e rodar QA.
- SAAE licitacoes/contratos/obras: manifesto indica extraido 2022-2025; proximo passo e normalizar e rodar QA.
- FUNSERV investimentos/rentabilidade: marcado como parcial e sem LAI; proximo passo e extrair carteira e resultados.

## Sorocaba: provavelmente manual ou LAI

- PPA, LDO, LOA, balancetes mensais, extratos bancarios e conciliacoes aparecem como `pedido_lai=sim` ou inventario incompleto.
- Balancos FUNSERV 2019-2025 no portal aparecem com 404 em registros anteriores; isso continua candidato a LAI.
- PNCP Sorocaba continua com API 403 nos endpoints consultados; pode ter workaround por Playwright, mas se falhar vira LAI/preparo formal.

## Paulinia: dados reais aproveitaveis sem LAI agora

- Camada publica ja existe para SICONFI, FNS, transferencias federais 2021-2025, transferencias estaduais 2020-2025, receita, executivo, seguranca, transporte e indicadores fiscais.
- Manifesto corrigido: Sefaz-SP nao esta mais bloqueado por configuracao; `sefaz_sp=5137` existe em `pipelines/paths.py` e ha CSVs publicos 2020-2025.
- PNCP Paulinia: `cnpj_prefeitura=45751435000106` ja esta configurado; lacuna real e o workaround Playwright/API 403, nao falta de CNPJ.
- Ainda sem LAI: inventariar portal de dados abertos da Prefeitura, mapear SMARAPD da Camara e adaptar/coletar TCE-SP receitas/despesas se a cobertura publicada nao bastar.

## Falhas de arquitetura ainda abertas

- Vercel GitHub Integration ativa: aceitavel para previews/checks, mas producao precisa continuar dependente de gate local e autorizacao explicita.
- Assinatura criptografica de Git nao esta configurada; hoje a assinatura e operacional por autor do commit mais provenance.
- CI ainda nao tem Prettier dedicado; VS Code formata localmente, mas o gate remoto depende de lint/build.
- `data/extracted` e ignorado pelo Git. Isso e correto para nao publicar bruto sem querer, mas exige relatorios de QA e manifestos precisos para nao perder rastreabilidade.

## Proxima correcao recomendada

1. Fazer QA semantico dos 50 arquivos fiscais Sorocaba ja extraidos.
2. Validar semanticamente TCE contas anuais antes de tratar como cobertura municipal.
3. Mapear Paulinia SMARAPD/Camara com inventario automatizado.
4. Rodar workaround Playwright para PNCP Paulinia e Sorocaba.
5. Configurar assinatura criptografica local quando quiser elevar o padrao de autoria dos commits.
