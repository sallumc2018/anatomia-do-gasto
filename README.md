# Anatomia do Gasto

Ferramenta aberta de extração, validação e visualização de dados orçamentários municipais.

Site oficial: https://www.anatomiadogasto.ong.br

## Situação Atual

<!-- AUTO:coverage-start -->
**Cobertura atual:**

- **Cidades:** Paulinia, Sorocaba
- **Datasets publicados:** 38
- **Datasets em validação:** 2
- **Atualizado em:** 2026-05-23
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

## Atividade Recente

<!-- AUTO:activity-start -->
**Atividade recente:**

- 0578a7b data(transferencias): publica transferencias federais TCE-SP 2020-2025
- 97da94b feat(frontend): pÃ¡ginas autarquias, controle-externo + nav emendas + cÃ¢mara TCE
- 0b229c2 refactor(pipelines): registro central MUNICIPIOS habilita multi-municipio
- d580e1c fix(pipeline): corrige subextraÃ§Ã£o despesa_orcamentaria_2021 (+22k registros)
- 3eb4e60 chore(manifests): emendas marcadas publicado + redirect /emendas adicionado
- fac7f46 feat(sorocaba): contratos legados 2020-2021 -- licitacoes (1078) + obras (69) + precatorios
- af6018b fix(sobre): email pessoal removido, registros dinamicos, jargao humanizado
- 3ada240 feat(sobre): substituir pÃ¡gina /sobre com conteÃºdo do fundador e feed de aprendizado
- 039ffb9 docs(handoffs): despacho 71%->80% -- urbes, obras, controle-externo, consorcios
- 6c1512d feat(sorocaba): cobertura 39%->71.1% -- 15 datasets, 13 pipelines
<!-- AUTO:activity-end -->
