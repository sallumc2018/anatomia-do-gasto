# Notas Técnicas

Registro cronológico de mudanças relevantes em scripts, pipelines e manifests do projeto.
Cada entrada cobre o que mudou, por que mudou e qual resultado verificável confirma a mudança.

---

## 2026-05-24 — Acoplamento de verificações no pipeline e correção de BOM UTF-8

### 1. `pipelines/pipeline.py` — etapas de verificação acopladas ao pipeline principal

**O que mudou**

Duas etapas de verificação foram inseridas diretamente na sequência do `pipeline.py`, imediatamente após as respectivas etapas de extração:

- `VerificacaoRREO` (executa `verificar_dados_rreo_saude.py`) inserida logo após `ExtracaoRREO`
- `VerificacaoEducacao` (executa `verificar_dados_educacao.py`) inserida logo após `ExtracaoEducacao`
- A etapa genérica `Verificacao` foi renomeada para `VerificacaoSaude` para deixar explícito o escopo

**Por que mudou**

Anteriormente, as verificações de saúde e educação eram etapas separadas executadas manualmente após o pipeline, o que permitia que dados inválidos chegassem a `data/extracted` sem detecção imediata. O acoplamento garante que falhas de verificação interrompam o pipeline no mesmo run, evitando propagação silenciosa de dados corrompidos.

**Resultado verificável**

Executar `pipeline.py --ano <ANO>` faz as verificações de RREO/saúde e educação automaticamente, sem necessidade de comandos adicionais. Falhas de verificação abortam o pipeline na etapa correspondente.

---

### 2. `pipelines/baixar_transferegov_sorocaba.py` — correção de bug BOM UTF-8

**O que mudou**

A função `detectar_dialeto_e_encoding` passou a detectar explicitamente o marcador BOM UTF-8 (`b"\xef\xbb\xbf"`) no início do arquivo antes de chamar o `chardet`. Quando o BOM é detectado, a função retorna `utf-8-sig` em vez de `latin-1`.

**Por que mudou**

Arquivos SICONV exportados no Windows são gerados com BOM UTF-8, mas o conteúdo real é latin-1. O `chardet` analisava os bytes após o BOM e retornava `latin-1` como encoding, fazendo com que o BOM (`\xef\xbb\xbf`) fosse interpretado como os três primeiros bytes do nome da primeira coluna. O resultado era uma chave `﻿ID_PROPOSTA` (com lixo no prefixo) em vez de `ID_PROPOSTA`. O join em cascata `proponentes → proposta → convenio` falhava silenciosamente, retornando 0 linhas em todos os arquivos de saída.

**Resultado verificável**

Após a correção, os arquivos SICONV de Sorocaba carregam com as colunas corretas:

| Arquivo       | Linhas após fix |
|---------------|-----------------|
| convenio      | 195             |
| desembolso    | 207             |
| emenda        | 189             |
| empenho       | 304             |

---

### 3. `data/manifests/datasets.csv` — 13 entradas registradas; área `funserv-rpps` corrigida

**O que mudou**

- 13 conjuntos de dados foram registrados no manifest `datasets.csv`
- A área `funserv-rpps` estava classificada como `fiscal`; corrigida para `autarquias`

**Por que mudou**

O manifest é a fonte de verdade para o script de verificação de publicação (`verificar_publicacao.py`). Entradas ausentes ou com área errada causam falsos positivos/negativos na auditoria de cobertura.

**Resultado verificável**

`verificar_publicacao.py --strict` passou de 30 erros para 0 erros após o registro das 13 entradas e a correção da área.

---

### 4. `verificar_publicacao.py --strict` — zero erros confirmados

**O que mudou**

Não houve alteração no script em si. A execução com `--strict` serviu como teste de regressão para validar as três mudanças acima.

**Por que mudou**

O modo `--strict` trata divergências entre o manifest e os arquivos em `data/public/` como erros fatais. Antes das correções, 30 erros eram reportados. A passagem para 0 erros confirma que manifest, área e arquivos publicados estão em sincronia.

**Resultado verificável**

```
$ python verificar_publicacao.py --strict
... (saída sem erros)
Verificacao concluida: 0 erros
```
