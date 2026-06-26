# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Leia tambem `~/Documents/Omega/OMEGA_GOVERNANCE.md`. As regras deste repositorio publico prevalecem quando forem mais restritivas.
Leia tambem `docs/roteamento-codex-claude.md` e `docs/release-ownership.md`.

Voce esta em um repositorio publico.

## Funcao

Este repositorio contem o codigo e a documentacao publica do site Anatomia do Gasto (anatomiadogasto.ong.br). Dados de gastos públicos municipais de Sorocaba e Paulínia (SP).

## Natureza

Publico. Tudo que for commitado aqui deve poder ser publicado.

## Comandos

```bash
# Dependências Python (usar sempre o venv do projeto)
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

# OCR (instalar uma vez no sistema)
sudo apt install tesseract-ocr tesseract-ocr-por poppler-utils
.venv/bin/pip install pytesseract pdf2image Pillow

# Rodar pipeline individual (sempre com o venv)
MUNICIPIO=sorocaba .venv/bin/python3 pipelines/baixar_camara_api.py --listar
MUNICIPIO=paulinia .venv/bin/python3 pipelines/extrator_rreo.py

# Atualizar catálogo de datasets (obrigatório antes de qualquer deploy)
.venv/bin/python3 pipelines/gerar_datasets_json.py

# Score de cobertura
.venv/bin/python3 tools/diagnostico/calc_score.py

# Validação consolidada por área
.venv/bin/python3 tools/agents/validate-area.py --area pipeline
.venv/bin/python3 tools/agents/validate-area.py --area publication

# Frontend (dev)
cd apps/web && npm ci --ignore-scripts && npm run dev

# Deploy produção
# Regra atual: não rodar deploy manual se STATUS.md bloquear.
# Preferir integração GitHub/Vercel; validar com docs/release-ownership.md.
```

**Mini Shai-Hulud ativa:** `npm install`, `npm update`, `npm audit fix`, `npx` sem autorização explícita são PROIBIDOS. Comece pela triagem read-only do `package-lock.json`.

## Arquitetura

### Fluxo de dados

```
data/raw/          ← PDFs e JSONs originais (gitignored; ANATOMIA_RAW_ROOT aponta para cá)
    ↓ baixar_*.py
data/extracted/    ← saída bruta dos extratores
    ↓ extrator_*.py
data/validated/    ← aprovado localmente
    ↓ publicar_dados.py (gate explícito)
data/public/       ← ÚNICA fonte lida pelo site Next.js
    ↓ gerar_datasets_json.py
data/manifests/datasets_status.json + apps/web/lib/datasets_status.json
    ↓ git push → Vercel build
anatomiadogasto.ong.br
```

### Configuração central

`pipelines/paths.py` — toda configuração de paths e municípios:
- `MUNICIPIO` (env var, default `sorocaba`) seleciona o município ativo
- `MUNICIPIOS` dict: ibge, cnpj_prefeitura, sefaz_sp para cada município
- `ANATOMIA_RAW_ROOT` (env var) aponta para o diretório de dados brutos externos (default: `data/raw/`)
- Rodar qualquer pipeline com `MUNICIPIO=paulinia python3 pipelines/...` para alternar município

Municípios registrados:
- `sorocaba`: IBGE 3552205, CNPJ 46634044000174, sefaz_sp 6695
- `paulinia`: IBGE 3536505, CNPJ 45751435000106, sefaz_sp 5137

### Manifestos de cobertura

- `data/manifests/sorocaba/mapa_cobertura.csv` — fonte de verdade do score de Sorocaba
- `data/manifests/paulinia/mapa_cobertura.csv` — fonte de verdade do score de Paulínia
- Status possíveis: `publicado`, `publicado_parcial`, `parcial`, `coletado_pendente_validacao`, `nao_coletado`, `lai_necessario`, `fora_de_escopo`
- `tools/diagnostico/calc_score.py` — score ponderado: executivo 30%, contratos 20%, autarquias 15%, transferencias 15%, camara 10%, controle_externo 10%

