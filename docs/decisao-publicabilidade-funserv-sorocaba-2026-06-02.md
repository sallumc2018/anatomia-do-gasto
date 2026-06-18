# Decisao: publicabilidade FUNSERV Sorocaba

Data: 2026-06-02

## Decisao

FUNSERV pode permanecer publicado parcialmente com cautela, separado em tres tipos:

- bases agregadas ou institucionais ja publicadas;
- indices textuais sanitizados de PDFs, sem `texto_bruto`;
- APR com valores extraidos, desde que sem campos internos/sensiveis e com contagem alinhada ao extraido atual.

Inicialmente este bloco nao publicou novos dados. Em bloco posterior, com autorizacao explicita, o APR publico foi corrigido de 66 para 71 linhas.

## Estado validado

- APR extraido: 71 linhas, sem `valor_brl` ausente.
- APR publico corrigido: 71 linhas; alinhado ao extraido atual apos autorizacao explicita.
- Indices textuais publicos:
  - avaliacao atuarial: 18/18 linhas, sem `texto_bruto`;
  - governanca: 66/66 linhas, sem `texto_bruto`;
  - balanco previdenciario ate 2018: 178/178 linhas, sem `texto_bruto`;
  - balanco saude ate 2018: 192/192 linhas, sem `texto_bruto`.

## Limites

Os indices textuais publicos sao inventarios/documentos extraidos, nao series financeiras completas. Nao usar esses arquivos para afirmar deficit, rentabilidade, carteira, passivo atuarial ou despesa por categoria sem extracao semantica propria.

O inventario FUNSERV em `data/extracted` tem 818 documentos e deve continuar como trilha de coleta, nao como publicacao integral.

## Correcao preparada

O APR publico pode ser corrigido no futuro com:

```powershell
python tools\data\gerar_funserv_apr_publicacao.py --write-public
```

Sem `--write-public`, o comando roda em dry-run e apenas compara a publicacao atual com a saida extraida. A escrita em `data/public` exige autorizacao explicita.

## QA

O QA de lacunas compara o APR publico com o APR extraido atual. Apos a correcao autorizada, o APR publico esta 71/71.
