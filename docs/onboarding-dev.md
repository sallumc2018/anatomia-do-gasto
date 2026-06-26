# Onboarding dev

Este guia e para uma primeira contribuicao tecnica no Anatomia do Gasto.

## Objetivo do primeiro PR

O primeiro PR deve provar que o ambiente local roda e que a mudanca e revisavel. Prefira:

- documentacao;
- ajuste pequeno de interface;
- correcao de texto;
- melhoria de acessibilidade;
- teste ou validacao local de baixo risco.

Nao comece por publicacao de dados, deploy, ranking, pipeline amplo ou migracao de estrutura.

## Setup

Clone:

```bash
git clone https://github.com/sallumc2018/anatomia-do-gasto.git
cd anatomia-do-gasto
```

Python:

```bash
python -m venv .venv
python -m pip install -r requirements.txt
```

Frontend:

```bash
cd apps/web
npm ci --ignore-scripts
npm run dev
```

Abra http://localhost:3000.

No Windows PowerShell, prefira `npm.cmd`:

```powershell
cd apps\web
npm.cmd ci --ignore-scripts
npm.cmd run dev
```

## Arquivos importantes

- `README.md`: visao geral publica.
- `CONTRIBUTING.md`: regras de contribuicao.
- `CANONICAL_PATHS.md`: mapa oficial de arquivos, dados, memoria e codigo.
- `STATUS.md`: estado atual do projeto.
- `TASKS.md`: fila de trabalho.
- `IDEAS.md`: propostas ainda nao aprovadas.
- `DECISIONS.md`: decisoes tecnicas e metodologicas.
- `docs/politica-publicacao-dados.md`: regra de publicacao de dados.
- `.github/PULL_REQUEST_TEMPLATE.md`: formato esperado do PR.

## Dados

Camadas de dados:

- `data/raw`: fontes brutas.
- `data/extracted`: extracao operacional, nao publicada.
- `data/validated`: dado validado localmente, ainda nao publicado automaticamente.
- `data/public`: unica camada lida pelo site.
- `data/manifests`: inventarios, status e QA.

Regra principal: nao mova dados para `data/public` sem validacao local e aprovacao do mantenedor.

## Validacao

Frontend:

```bash
cd apps/web
npm run lint
npm run build
```

Gates de escopo e publicacao:

```bash
python tools/agents/validate-area.py --area scope
python tools/agents/validate-area.py --area publication
```

Se a mudanca tocar memoria, agentes ou governanca:

```bash
python tools/agents/validate-area.py --area memory
python tools/agents/validate-area.py --area agents
```

## Como escolher uma tarefa

Uma boa tarefa tem:

- arquivo ou rota provavel;
- criterio de aceite objetivo;
- validacao local simples;
- baixo risco de publicar informacao incorreta.

Exemplos:

- Corrigir mojibake em texto de documentacao.
- Melhorar legenda de grafico ja existente.
- Adicionar estado vazio para uma tabela.
- Escrever uma nota metodologica curta para fonte ja inventariada.
- Criar teste de leitura para manifest existente.

## Como abrir PR

Inclua:

- o que mudou;
- por que mudou;
- como validar;
- prints ou logs quando forem uteis;
- limitacoes conhecidas.

Se o PR alterar dados, informe fonte oficial, periodo, escopo e camada afetada.
