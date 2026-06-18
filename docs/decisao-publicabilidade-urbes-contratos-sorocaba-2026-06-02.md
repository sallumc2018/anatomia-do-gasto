# Decisao: publicabilidade URBES contratos Sorocaba

Data: 2026-06-02

## Decisao

Os contratos URBES podem ser publicados apenas como indice OCR sanitizado e com cautela, sem texto bruto de OCR e sem afirmar completude sem comparar contra o OCR extraido atual.

Os arquivos reparseados com fornecedor, CNPJ e valor permanecem em `data/extracted` como candidatos internos. Eles ajudam QA e analise, mas nao substituem revisao de publicabilidade porque a cobertura semantica ainda e parcial por natureza dos documentos.

## Estado validado

- `contratos_outros`: 47 PDFs, 47 OCR, 47 reparse; indice publico atual tem 47 linhas.
- `contratos_receitas`: 91 PDFs, 91 OCR, 91 reparse; indice publico atual tem 91 linhas.
- `contratos_transporte`: 47 PDFs, 47 OCR, 47 reparse; indice publico corrigido para 47 linhas apos autorizacao explicita.

Campos semanticos atuais nos reparses:

- `contratos_outros`: 31 numeros de contrato, 23 fornecedores, 28 CNPJs, 22 valores.
- `contratos_receitas`: 67 numeros de contrato, 62 fornecedores, 46 CNPJs, 37 valores.
- `contratos_transporte`: 1 numero de contrato, 14 fornecedores, 14 CNPJs, 13 valores.

## Limite de publicacao

Inicialmente nao houve copia para `data/public`. Em bloco posterior, com autorizacao explicita, o indice publico de transporte foi corrigido de 39 para 47 linhas.

Comando preparado para futura correcao autorizada:

```powershell
python tools\data\gerar_urbes_indices_publicos.py --write-public
```

Sem `--write-public`, o comando roda em dry-run e apenas mostra a diferenca entre OCR extraido e indice publico.

## QA

O QA de lacunas compara os indices publicos URBES contra os OCRs extraidos. Apos a correcao autorizada, `contratos_transporte` publico esta 47/47.
