# Anatomia do Gasto

Ferramenta aberta de extração, validação e visualização de dados orçamentários municipais.

Site oficial: https://www.anatomiadogasto.ong.br

## Situação Atual

- Saúde Sorocaba: dados publicados para 2020-2025.
- Educação Sorocaba: dados publicados para 2020-2025.
- Auditoria de agentes políticos: mock de desenvolvimento, sinalizado visualmente como fictício.

O projeto não realiza auditoria jurídica nem emite juízo sobre legalidade dos gastos. Ele organiza dados oficiais e registra metodologia para verificação independente.

## Auditoria E Publicacao

- O site oficial lê apenas `data/public`.
- `data/raw`, `data/extracted` e `data/validated` são camadas operacionais distintas e não devem ser tratadas automaticamente como publicação.
- Toda decisão de tornar um dado público ou não público deve ser justificável por fonte independente.

Referências:

- [docs/arquitetura.md](docs/arquitetura.md)
- [docs/seguranca.md](docs/seguranca.md)
- [docs/auditoria-seguranca-publicacao.md](docs/auditoria-seguranca-publicacao.md)

## Estrutura

```
anatomia-do-gasto/
├── apps/web/              # site Next.js
├── data/
│   ├── raw/               # fontes brutas preservadas
│   ├── extracted/         # dados extraídos, ainda não publicados
│   ├── validated/         # dados aprovados localmente
│   ├── public/            # única fonte de dados lida pelo site
│   └── manifests/         # inventários e status dos datasets
├── pipelines/             # coleta, extração, validação e publicação
├── docs/                  # documentação
└── tools/rtk/             # contrato local de uso do RTK
```

## Fluxo

```
fonte oficial
  -> data/raw
  -> pipelines
  -> data/extracted
  -> validação local
  -> data/validated
  -> data/public
  -> apps/web
  -> Vercel
  -> site oficial
```

O site nunca deve ler `data/extracted` diretamente.

## Ambiente

Veja [docs/ambiente.md](docs/ambiente.md).

Resumo Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

cd apps\web
npm.cmd install
npm.cmd run dev
```

Resumo WSL/Linux:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt

cd apps/web
npm install
npm run dev
```

## Pipeline

```powershell
.\.venv\Scripts\python.exe pipelines\pipeline.py --ano 2025
.\.venv\Scripts\python.exe pipelines\testes\verificar_dados.py --ano 2025
.\.venv\Scripts\python.exe pipelines\publicar_dados.py --area saude --ano 2025
```

Detalhes em [docs/pipeline.md](docs/pipeline.md).

## Publicação

A Vercel deve usar:

- Root Directory: `apps/web`
- Build Command: `npm run build`
- Install Command: `npm install`

Dados só devem ser commitados em `data/public` depois de validação local.

## Auditoria

Manifests ficam em `data/manifests`. Cada dataset publicável deve registrar fonte, status e observações suficientes para auditoria independente.
