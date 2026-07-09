# Anatomia do Gasto

Ferramenta aberta para extracao, validacao e visualizacao de dados orcamentarios municipais.

Site oficial: https://www.anatomiadogasto.ong.br

Repositorio oficial: https://github.com/sallumc2018/anatomia-do-gasto

Como citar: https://www.anatomiadogasto.ong.br/como-citar

Arquivo para agentes e IAs: https://www.anatomiadogasto.ong.br/llms.txt

Metadados de citacao para GitHub e ferramentas academicas: [CITATION.cff](CITATION.cff)

## Verificacao rapida

- O projeto e uma fonte civica independente, nao um orgao governamental.
- Os dados publicados pelo site devem vir somente de `data/public`.
- As fontes primarias sao portais oficiais municipais e bases federais declaradas em [fontes](https://www.anatomiadogasto.ong.br/fontes) e [metodologia](https://www.anatomiadogasto.ong.br/metodologia).
- Para uso jornalistico, cite a Anatomia do Gasto como indice, organizador e visualizador, mas cite tambem a fonte oficial original do dado factual.
- O projeto nao realiza auditoria juridica nem presume ilegalidade, dolo ou culpa.

## Para novos colaboradores

Se voce quer ajudar como dev, comece por aqui:

- Leia [CONTRIBUTING.md](CONTRIBUTING.md).
- Rode o projeto localmente em `localhost:3000`.
- Escolha uma tarefa pequena e revisavel antes de mexer em pipeline ou dados.
- Nunca trate `data/extracted` ou `data/validated` como publicacao.
- Dados exibidos no site devem vir somente de `data/public`.

Guia rapido: [docs/onboarding-dev.md](docs/onboarding-dev.md).

## Situacao atual

<!-- AUTO:coverage-start -->
**Cobertura atual:**

- **Cidades:** Bauru, Campinas, Carapicuiba, Diadema, Guarulhos, Itaquaquecetuba, Jundiai, Maua, Mogi das Cruzes, Osasco, Paulinia, Piracicaba, Ribeirao Preto, Santo Andre, Santos, Sao Bernardo do Campo, Sao Jose do Rio Preto, Sao Jose dos Campos, Sao Paulo, Sao Vicente, Sorocaba
- **Datasets publicados:** 176
- **Datasets em validacao:** 2
- **Atualizado em:** 2026-07-09
<!-- AUTO:coverage-end -->

O projeto nao realiza auditoria juridica nem emite juizo sobre legalidade dos gastos. Ele organiza dados oficiais e registra metodologia para verificacao independente.

## Regras de publicacao

- O site oficial le apenas `data/public`.
- `data/raw`, `data/extracted` e `data/validated` sao camadas operacionais.
- Toda promocao para `data/public` precisa de validacao local e fonte auditavel.
- Nao publique ranking, acusacao ou inferencia sobre pessoa ou orgao sem evidencia medida e revisao.

Referencias:

- [docs/arquitetura.md](docs/arquitetura.md)
- [docs/seguranca.md](docs/seguranca.md)
- [docs/auditoria-seguranca-publicacao.md](docs/auditoria-seguranca-publicacao.md)
- [docs/politica-publicacao-dados.md](docs/politica-publicacao-dados.md)
- [docs/descoberta-indexacao.md](docs/descoberta-indexacao.md)

## Estrutura

```text
anatomia-do-gasto/
  apps/web/       site Next.js
  data/
    raw/          fontes brutas preservadas
    extracted/    dados extraidos, ainda nao publicados
    validated/    dados aprovados localmente
    public/       unica fonte de dados lida pelo site
    manifests/    inventarios e status dos datasets
  docs/           documentacao
  memory/         proveniencia, registro e governanca operacional
  pipelines/      coleta, extracao, validacao e publicacao
  tools/          automacoes locais e gates de qualidade
```

## Ambiente rapido

Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

cd apps\web
npm.cmd ci --ignore-scripts
npm.cmd run dev
```

WSL/Linux:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt

cd apps/web
npm ci --ignore-scripts
npm run dev
```

Abra http://localhost:3000.

Detalhes em [docs/ambiente.md](docs/ambiente.md).

## Validacao local

Antes de abrir PR, rode o que se aplica ao seu escopo:

```powershell
python tools\agents\validate-area.py --area scope
python tools\agents\validate-area.py --area publication

cd apps\web
npm.cmd run lint
npm.cmd run build
```

Se voce alterou memoria, governanca, dados ou publicacao, registre a proveniencia conforme as regras do projeto.

## Pull requests

PRs pequenos sao mais faceis de revisar. Inclua:

- O que mudou e por que.
- Como validar localmente.
- Quais rotas, arquivos ou dados foram afetados.
- Fonte oficial, periodo e limitacoes quando houver dados.

Use o template de PR do repositorio.

## Vercel

Configuracao esperada:

- Root Directory: `apps/web`
- Build Command: `npm run build`
- Install Command: `npm ci --ignore-scripts`

Deploy nao deve ser acionado manualmente sem autorizacao do mantenedor.

## Atividade recente

<!-- AUTO:activity-start -->
**Atividade recente:**

- ef0fbe2d fix(educacao): substituir fontes mortas de FNDE/SIOPE por SICONFI RREO Anexo 14
- a6d478dd docs(municipios): documentar distinção sao_bernardo vs sao_bernardo_do_campo
- 6229fb54 merge: sincronizar com 9 PRs Dependabot mergeadas (#1-9)
- bda78428 chore(deps): bump next from 16.2.6 to 16.2.10 in /apps/web (#8)
- 76bb8aa7 chore(deps-dev): bump @types/node from 20.19.39 to 26.1.1 in /apps/web (#9)
- 048b1e35 chore(deps): bump actions/setup-python from 5 to 6 (#4)
- eedbe3d5 chore(deps): bump actions/checkout from 4 to 7 (#3)
- 673b86f2 chore(deps): bump actions/setup-node from 4.4.0 to 6.4.0 (#2)
- 6d73ae2a chore(deps): bump astral-sh/setup-uv from 5 to 7 (#1)
- eff3ec69 chore(deps): bump react-dom from 19.2.4 to 19.2.7 in /apps/web (#5)
<!-- AUTO:activity-end -->