### Publicação de datasets

`pipelines/gerar_datasets_json.py` varre `data/public/` e gera dois arquivos em sync:
1. `data/manifests/datasets_status.json` (commitado ao Git)
2. `apps/web/lib/datasets_status.json` (importado pelo Next.js no build)

O endpoint `apps/web/app/api/dados/[...slug]/route.ts` serve CSVs diretamente de `data/public/` (path traversal protegido; headers Cache-Control 86400s).

### Convenção de pipelines

- `baixar_*.py` — download de fonte externa → `data/raw/`
- `extrator_*.py` — parsing/estruturação → `data/extracted/`
- `gerar_*.py` — agregação e publicação → `data/public/`
- `agregar_*.py` — consolidação multi-fonte
- `validar_*.py` / `sanear_*.py` — QA e limpeza
- `publicar_dados.py` — promoção `extracted` → `public` com gate de validação

## Proibicoes absolutas

Nunca commitar:

- senhas, tokens, cookies, chaves privadas, recovery codes, codigos 2FA
- arquivos .env, conteudo de credenciais, prints sensiveis
- memoria operacional privada, prompts internos privados, arquivos pessoais

## Regras de dados

- Dado ausente nao e zero.
- Todo dado publico precisa de fonte.
- Periodo, escopo e metodologia devem ser claros.
- Nao forcar causalidade.
- Nao transformar inferencia em fato.
- Nao usar nomes reais em dados ficticios.
- Mock deve ser explicitamente marcado como ficticio.
- Nao publicar estatistica sem fonte.
- PDFs grandes do acervo bruto ficam fora do repo; use `ANATOMIA_RAW_ROOT=~/data-raw` para apontar o pipeline para esse acervo externo.

## Regras para novas páginas Server Component que leem data/public

Toda página nova que usa `process.cwd()` para ler arquivos de `data/public/` DEVE:

1. Usar `/*turbopackIgnore: true*/` dentro do `path.join()` que envolve `process.cwd()`:
   ```ts
   const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
   ```
2. Ter uma entrada cirúrgica em `outputFileTracingIncludes` no `next.config.ts` com APENAS o subdiretório que essa rota precisa:
   ```ts
   "/municipio/rota": ["data/public/municipio/area/saida/**/*"],
   ```

**Por quê:** Sem `turbopackIgnore`, o Next.js (@vercel/nft) rastreia automaticamente TUDO de `data/public/` (251MB+) para o bundle Lambda. Isso quebra o deploy com "Serverless Function exceeded 250MB". Commit `48add5b` e `P-2026-06-10-001` documentam o incidente.

## Fluxo obrigatorio

Antes de alterar:

```bash
git status -sb
```

Depois de alterar:

```bash
git status -sb
git log --oneline -5
```

Commit local e permitido ao final de um bloco completo e validado, desde que o
diff seja revisado, a proveniencia esteja registrada quando aplicavel e o pacote
nao misture mudancas de outro agente/usuario sem identificacao. Push, deploy,
publicacao em `data/public` e infraestrutura continuam exigindo autorizacao
explicita do usuario. Antes de push/deploy, rodar
`python tools/agents/check-release-readiness.py --stage push|deploy`.

**Assinatura obrigatória em todo commit:** `[Claude Code > claude-sonnet-4-6 > Medium]` (ou modelo/effort correspondente).

## Edicao concorrente (Claude + Codex)

Quando Claude e Codex estiverem ativos ao mesmo tempo:

- Antes de qualquer escrita, verifique `git status -sb` e leia o timestamp dos arquivos alvo.
- Se um arquivo tiver modificacao recente nao commitada e voce nao foi quem fez, pare e informe antes de escrever.
- Nunca faca commit silencioso quando o working tree ja tiver mudancas: descreva o que e seu e o que nao e antes de incluir no pacote.
- Em caso de conflito real, prefira `git stash` ou branch temporaria em vez de sobrescrever.

