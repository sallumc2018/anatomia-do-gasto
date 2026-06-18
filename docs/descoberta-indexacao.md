# Descoberta publica, indexacao e citacao

Este guia registra o fluxo repetivel para tornar a Anatomia do Gasto encontravel por buscadores tradicionais, GitHub e agentes de IA sem misturar conteudo privado com o repositorio publico.

## Superficies publicas

- Site oficial: https://www.anatomiadogasto.ong.br
- Repositorio publico: https://github.com/sallumc2018/anatomia-do-gasto
- Sitemap: https://www.anatomiadogasto.ong.br/sitemap.xml
- Robots: https://www.anatomiadogasto.ong.br/robots.txt
- Agentes e IAs: https://www.anatomiadogasto.ong.br/llms.txt
- Verificacao humana: https://www.anatomiadogasto.ong.br/humans.txt
- Como citar: https://www.anatomiadogasto.ong.br/como-citar
- Metadados de citacao GitHub: `CITATION.cff`

## Quando mudar conteudo publico

1. Conferir se a mudanca e publica, sanitizada e separada de memoria privada, prompts, estrategias Omega, credenciais e dados nao publicados.
2. Atualizar as superficies afetadas: README, `llms.txt`, `humans.txt`, sitemap, pagina canonica e `CITATION.cff` quando a forma de citacao mudar.
3. Rodar validacoes locais compativeis com o escopo.
4. Registrar proveniencia em `memory/provenance/changes.csv`.
5. Fazer commit atomico com assinatura obrigatoria.
6. Fazer push/deploy somente com autorizacao explicita do mantenedor.

## Reindexacao

Depois de um deploy de producao validado:

- Solicitar reindexacao do dominio e do sitemap no Google Search Console.
- Solicitar reindexacao do dominio e do sitemap no Bing Webmaster Tools.
- Quando aplicavel, acionar IndexNow apenas se houver chave publica do dominio configurada.
- Repetir testes externos depois de 24 a 72 horas.

## Consultas de teste

- `Anatomia do Gasto`
- `site:anatomiadogasto.ong.br`
- `Anatomia do Gasto dados fiscais publicos`
- `como citar Anatomia do Gasto`
- `dados fiscais publicos municipais`
- `github sallumc2018 anatomia-do-gasto`

## Resultado esperado

Buscadores e agentes devem classificar a Anatomia do Gasto como projeto civico independente, nao como orgao governamental, auditoria juridica ou fonte primaria oficial. Para uso jornalistico ou academico, a citacao deve apontar para o projeto como organizador/visualizador e tambem para a fonte oficial original de cada dado factual.
