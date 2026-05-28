# Anatomia do Gasto

Ferramenta aberta de extração, validação e visualização de dados orçamentários municipais.

Site oficial: https://www.anatomiadogasto.ong.br

## Situação Atual

<!-- AUTO:coverage-start -->
**Cobertura atual:**

- **Cidades:** Sorocaba
- **Datasets publicados:** 51
- **Datasets em validação:** 2
- **Atualizado em:** 2026-05-24
<!-- AUTO:coverage-end -->

O projeto não realiza auditoria jurídica nem emite juízo sobre legalidade dos gastos. Ele organiza dados oficiais e registra metodologia para verificação independente.

## Auditoria E Publicacao

- O site oficial lê apenas `data/public`.
- `data/raw`, `data/extracted` e `data/validated` são camadas operacionais distintas e não devem ser tratadas automaticamente como publicação.
- Toda decisão de tornar um dado público ou não público deve ser justificável por fonte independente.

Referências:

- [docs/arquitetura.md](docs/arquitetura.md)
- [docs/seguranca.md](docs/seguranca.md)
- [docs/auditoria-seguranca-publicacao.md](docs/auditoria-seguranca-publicacao.md)
- [docs/politica-publicacao-dados.md](docs/politica-publicacao-dados.md)

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

## Tecnologias Utilizadas

- [Next.js](https://nextjs.org/docs): site publico em `apps/web`.
- [React](https://react.dev/learn) e TypeScript: interface cidada e componentes do frontend.
- [Python 3.12](https://docs.python.org/3.12/): pipelines de coleta, validacao e publicacao de dados.
- CSV/JSON versionados: dados publicos ficam em `data/public` e manifests em `data/manifests`.

Resumo Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

cd apps\web
npm.cmd ci --ignore-scripts
npm.cmd run dev
```

Resumo WSL/Linux:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt

cd apps/web
npm ci --ignore-scripts
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
- Install Command: `npm ci --ignore-scripts`

Dados só devem ser commitados em `data/public` depois de validação local.

## Auditoria

Manifests ficam em `data/manifests`. Cada dataset publicável deve registrar fonte, status e observações suficientes para auditoria independente.

## Atividade Recente

<!-- AUTO:activity-start -->
**Atividade recente:**

- c09b6f9 chore: adiciona playwright ao requirements e corrige hook UserPromptSubmit
- 4328119 security(ci): pin actions por SHA e restringir permissions a read
- 288da6a feat(lai): fechar lista de pedidos LAI — 35→40 pedidos, 2 publicados
- 51b0681 feat(lai): página diário cidadão LAI + lib de pedidos e-SIC
- 937726c feat(pncp): extrai contratos+atas+compras Sorocaba 2022-2025 via Playwright
- 2b3c659 docs(sessao): registra documentacao tecnica, LAI e analise cidada
- e808f36 fix(transferegov): corrige BOM UTF-8 que quebrava cascade de IDs
- 6931e46 feat(pipeline+lai+analise): fecha Blocos II e III das Clausulas Petras
- 25041b7 feat(lacunas): arquitetura dinâmica de métricas — JSON gerado por script
- b88c47a chore(cobertura): atualiza status Urbes para em_coleta e manifesto LAI
<!-- AUTO:activity-end -->
