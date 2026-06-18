# Linked Data 4 estrelas

## Objetivo

Publicar a camada aberta do Anatomia do Gasto com identificadores URI estaveis para catalogo, municipio, datasets e distribuicoes.

Isso atende a meta de 4 estrelas na escala Tim Berners-Lee:

1. dados disponiveis na web;
2. dados estruturados e legiveis por maquina;
3. formato nao proprietario;
4. URIs para identificar os recursos.

A quinta estrela exige links externos sistematicos para outros datasets. O catalogo ja inclui uma ponte inicial para o municipio de Sorocaba, mas a expansao completa para 5 estrelas deve ser feita com curadoria por entidade.

## Artefatos publicos

- `data/public/linked/catalog.jsonld`
- `data/public/linked/catalog.ttl`

URLs apos deploy:

- `https://www.anatomiadogasto.ong.br/api/dados/linked/catalog.jsonld`
- `https://www.anatomiadogasto.ong.br/api/dados/linked/catalog.ttl`

## URIs

Padrao:

- Catalogo: `https://www.anatomiadogasto.ong.br/id/catalog/anatomia-do-gasto`
- Organizacao: `https://www.anatomiadogasto.ong.br/id/organization/anatomia-do-gasto`
- Municipio: `https://www.anatomiadogasto.ong.br/id/municipio/{municipio}`
- Dataset: `https://www.anatomiadogasto.ong.br/id/dataset/{municipio}/{area}/{tipo}`
- Distribuicao: `https://www.anatomiadogasto.ong.br/id/distribution/{municipio}/{arquivo}`

## Geracao

```powershell
python pipelines\gerar_linked_data_catalog.py
```

O gerador le `data/manifests/datasets.csv` e inclui apenas datasets efetivamente existentes em `data/public`.

## Regras

- Nao incluir `data/raw`, `data/extracted` ou `data/validated`.
- Nao criar URI para dataset ainda nao publicado.
- Manter SHA-256 das distribuicoes para auditoria independente.
- Paulinia so deve entrar no catalogo depois do primeiro dataset publicado e validado.
