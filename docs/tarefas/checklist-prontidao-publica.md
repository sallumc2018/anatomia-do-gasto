# Checklist De Prontidao Publica

Data base: 2026-05-07

Este checklist existe para responder cinco perguntas diferentes:

1. o projeto esta seguro?
2. o projeto esta auditavel?
3. o projeto esta indexavel?
4. o projeto esta descobrivel?
5. o projeto esta pronto para ser publicamente promovido?

Cada item abaixo deve ser tratado como criterio operacional, nao como impressao geral.

## 1. Seguro

- [x] O site oficial le apenas `data/public`.
- [x] `.env.local` permanece fora do Git.
- [x] Nao ha login, upload ou formularios publicos no site.
- [x] HTTPS esta ativo na Vercel.
- [x] Headers basicos de seguranca estao configurados no frontend.
- [ ] Definir institucionalmente a politica de exposicao de `data/raw`, `data/extracted` e `data/validated` no GitHub publico.
- [ ] Revisar se o repositorio publico contem arquivos que nao deveriam ser versionados publicamente.
- [ ] Restringir explicitamente a superficie local do dashboard no Windows firewall.
- [ ] Definir rotina operacional para ADB/SSH do tablet: quando ligar, quando desligar, quando revogar acesso.

## 2. Auditavel

- [x] O site declara a origem oficial dos dados.
- [x] O codigo-fonte do pipeline e do frontend esta aberto.
- [x] Existe politica escrita para publicacao e nao publicacao em `docs/auditoria-seguranca-publicacao.md`.
- [x] Os extratores ja carregam `Fonte_PDF` e `Fonte_URL` em parte da camada extraida.
- [ ] Verificar se toda camada publicada em `data/public` preserva rastreabilidade suficiente para auditor externo.
- [ ] Garantir que cada decisao de publicacao fora de `data/public` tenha justificativa escrita e fonte independente.
- [ ] Revisar README, docs e paginas publicas para garantir que a politica publicada bate com o que o repositorio realmente expoe.

## 3. Indexavel

- [x] `robots.ts` existe.
- [x] `sitemap.ts` existe.
- [x] Metadata base do site foi fortalecida.
- [ ] Validar em ambiente publico os headers e o HTML final entregue.
- [ ] Cadastrar e verificar o dominio no Google Search Console.
- [ ] Confirmar se as paginas principais possuem titulo, descricao e canonical coerentes com as buscas reais.

## 4. Descobrivel

- [x] O site tem base tecnica minima para indexacao.
- [ ] Definir lista de consultas-chave que a ONG quer capturar no Google.
- [ ] Revisar titulos, subtitulos e copy das paginas de Saude, Educacao, Metodologia e Auditoria com foco em busca real.
- [ ] Definir plano de distribuicao externa: GitHub, parceiros, imprensa local, conselhos, redes sociais.
- [ ] Definir quais paginas devem funcionar como portas de entrada organica.

## 5. Publicavel

- [ ] Fechar a fronteira entre "site publico" e "repositorio publico".
- [ ] Revisar tudo que esta modificado localmente antes de qualquer commit desta frente.
- [ ] Validar frontend localmente com lint e build em ambiente estavel.
- [ ] Revisar documentacao institucional final antes de promover a ONG ativamente.

## Bloqueadores Atuais

1. O maior bloqueador nao esta no site - esta no GitHub publico:
   `data/raw`, `data/extracted` e `data/validated` continuam versionados.
2. O repositorio ainda precisa de uma decisao institucional explicita sobre o que pode continuar publico fora de `data/public`.
3. A superficie local do dashboard/tablet esta melhor, mas ainda nao esta completamente endurecida no firewall do Windows.

## Ordem Recomendada

1. Seguranca e confiabilidade institucional.
2. Politica de publicacao de dados no GitHub.
3. Revisao de auditabilidade externa.
4. Validacao tecnica final do site.
5. Descoberta e distribuicao.
