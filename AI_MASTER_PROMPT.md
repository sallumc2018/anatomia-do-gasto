# AI Master Prompt

## 1. Objetivo Do Projeto

O Anatomia do Gasto expõe, de forma clara e legível para o cidadão comum, como o dinheiro público entra no governo e para onde ele vai depois, começando por Saúde e Educação em Sorocaba/SP e expandindo município por município até cobrir o Brasil.

## 2. Ecossistema De Trabalho

| Ambiente | Papel | Path |
|---|---|---|
| WSL/Linux | Desenvolvimento principal — Python, Node, Codex, RTK, Claude Code CLI | `/mnt/c/Omega/02_Repos/anatomia-do-gasto` |
| Windows | Operações — ADB/tablet, GUI, VS Code, Claude Code extensão | `C:\Omega\02_Repos\anatomia-do-gasto` |
| GitHub | Fonte da verdade entre todos os ambientes | `sallumc2018/anatomia-do-gasto` |
| Vercel | Deploy automático a partir do push em `main` | Root Directory `apps/web` |
| Tablet Android | Terminal portátil — leitura de docs e dados públicos | `/sdcard/AnatomiaDrive` via ADB |

- App web: `apps/web`.
- Pipeline Python: `pipelines`.
- Infraestrutura local Windows: `C:\infra\` (ADB, drivers USB, logs de tablet).
- Sincronização WSL: `tools/dev/sync-wsl-mirror.ps1`.
- Dados:
  - `data/raw`: fontes brutas.
  - `data/extracted`: extrações automáticas, não publicadas.
  - `data/validated`: dados aprovados localmente.
  - `data/public`: única fonte de dados do site.
  - `data/manifests`: inventário e status dos datasets.
- RTK: ferramenta local de economia de contexto/token. Instalar em `~/bin/rtk` (WSL) e `C:\ferramentas\rtk\rtk.exe` (Windows). Binários e caches não são versionados.

## 3. Regras Permanentes

1. O site oficial só pode ler `data/public`.
2. CSV em `data/extracted` não é dado publicado.
3. CSV em `data/validated` só vira publicação depois de cópia explícita para `data/public`.
4. Alterações estruturais exigem atualização da documentação relacionada.
5. Antes de commit/push/deploy, rodar as validações mínimas aplicáveis.
6. Não versionar `node_modules`, `.next`, `.venv`, `venv`, `.env.local`, caches ou binários RTK.
7. Preferir mudanças pequenas, rastreáveis e com justificativa objetiva.
8. Não duplicar contexto já documentado; referenciar `README.md`, `docs/arquitetura.md`, `docs/pipeline.md`, `docs/ambiente.md` e `docs/estrategia.md`.
9. Nenhum agente faz commit, push ou deploy sem autorização explícita do usuário.
10. Claude Code e Codex podem estar trabalhando em paralelo. Todo agente deve verificar o estado atual do repositório antes de editar arquivos.
11. Claude Code deve operar em modo de economia de contexto/token por padrão: ler apenas os arquivos e trechos mínimos necessários, localizar símbolos e seções antes de abrir arquivos longos, preferir resumos e diffs curtos, evitar reler contexto já estabilizado e usar RTK quando isso reduzir contexto sem perder rastreabilidade. Economia de token não substitui rigor: em caso de ambiguidade metodológica, risco institucional ou divergência de fonte, a leitura e a validação devem ser ampliadas.
12. Quando o usuário pedir o quanto foi economizado, Claude Code deve responder com **estimativa auditável**, nunca número inventado: arquivos evitados, trechos não relidos, comandos consolidados e redução aproximada de contexto em termos percentuais ou qualitativos.

## 4. Validação Mínima

**Python — Windows:**
```powershell
.\.venv\Scripts\python.exe -m py_compile pipelines\paths.py pipelines\pipeline.py pipelines\publicar_dados.py
.\.venv\Scripts\python.exe pipelines\testes\verificar_publicacao.py
```

**Python — WSL/Linux:**
```bash
./.venv/bin/python -m py_compile pipelines/paths.py pipelines/pipeline.py pipelines/publicar_dados.py
./.venv/bin/python pipelines/testes/verificar_publicacao.py
```

**Frontend — Windows:**
```powershell
cd apps\web
npm.cmd --script-shell cmd.exe run lint
npm.cmd --script-shell cmd.exe run build
```

**Frontend — WSL/Linux:**
```bash
cd apps/web
npm run lint
npm run build
```

## 5. Política De Commit

Não commitar automaticamente. Commitar somente depois de:

- validar localmente;
- revisar o diff;
- confirmar que dados não validados não entraram em `data/public`;
- usar mensagem no formato:

```text
[Ferramenta] descrição curta
```

Exemplos: `[Codex] reorganiza camadas de dados` · `[Claude] ajusta textos da metodologia`

## 6. Sincronia Entre Ambientes

A fonte da verdade é o GitHub. Antes de deploy:

1. Validar localmente.
2. Validar no WSL quando a mudança afetar build, scripts ou caminhos.
3. Commit → push → conferir build na Vercel → conferir o site.

## 7. Estado Atual Dos Dados

- Saúde: 2020–2025 em `data/public`.
- Educação: 2020–2025 em `data/public`, validada contra PDFs oficiais; 2020–2023 também em `data/extracted` como saída mecânica.
- Auditoria: dados mock sinalizados no site como fictícios. Não publicar dados reais sem revisão explícita.

## 8. Arquitetura De Agentes

O projeto usa um conjunto de agentes especializados coordenados por um orquestrador.

### Orquestrador

Analisa a intenção do pedido e roteia para o subagente mais adequado. Monta o contexto mínimo necessário — nunca repassa secrets, dados não publicados ou conteúdo de PDFs brutos.

### Subagentes

| Agente | Ferramenta | Ambiente | Responsabilidade |
|---|---|---|---|
| `dados` | Claude Code | WSL / Windows | Verifica e baixa novos PDFs do portal |
| `pipeline` | Claude Code | WSL (primário) | Processa PDFs em CSV/JSON |
| `analista` | Claude Code | WSL / Windows | Analisa despesas com linguagem cidadã |
| `frontend` | Claude Code | WSL (primário) | Desenvolvimento e validação do app web |
| `deploy` | Claude Code | WSL / Windows | Build e publicação na Vercel |
| `tablet` | Claude Code | Windows (ADB) | Sincroniza e monitora o tablet Android |
| `engenheiro` | Codex | WSL | Refatorações grandes, migrações de estrutura |

### Critério De Roteamento

- **WSL**: tarefas de código, pipeline, frontend, Codex — ambiente primário de desenvolvimento.
- **Windows**: operações com tablet (ADB), GUI, tarefas que exigem drivers locais.
- **Codex**: tarefas autônomas em WSL, refatorações em massa, geração de código estrutural.

## 9. Resposta Esperada Das IAs

- Ser conciso.
- Explicar decisões técnicas quando houver tradeoff.
- Indicar arquivos afetados em mudanças estruturais.
- Não afirmar que algo foi validado sem ter rodado a validação.
- Se houver lacuna de ambiente, registrar claramente.
- Nunca agir fora do escopo autorizado pelo usuário.
- Em Claude Code, minimizar consumo de contexto por padrão e, quando solicitado, relatar a economia obtida de forma estimada e verificável.
