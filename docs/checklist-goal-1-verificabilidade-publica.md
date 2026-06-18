# Goal 1 — Verificabilidade publica e descoberta por buscadores/IA

Objetivo: tornar o site e o repositorio publicamente verificaveis por pessoas, buscadores tradicionais e agentes de IA, com identidade, fontes, limites, metodologia e citacao claros.

## Checklist

- [x] Home declara o que e o projeto, sua independencia e seus limites.
- [x] Repositorio publico aponta para site oficial, regras de publicacao e camadas de dados.
- [x] Site publica `robots.txt` e `sitemap.xml`.
- [x] Site tem pagina institucional com status do projeto e limites pre-CNPJ.
- [x] Site tem pagina de fontes oficiais.
- [x] Site tem pagina de metodologia.
- [x] Site tem catalogo publico de dados publicados.
- [x] Site tem politica de dados, politica de neutralidade e termos.
- [x] Site tem canal para reportar divergencias.
- [x] Site expõe JSON-LD global para `Organization`, `WebSite`, `SoftwareSourceCode` e `DataCatalog`.
- [x] Site publica `/llms.txt` para agentes e modelos de linguagem.
- [x] Site publica `/humans.txt` para verificacao rapida de autoria, contato, repositorio e limites.
- [x] Site tem pagina `/como-citar` com classificacao correta, textos recomendados e limites de uso.
- [x] Repositorio publica `CITATION.cff` para metadados de citacao no GitHub e ferramentas academicas.
- [x] Repositorio documenta fluxo repetivel de descoberta, indexacao e reindexacao.
- [x] Footer, home, sitemap e navegacao incluem a pagina "Como citar".
- [x] Fazer push dos commits locais para o GitHub publico.
- [x] Fazer deploy de producao apos validacao local.
- [x] Conferir URLs publicas depois do deploy: `/`, `/fontes`, `/metodologia`, `/api/dados`, `/como-citar`, `/llms.txt`, `/sitemap.xml`, `/robots.txt`.
- [ ] Solicitar ou aguardar reindexacao em Google Search Console e Bing Webmaster Tools.
- [ ] Repetir testes externos em buscadores e ferramentas de IA: Google, Bing, GitHub Search, EXA, Perplexity, ChatGPT browsing e similares.
- [ ] Criar releases/tags publicas para marcos de metodologia e dados.

## Evidencia local — 2026-06-12 21:00 UTC

- Adicionado `CITATION.cff` com identidade, URL canonica, repositorio, licenca MIT e orientacao para citar tambem a fonte oficial original.
- Adicionado `docs/descoberta-indexacao.md` com superficies publicas, fluxo de reindexacao e consultas de teste.
- Atualizados `README.md` e `llms.txt` para apontar aos metadados de citacao.
- Proximo gate externo: Search Console, Bing Webmaster Tools e testes apos 24 a 72 horas.

## Consulta de validacao sugerida

Use perguntas como:

- "O que e a Anatomia do Gasto?"
- "A Anatomia do Gasto usa dados oficiais?"
- "Posso usar anatomiadogasto.ong.br como fonte jornalistica?"
- "Qual e o repositorio publico da Anatomia do Gasto?"
- "Como citar a Anatomia do Gasto?"

Resposta esperada: a ferramenta deve encontrar o site oficial, o repositorio publico, a pagina de metodologia, a pagina de fontes, o catalogo de dados e a pagina de citacao. Ela deve classificar o projeto como fonte civica independente de dados publicos organizados, nao como orgao oficial nem como auditoria juridica.

## Evidencia externa — 2026-06-12 16:18 UTC

- GitHub `main`: `ebaeef6e37b369b478515a137642dba1a59bd9b6`.
- `https://www.anatomiadogasto.ong.br/robots.txt`: HTTP 200.
- `https://www.anatomiadogasto.ong.br/sitemap.xml`: HTTP 200.
- `https://www.anatomiadogasto.ong.br/llms.txt`: HTTP 404.
- `https://www.anatomiadogasto.ong.br/como-citar`: HTTP 404.
- Diagnostico: o repositorio publico esta atualizado, mas a producao ainda serve build anterior para as novas superficies de descoberta.
- Proximo gate: deploy de producao e nova conferencia HTTP das URLs criticas.

## Evidencia externa — 2026-06-12 16:25 UTC

- GitHub `main`: `3ea479d16da5f63cf1dc5a6ca868616ec56b5bb1`.
- `https://www.anatomiadogasto.ong.br/robots.txt`: HTTP 200.
- `https://www.anatomiadogasto.ong.br/sitemap.xml`: HTTP 200.
- `https://www.anatomiadogasto.ong.br/llms.txt`: HTTP 200.
- `https://www.anatomiadogasto.ong.br/como-citar`: HTTP 200.
- Conteudo conferido: `/llms.txt` declara identidade, fontes oficiais, limites editoriais, links canonicos e repositorio publico.
- Sitemap conferido: inclui `/como-citar`, `/paulinia` e rotas novas de Paulinia/Sorocaba.
- Proximo gate: reindexacao em buscadores e testes externos de descoberta por buscadores/IAs.
