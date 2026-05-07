# Politica De Publicacao De Dados

Data base: 2026-05-07

Esta politica define como o Anatomia do Gasto concilia:

- transparencia publica;
- auditabilidade independente;
- seguranca institucional;
- projeto open source.

## Decisao Institucional

O projeto adota **open source seletivo com manifests publicos**.

Isso significa:

- o **codigo** permanece aberto;
- a **documentacao** permanece aberta;
- o **pipeline** permanece aberto;
- `data/public` permanece publico;
- `data/manifests` permanece publico;
- `data/raw`, `data/extracted` e `data/validated` sao **internos por padrao**.

## Camadas

### 1. `data/public`

Camada publica oficial.

- alimenta o site;
- representa o dado ja promovido institucionalmente;
- pode ser divulgado, espelhado e citado como publicacao oficial do projeto.

### 2. `data/manifests`

Camada publica de prova.

- documenta origem, status, scripts e rastreabilidade;
- permite auditoria independente sem exigir publicacao irrestrita das camadas operacionais;
- deve ser suficiente para que um terceiro reconstrua a trilha de publicacao.

### 3. `data/raw`

Camada interna de evidencia primaria.

- contem PDFs, HTMLs ou arquivos oficiais brutos;
- nao e publica por padrao no repositorio;
- pode ter excecao quando a fonte oficial for instavel, mutavel ou dificil de reproduzir externamente.

### 4. `data/extracted`

Camada interna de saida mecanica.

- contem resultado automatico dos extratores;
- nao e publica por padrao;
- pode conter erros de parsing, OCR, mapeamento ou granularidade excessiva;
- nunca deve ser tratada como publicacao automatica.

### 5. `data/validated`

Camada interna de aprovacao local.

- representa dado revisado, mas ainda nao necessariamente publicado;
- nao e publica por padrao;
- so vira publicacao ao ser promovida explicitamente para `data/public`.

## Regra De Excecao

Arquivos em `raw`, `extracted` ou `validated` so podem permanecer publicos por excecao quando houver justificativa escrita que responda:

1. qual e a fonte oficial independente;
2. qual e a finalidade publica especifica da republicacao;
3. por que manifesto, hash, amostra ou documentacao nao bastam;
4. por que o ganho de auditabilidade supera o aumento de exposicao;
5. qual o risco institucional adicional criado pela republicacao.

Se uma dessas respostas estiver fraca, o default e **nao publicar**.

## Open Source

O projeto continua open source no que importa para confianca publica:

- frontend;
- scripts de coleta e extracao;
- testes;
- manifests;
- documentacao;
- dados ja publicados em `data/public`.

Ele nao adota "repositorio totalmente aberto com todas as camadas de dados" porque isso confundiria:

- operacao interna;
- validacao local;
- publicacao institucional.

## Auditoria Independente

Para cada dataset publicado, um auditor externo deve conseguir verificar, sem depender de confianca cega:

- fonte oficial;
- URL da fonte;
- nome do arquivo de origem;
- script usado;
- status da validacao;
- arquivo final publicado;
- eventuais limitacoes conhecidas.

Essa prova deve estar em `data/manifests`.

## Estado Atual

No momento desta politica:

- o site ja esta alinhado a `data/public`;
- a camada de manifests foi fortalecida;
- o repositorio ainda precisa de ajuste tecnico para refletir totalmente esta politica no GitHub publico.

## Proximos Passos Tecnicos

1. auditar arquivos hoje expostos fora de `data/public` e `data/manifests`;
2. decidir o destino de cada camada hoje versionada em `raw`, `extracted` e `validated`;
3. separar o que fica publico por excecao do que sai do repositorio publico;
4. so depois avaliar se a limpeza deve valer apenas daqui para frente ou tambem para o historico.
