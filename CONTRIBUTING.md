# Como contribuir

Obrigado pelo interesse em contribuir com o Anatomia do Gasto. Este projeto publica dados civicos, entao revisao, fonte e contexto importam tanto quanto codigo.

## Antes de comecar

1. Leia este arquivo e [docs/onboarding-dev.md](docs/onboarding-dev.md).
2. Rode o site localmente em http://localhost:3000.
3. Escolha uma mudanca pequena.
4. Abra PR com validacao local clara.

Todas as interacoes seguem o [Codigo de Conduta](CODE_OF_CONDUCT.md).

## Boas primeiras contribuicoes

Boas tarefas para um primeiro PR:

- Corrigir texto, responsividade ou acessibilidade em uma rota existente.
- Melhorar estado vazio, legenda, tooltip ou tabela ja publicada.
- Adicionar teste ou validacao local para um script existente.
- Documentar uma fonte oficial ja inventariada.
- Corrigir mojibake em documentacao ou interface, sem alterar dados.

Evite como primeiro PR:

- Mover dados entre `data/extracted`, `data/validated` e `data/public`.
- Alterar deploy, rotas publicas principais ou pipeline de publicacao.
- Criar rankings, acusacoes ou conclusoes sobre agentes publicos.
- Adicionar dependencias sem justificativa tecnica.

## Fluxo de trabalho

1. Faca fork do repositorio.
2. Clone seu fork.
3. Crie uma branch descritiva, por exemplo `fix/texto-sorocaba` ou `docs/onboarding`.
4. Rode a aplicacao localmente.
5. Faca uma mudanca pequena.
6. Rode validacao local.
7. Abra pull request para `main`.

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

## Validacao esperada

Para frontend:

```powershell
cd apps\web
npm.cmd run lint
npm.cmd run build
```

Para escopo, publicacao e dados:

```powershell
python tools\agents\validate-area.py --area scope
python tools\agents\validate-area.py --area publication
```

Para governanca, memoria ou agentes:

```powershell
python tools\agents\validate-area.py --area memory
python tools\agents\validate-area.py --area agents
```

Inclua no PR os comandos executados e o resultado relevante.

## Regras de dados

- O site le somente `data/public`.
- `data/extracted` nao e publicacao.
- `data/validated` so vira publicacao depois de validacao local e copia explicita para `data/public`.
- Toda fonte deve ter URL, orgao, periodo, data de acesso e limitacoes.
- Dados com pessoa, contrato, orgao ou gasto publico devem ser descritos de forma factual.
- Nao inclua secrets, cookies, tokens, arquivos privados ou dados pessoais sensiveis.

## Estilo

- Commits em portugues, com prefixos como `feat:`, `fix:`, `docs:`, `chore:` ou `refactor:`.
- PRs pequenos e revisaveis.
- Markdown simples, com links relativos quando possivel.
- Python seguindo o estilo local do repositorio.
- TypeScript/React seguindo os componentes existentes em `apps/web`.

## Pull requests

No PR, informe:

- Resumo da mudanca.
- Escopo afetado.
- Comandos de validacao executados.
- Fonte oficial, periodo e limitacoes, quando houver dados.
- Risco conhecido ou ponto que precisa de revisao.

Mudancas com dados, benchmark, agentes ou governanca devem seguir [docs/revisao-pares-github.md](docs/revisao-pares-github.md) quando aplicavel.

## Duvidas

Abra uma issue em https://github.com/sallumc2018/anatomia-do-gasto/issues usando o template mais proximo.
