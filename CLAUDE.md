# CLAUDE.md

> ⚠️ **LEIA `CONSTITUICAO.md` ANTES DE QUALQUER AÇÃO.**
> Este arquivo contém APENAS instruções específicas do Claude Code.
> Todas as regras compartilhadas (roteamento, commit, proveniência, economia de
> contexto, footer, escopo proibido, flows, isolamento, assinatura) estão em
> **`CONSTITUICAO.md`** — leia-o agora.
>
> Leia também: `docs/roteamento-codex-claude.md` · `docs/release-ownership.md` · `docs/agentes-contexto.md`

---

## Função

Este repositório contém o código e a documentação pública do site
**Anatomia do Gasto** (anatomiadogasto.ong.br). Dados de gastos públicos
municipais de Sorocaba e Paulínia (SP).

**Natureza:** 🟢 PÚBLICO. Tudo que for commitado aqui deve poder ser publicado.

---

## Comandos Práticos

```bash
# Dependências Python (sempre com .venv)
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

# OCR (instalar uma vez no sistema)
sudo apt install tesseract-ocr tesseract-ocr-por poppler-utils
.venv/bin/pip install pytesseract pdf2image Pillow

# Pipeline individual
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

# Deploy produção — validar STATUS.md primeiro. Preferir integração GitHub/Vercel.
```

---

## Arquitetura

### Configuração central

`pipelines/paths.py` — toda configuração de paths e municípios:
- `MUNICIPIO` (env var, default `sorocaba`) seleciona o município ativo
- `MUNICIPIOS` dict: ibge, cnpj_prefeitura, sefaz_sp para cada município
- `ANATOMIA_RAW_ROOT` (env var) aponta para dados brutos externos (default: `data/raw/`)

### Manifestos de cobertura

- `data/manifests/sorocaba/mapa_cobertura.csv` — score de Sorocaba
- `data/manifests/paulinia/mapa_cobertura.csv` — score de Paulínia
- Status possíveis: `publicado`, `publicado_parcial`, `parcial`, `coletado_pendente_validacao`, `nao_coletado`, `lai_necessario`, `fora_de_escopo`
- Score ponderado: executivo 30%, contratos 20%, autarquias 15%, transferências 15%, câmara 10%, controle_externo 10%

### Publicação de datasets

`pipelines/gerar_datasets_json.py` varre `data/public/` e gera dois arquivos em sync:
1. `data/manifests/datasets_status.json` (commitado)
2. `apps/web/lib/datasets_status.json` (importado pelo Next.js no build)

### Convenção de pipelines

- `baixar_*.py` — download de fonte externa → `data/raw/`
- `extrator_*.py` — parsing/estruturação → `data/extracted/`
- `gerar_*.py` — agregação e publicação → `data/public/`
- `agregar_*.py` — consolidação multi-fonte
- `validar_*.py` / `sanear_*.py` — QA e limpeza
- `publicar_dados.py` — promoção `extracted` → `public` com gate de validação

### Nomenclatura de municípios

Os 5.571 diretórios do Sprint2 em `data/public/` usam **snake_case** (nome IBGE).
Rotas do site usam **hífen** (`/sao-paulo`), dados usam underscore (`sao_paulo`) —
convenção intencional (slug de URL vs chave de dado). Única exceção real:
**São Bernardo do Campo** tem `sao_bernardo_do_campo` (coleta bruta Sprint2) que
alimenta `sao_bernardo` (curado, usado pela página `/sao-bernardo`).

### Regra turbopackIgnore

Toda página nova que usa `process.cwd()` para ler arquivos de `data/public/`
**DEVE**:

1. Usar `/*turbopackIgnore: true*/` dentro do `path.join()`:
   ```ts
   const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
   ```
2. Ter entrada cirúrgica em `outputFileTracingIncludes` no `next.config.ts`:
   ```ts
   "/municipio/rota": ["data/public/municipio/area/saida/**/*"],
   ```

**Por quê:** Sem isso, o Next.js rastreia TUDO de `data/public/` (251MB+) e o
deploy quebra com "Serverless Function exceeded 250MB".

---

## Edição Concorrente (Claude + Codex)

Quando Claude e Codex estiverem ativos ao mesmo tempo:

1. Antes de qualquer escrita, verifique `git status -sb` e leia o timestamp dos arquivos alvo
2. Se um arquivo tiver modificação recente não commitada e você não foi quem fez, **pare e informe** antes de escrever
3. Nunca faça commit silencioso quando o working tree já tiver mudanças — descreva o que é seu e o que não é
4. Em caso de conflito real, prefira `git stash` ou branch temporária em vez de sobrescrever

---

## Início de Trabalho Substantivo

```bash
python3 tools/agents/start-topic.py "<objetivo>" --rag-limit 3
```

---

## Disciplina de Raciocínio (obrigatória)

Antes de qualquer entrega, seguir `~/ENGINEERING.md` — verificar antes de afirmar
(mostrar a prova), portões antes do irreversível (backup→verificar→remover),
relatar fiel. Aplica-se também a mudanças no sistema Linux/Pop!_OS (ver seção
própria no doc).

---

## Assinatura de Commit

`[Claude-CP > <modelo> > <effort>]` para Coleta e Publicação
`[Claude-UI > <modelo> > <effort>]` para UI/UX

Ver padrão oficial em `CONSTITUICAO.md §21`.
