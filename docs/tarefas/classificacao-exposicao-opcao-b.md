# Classificacao De Exposicao - Opcao B

Data base: 2026-05-07

Escopo desta classificacao:

- arquivos anteriormente versionados em `data/raw`;
- arquivos anteriormente versionados em `data/extracted`;
- arquivos anteriormente versionados em `data/validated`.

Total auditado na migracao local:

- `132` arquivos.

## Grupo 1 - Sai Do Repositorio Publico

Status: **aplicado localmente**

Todos os `132` arquivos atuais entram neste grupo.

### 1. `data/raw` - 46 arquivos

Sai do repositorio publico porque:

- e camada de evidencia primaria, nao camada de publicacao;
- a auditabilidade externa pode ser sustentada por `data/manifests`, nome do arquivo, URL oficial e hash;
- manter PDFs brutos publicos por default aumenta peso e exposicao sem necessidade proporcional.

Subgrupos principais:

- educacao - PDFs trimestrais 2020-2025;
- saude - PDFs de quadrimestre e RREO;
- execucao - livros contabeis 2020 e 2024.

### 2. `data/extracted` - 44 arquivos

Sai do repositorio publico porque:

- e saida mecanica dos extratores;
- pode conter erro de parsing, OCR ou mapeamento;
- nao e publicacao institucional;
- em `execucao`, amplia de forma relevante a descobribilidade de rastros financeiros detalhados.

Subgrupos principais:

- educacao - CSVs 2020-2025;
- saude - CSVs 2020-2025;
- execucao - `conta_corrente_fornecedor` e `despesa_orcamentaria`.

### 3. `data/validated` - 42 arquivos

Sai do repositorio publico porque:

- representa aprovacao local, nao publicacao final;
- precisa permanecer como camada interna intermediaria;
- a publicacao institucional correta continua sendo `data/public`.

Subgrupos principais:

- educacao - CSVs 2020-2025;
- saude - CSVs 2020-2025.

## Grupo 2 - Fica Por Excecao Justificada

Status atual: **nenhum arquivo atual**

Nao existe, neste momento, nenhum arquivo entre os `132` que precise permanecer publico no GitHub para sustentar a confianca institucional.

Motivo:

- manifests publicos foram fortalecidos;
- o site continua servindo `data/public`;
- o codigo do pipeline continua aberto;
- a trilha de auditabilidade ja pode ser reconstruida sem expor as camadas operacionais por default.

## Grupo 3 - Precisa De Decisao Institucional

Status atual: **nenhum arquivo atual pendente para permanencia**

Nao ha arquivo dos `132` que eu recomende manter publico sem decisao adicional.

O que existe sao **candidatos futuros de excecao**, se a ONG quiser abrir casos especificos:

1. PDFs brutos de `execucao` de 2020 e 2024
2. CSVs extraidos de `execucao` de 2020 e 2024

Esses candidatos so devem voltar a discussao publica se houver:

- auditoria externa concreta;
- necessidade real de prova adicional alem de manifesto, hash e documentacao;
- justificativa institucional escrita.

## Conclusao

Para a Opcao B, a classificacao atual e:

- **Grupo 1 - sai do repositorio publico:** `132`
- **Grupo 2 - fica por excecao justificada:** `0`
- **Grupo 3 - precisa de decisao institucional para permanencia atual:** `0`

As futuras excecoes, se existirem, devem nascer de demanda de auditoria especifica, nao de conveniencia tecnica.