## Separacao de contexto

Nao trazer para este repositorio conteudo privado, credenciais, registros operacionais internos ou arquivos pessoais.

Antes de trabalhos substantivos, opere em economia de contexto/token: localize fontes com `rg` ou comando seletivo, abra apenas os arquivos e trechos necessarios, evite reler documentacao ja estabilizada e consolide comandos quando isso nao esconder evidencia relevante.

Para iniciar um topico substantivo com contexto minimo, rode:

```bash
python3 tools/agents/start-topic.py "<objetivo>" --rag-limit 3
```

Registre falhas, erros, barreiras e correcoes reutilizaveis em `memory/knowledge/problems.csv` e `memory/knowledge/solutions.csv`, sempre como conteudo publico e sanitizado.

Registre toda alteracao em `memory/provenance/changes.csv` com actor/agente, ferramenta, modelo, ambiente, escopo, paths alterados, resumo, validacao e privacidade.

Ao usar agentes ou subagentes, siga `docs/agentes-contexto.md`: envie apenas objetivo, paths permitidos, proibicoes, validacao esperada e formato curto de resposta.

Para contexto ja documentado, use a memoria publica em `memory/` via `tools/memory/query-rag.py` quando isso reduzir contexto. Handoffs publicos reutilizaveis ficam em `memory/handoffs/YYYY-MM/`.

Ao alterar memoria, agentes, handoffs ou RAG, rode:

```bash
python3 -m compileall -q tools/memory
python3 -m compileall -q tools/agents
python3 tools/agents/validate-area.py --area memory
```

Se o usuario disser "Chame o maestro, preciso completar os dados faltantes agora", acione o fluxo composto `/frontino status -> dados -> pipeline -> qa -> vitruvio? -> deploy?` descrito em `docs/agentes-contexto.md` e `.claude/commands/maestro.md`.

Cada topico deve ter sua propria conversa. Se o usuario mudar de assunto, area ou objetivo, avise para abrir uma nova conversa antes de continuar.

Ao finalizar trabalho substantivo, inclua rodape:
`Fim de trabalho substantivo: sim` | `Handoff recomendado: sim/nao` | `Modelo: adequado/recomendar troca` | `Proveniencia: <id ou local>` | `Economia de contexto: baixa/media/alta`

## Roteamento de IA

| CLI | Função primária neste projeto | Modelo recomendado |
|---|---|---|
| **Claude Code - Coleta e Publicacao** | Fontes oficiais, coleta, cron, pipelines operacionais, Playwright, manifests, metodologia, publicacao e deploy autorizado | sonnet-4-6 / opus-4-8 |
| **Claude Code - UI/UX** | Interface, acessibilidade, linguagem cidada, SEO editorial, visualizacoes e documentos longos | sonnet-4-6 / opus-4-8 |
| **Codex** | Auditor principal de codigo; confiabilidade; bugs; DRY/SOLID; testes; CI; gates e seguranca de implementacao | GPT-5.5 Medium→High |

Antigravity/Gemini nao integra a operacao ativa. Claude absorve temporariamente
suas antigas funcoes de execucao, Playwright e deploy, sempre sob gate humano.

**Regra-chave**: dado ausente != zero. Claude responde por metodologia e
operacao da sua frente; Codex revisa corretude tecnica e cria protecoes contra
regressoes.

## Disciplina de Raciocínio (obrigatória)

Antes de qualquer entrega, seguir `~/Documents/Omega/DISCIPLINA_DE_RACIOCINIO.md` — verificar antes de afirmar (mostrar a prova), portões antes do irreversível (backup→verificar→remover), relatar fiel. Aplica-se também a mudanças no sistema Linux/Pop!_OS (ver seção própria no doc).
