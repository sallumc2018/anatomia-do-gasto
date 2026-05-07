# Arquitetura

O projeto separa coleta, validação e publicação para permitir auditorias independentes. Nenhum dado extraído deve ir para o site antes de passar pela camada de validação.

## Camadas

```
anatomia-do-gasto/
├── apps/web/                 # site Next.js publicado pela Vercel
├── data/
│   ├── raw/                  # fontes brutas, sem edição manual
│   ├── extracted/            # saída mecânica dos extratores
│   ├── validated/            # dados aprovados por verificação local
│   ├── public/               # única fonte de dados lida pelo site
│   └── manifests/            # inventários, hashes e status
├── pipelines/                # coleta, extração, validação e publicação
├── docs/                     # documentação técnica e pública
└── tools/rtk/                # contrato local de uso do RTK
```

## Fluxo De Dados

```
fonte oficial
  -> data/raw
  -> pipelines/*
  -> data/extracted
  -> pipelines/testes/*
  -> data/validated
  -> pipelines/publicar_dados.py
  -> data/public
  -> apps/web
  -> Vercel
  -> www.anatomiadogasto.ong.br
```

## Regra De Publicação

- `data/raw`: evidência primária. Pode conter PDFs, HTMLs ou CSVs originais.
- `data/extracted`: resultado de leitura automática. Ainda não é publicação.
- `data/validated`: resultado aprovado por teste local, revisão manual ou ambos.
- `data/public`: fonte única do site oficial.

O frontend nunca deve ler `data/raw`, `data/extracted` ou `data/validated` diretamente. Essa regra impede que CSVs ainda não validados apareçam no site por acidente.

## Aplicação Web

O Next.js fica em `apps/web`. A Vercel deve usar essa pasta como Root Directory.

O código server-side em `apps/web/lib/data.ts` localiza `data/public` subindo a árvore de diretórios. Isso permite rodar tanto com `cwd` na raiz do repositório quanto dentro de `apps/web`.

## Pipeline

Os scripts ficam em `pipelines`. O arquivo `pipelines/paths.py` centraliza os caminhos para evitar referências antigas como `frontend/data` ou `sorocaba/saida`.

O pipeline escreve em `data/extracted`. A publicação para `data/public` deve ser feita explicitamente, após validação, com:

```powershell
python pipelines/publicar_dados.py --area saude --ano 2025
python pipelines/publicar_dados.py --area educacao --ano 2025
```

## Auditoria

Cada conjunto publicável deve ter registro em `data/manifests`, incluindo:

- fonte oficial;
- URL oficial da fonte;
- nome exato do arquivo de origem;
- data de coleta;
- arquivo bruto;
- arquivo extraído;
- arquivo validado;
- hash SHA256 quando disponível;
- script de extração;
- critério ou responsável pela validação local;
- data de publicação em `data/public`;
- caminho do arquivo publicado;
- status de publicação.

`data/manifests` deve funcionar como camada pública de prova. Isso permite que o projeto continue open source e auditável sem tornar `data/raw`, `data/extracted` e `data/validated` públicos por padrão.
