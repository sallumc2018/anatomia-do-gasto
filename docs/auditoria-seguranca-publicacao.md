# Auditoria De Seguranca E Publicacao

Data: 2026-05-07

## Regra Central

Toda decisao de tornar um dado **publico** ou **nao publico** deve ser auditavel por fonte independente.

Isso significa que a decisao precisa poder ser reconstruida depois com base em:

1. origem oficial do dado;
2. finalidade publica do projeto;
3. risco de exposicao adicional criado pela republicacao;
4. necessidade operacional real de manter o arquivo no repositório publico.

Conforto operacional, conveniencia tecnica ou "sempre fizemos assim" nao bastam.

## Distincao Necessaria

### Site publico

O site oficial le apenas `data/public`.

### Repositorio publico

O GitHub publica tudo o que estiver versionado, inclusive arquivos que o site nao usa.

Logo, a pergunta correta nao e apenas "o site mostra isso?".

A pergunta correta e:

- isto precisa estar publico no **site**?
- isto precisa estar publico no **repositorio**?

## Classificacao Atual

### 1. `data/public`

Status recomendado: **publico**

Justificativa:
- e a camada explicitamente publicada;
- alimenta o site;
- representa o dado ja validado para consumo civico;
- a exposicao e coerente com a finalidade institucional da ONG.

### 2. `data/manifests`

Status recomendado: **publico com revisao de conteudo**

Justificativa:
- inventarios e metadados ajudam auditoria externa;
- podem documentar origem, hash, data de coleta e status de publicacao.

Restricao:
- nao devem incluir segredos, caminhos pessoais, tokens ou informacoes operacionais sensiveis.

### 3. `data/raw`

Status recomendado: **nao publico por padrao no repositorio**

Justificativa:
- contem evidencia primaria e e importante para reproducao;
- mas republicar PDFs brutos no repo nao e necessario para o site funcionar;
- aumenta peso, redistribuicao e superficie de exposicao sem ganho institucional proporcional.

Excecao:
- um arquivo bruto pode ser publicado deliberadamente quando houver necessidade explicita de auditoria externa e justificativa documentada.

### 4. `data/extracted`

Status recomendado: **nao publico por padrao**

Justificativa:
- e saida mecanica ainda nao publicada;
- pode conter colunas e granularidades que ampliam muito a descobribilidade do dado;
- pode carregar erros de OCR, parsing ou mapeamento ainda nao consolidados;
- pode induzir reutilizacao indevida de dado ainda nao validado.

Risco concreto identificado:
- `data/extracted/sorocaba/execucao/saida/*` expõe fornecedor, processo, nota de empenho, datas e rastros financeiros detalhados em escala alta.

Mesmo quando a fonte original e publica, a extração estruturada muda o nivel de exposicao.

### 5. `data/validated`

Status recomendado: **nao publico por padrao**

Justificativa:
- e camada de aprovacao local, nao necessariamente de publicacao;
- pode conter material pronto para subir, mas ainda sem decisao institucional final;
- deve virar publico apenas por copia explicita para `data/public`.

## Regra De Decisao

Para qualquer dataset fora de `data/public`, responder documentadamente:

1. Qual a fonte oficial independente?
2. Qual a finalidade publica especifica de republicar este arquivo?
3. O ganho de auditabilidade supera o aumento de exposicao?
4. O mesmo objetivo pode ser atendido com manifesto, hash, amostra ou documentacao em vez do arquivo inteiro?

Se a resposta a 2, 3 e 4 nao estiver clara, o default deve ser **nao publicar**.

## Achados Operacionais

### O que esta bem protegido

- `.env.local` fora do Git
- sem tokens evidentes versionados
- site sem login, upload ou formularios
- HTTPS na Vercel

### O que precisa de atencao

- o repositorio hoje versiona `data/raw`, `data/extracted` e `data/validated`
- o dashboard local roda na rede interna
- ADB e SSH do tablet ampliam superficie local quando ficam habilitados sem necessidade

## Recomendacao

1. Manter `data/public` como unica camada publicavel por default.
2. Tratar `raw/extracted/validated` como camadas internas, salvo decisao auditavel em contrario.
3. Quando houver necessidade de auditoria externa:
   - preferir manifesto, hash, documentacao de origem e amostras pequenas;
   - publicar o arquivo inteiro apenas com justificativa escrita.

## Bloqueadores Atuais Para Auditoria Publica

### 1. Fronteira incompleta entre site publico e repositorio publico

O site esta corretamente limitado a `data/public`, mas o GitHub publico continua expondo camadas operacionais:

- `data/raw`
- `data/extracted`
- `data/validated`

Isso significa que o projeto ainda nao esta institucionalmente pronto para "forcar divulgacao" sem antes decidir se essa exposicao ampliada e deliberada ou acidental.

### 2. `data/extracted` amplia exposicao de forma material

Especialmente em:

- `data/extracted/sorocaba/execucao/saida/*`

Essa camada aumenta muito a descobribilidade de dados financeiros detalhados. Mesmo quando a fonte original e publica, a republicacao estruturada altera o nivel de acessibilidade do dado.

### 3. `data/validated` nao deve ser confundido com dado publicado

`data/validated` representa aprovacao local, nao decisao institucional final de publicacao. Mantelo publicamente versionado reduz a clareza da trilha:

`raw -> extracted -> validated -> public`

## Decisoes Ainda Pendentes

1. `data/raw` ficara no repositorio publico?
2. `data/extracted` ficara no repositorio publico?
3. `data/validated` ficara no repositorio publico?
4. Se alguma dessas camadas permanecer publica, qual a justificativa institucional documentada?
5. Quando a auditoria externa precisar de prova adicional, vamos publicar:
   - o arquivo inteiro;
   - um manifesto;
   - hashes;
   - ou uma amostra controlada?
