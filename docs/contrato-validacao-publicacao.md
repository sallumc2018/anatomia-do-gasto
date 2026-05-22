# Contrato Mínimo: validated → public

Data: 2026-05-22

Este documento define o que deve ser verdade antes de qualquer arquivo sair de
`data/validated/` e entrar em `data/public/`. O contrato é machine-checkable e
escala para qualquer município.

---

## Por que este contrato existe

O pipeline atual (`publicar_dados.py`) verifica apenas se o nome do arquivo bate
com um padrão registrado em `data/manifests/datasets.csv` com `Origem_Dir=public`.
Isso prova autorização editorial, mas não prova que o QA rodou nem que a fonte
está rastreada por arquivo concreto.

Para escala nacional (5.570 municípios), cada promoção precisa ser reconstituível
por um auditor externo sem depender de memória institucional.

---

## Dois manifestos, dois papéis

| Manifesto | Path | Grão | Papel |
|---|---|---|---|
| `datasets.csv` | `data/manifests/datasets.csv` | por área + padrão de arquivo | Autorização editorial — lista o que pode ser publicado |
| `qa.csv` | `data/manifests/{municipio}/qa.csv` | por arquivo concreto | Prova de QA, fonte e autorização por instância |

---

## Três blocos obrigatórios

### Bloco A — Fonte registrada

Prova que o arquivo publicado tem origem rastreável até uma fonte oficial.

| Campo (qa.csv) | Regra |
|---|---|
| `fonte_url` | não-vazio, começa com `https://` ou `http://` |
| `fonte_arquivo` | nome exato do arquivo de origem (PDF, JSON, CSV bruto) |
| `script_extracao` | path relativo em `pipelines/` que produziu o dado |

### Bloco B — QA passou

Prova que houve validação local antes da promoção.

| Campo (qa.csv) | Regra |
|---|---|
| `status` | valor = `validated` (nunca `raw` ou `extracted`) |
| `validado_por` | não-vazio; nome da pessoa ou script que validou |
| `validado_em` | data ISO 8601 (YYYY-MM-DD), não futura |
| `sha256_raw` | hex 64 chars do arquivo em `data/raw/`; prova rastreabilidade ao bruto |

### Bloco C — Promoção autorizada

Prova que houve decisão institucional consciente, não automação silenciosa.

| Campo | Onde | Regra |
|---|---|---|
| `Origem_Dir` | `datasets.csv` | valor = `public` para o padrão correspondente |
| `municipio` | `datasets.csv` | slug canônico do município (ex: `sorocaba`, `paulinia-sp`) |
| `autorizado_por` | `qa.csv` | não-vazio; identificador do mantenedor que autorizou |

---

## Algoritmo de gate (executado por `publicar_dados.py`)

```
para cada arquivo CSV a promover:

  1. carregar datasets.csv, filtrar por municipio
     → se padrão não encontrado: ERRO ("padrão não registrado")
     → se Origem_Dir != "public": ERRO ("não autorizado para publicação")

  2. carregar data/manifests/{municipio}/qa.csv
     → se arquivo não encontrado: ERRO ("QA manifest ausente")
     → se linha do arquivo não encontrada: ERRO ("arquivo sem entrada no QA manifest")

  3. verificar Bloco A:
     → fonte_url começa com http: OK; senão ERRO
     → fonte_arquivo não-vazio: OK; senão ERRO
     → script_extracao não-vazio: OK; senão ERRO

  4. verificar Bloco B:
     → status == "validated": OK; senão ERRO
     → validado_por não-vazio: OK; senão ERRO
     → validado_em é data válida ISO 8601: OK; senão ERRO
     → sha256_raw tem 64 chars hex: OK; senão ERRO

  5. verificar Bloco C (qa.csv):
     → autorizado_por não-vazio: OK; senão ERRO

  6. shutil.copy2(validated → public)
```

Escape hatch para migração de arquivos legados (já em public antes deste contrato):
usar `--skip-qa-gate` explicitamente. O flag deve ser removido assim que o qa.csv
for retroativamente preenchido para os arquivos existentes.

---

## Convenção de slugs de município

| Situação | Slug | Exemplo de arquivo |
|---|---|---|
| Município histórico (já publicado) | nome da cidade, sem UF | `sorocaba` |
| Municípios novos (a partir do 2º) | `{nome}-{uf}` em lowercase | `paulinia-sp` |

Motivo: Sorocaba já usa `sorocaba` em todos os paths e nomes de arquivo. Mudar
retroativamente quebraria URLs publicadas. Municípios novos adotam o formato
com UF desde o início para evitar colisões.

---

## Schema do qa.csv

```
arquivo,area,ano,municipio,fonte_url,fonte_arquivo,script_extracao,
validado_por,validado_em,sha256_raw,autorizado_por,status,observacao
```

Campos obrigatórios para gate: todos exceto `observacao`.

Campos opcionais (registrar quando disponível):
- `observacao`: limitações conhecidas, gaps, decisões editoriais

---

## Responsabilidades

| Papel | Responsabilidade |
|---|---|
| Pipeline (scripts automáticos) | Preencher `fonte_url`, `fonte_arquivo`, `script_extracao`, `sha256_raw`, `validado_por=script`, `validado_em=<data>`, `status=validated` |
| Mantenedor (pessoa) | Preencher `autorizado_por` e confirmar `Origem_Dir=public` no datasets.csv |
| `publicar_dados.py` | Verificar os 3 blocos antes de copiar; nunca copiar sem gate |

---

## Arquivos de referência

- [politica-publicacao-dados.md](politica-publicacao-dados.md) — política institucional
- [auditoria-seguranca-publicacao.md](auditoria-seguranca-publicacao.md) — classificação de camadas
- `data/manifests/README.md` — papel dos manifestos
- `data/manifests/datasets.csv` — registro de autorização por área
- `data/manifests/{municipio}/qa.csv` — QA manifest por arquivo
- `pipelines/publicar_dados.py` — executor do gate
