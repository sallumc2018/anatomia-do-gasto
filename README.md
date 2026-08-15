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
- **Datasets publicados:** 189
- **Datasets em validacao:** 2
- **Atualizado em:** 2026-08-15
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

- c08cb3a0eb fix(site): torna o dado do Sprint 2 acessivel e faz a listagem escalar
- 0399fa795a chore(coleta): sprint2 24x7 2026-08-15
- 3739de7eca fix(coleta): serializa git entre Sprint1 e Sprint2 com flock compartilhado
- 270024f449 feat(arquivo): implementa "coleta -> trata -> gdrive", que nao existia
- 950c249113 fix(coleta): remove rclone sync destrutivo de entrada e fecha o ciclo com push
- 0ecc651f43 data(lacunas): regera datasets_status apos rebase da coleta noturna
- 7122528445 chore(coleta): coleta noturna 2026-08-14
- ba49c6e85a chore(coleta): coleta noturna 2026-08-13
- 85fb150f0a chore(coleta): coleta noturna 2026-08-12
- 76bb07a17b chore(coleta): coleta noturna 2026-08-11
<!-- AUTO:activity-end -->
