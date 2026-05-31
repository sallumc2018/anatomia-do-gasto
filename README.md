# Anatomia do Gasto

Ferramenta aberta de extração, validação e visualização de dados orçamentários municipais.

Site oficial: https://www.anatomiadogasto.ong.br

## Situação Atual

<!-- AUTO:coverage-start -->
**Cobertura atual:**

- **Cidades:** Sorocaba
- **Datasets publicados:** 90
- **Datasets em validação:** 2
- **Atualizado em:** 2026-05-30
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

- 5ae3878 docs: adiciona STATUS.md e DECISIONS.md como fonte única de verdade multi-IA
- baf1c4f chore: adiciona /fluxo-financeiro ao header e sitemap
- 7d64a4f feat: adiciona página /fluxo-financeiro com Sankey de rastro do dinheiro público
- 25381cc [Claude] fix: perguntas rápidas do sandbox + cores dos cards de área
- 2502af4 [Claude] Governança: hooks de segurança (pip/winget/publicação) + memory + Théo training
- 91c41d7 [Claude] Dados Sorocaba: SICONFI fiscal + SAAE/Câmara + Urbes OCR + manifests
- 1d75b5e [Claude] Théo: 4 rotas novas + aviso "em treinamento" + camada de compreensão
- 8e1b300 [Codex] publish SAAE and Camara QA data
- 2b5f111 [Codex] document governance triage readiness
- 93ab00d Add institutional audit and data catalog pages
<!-- AUTO:activity-end -->
