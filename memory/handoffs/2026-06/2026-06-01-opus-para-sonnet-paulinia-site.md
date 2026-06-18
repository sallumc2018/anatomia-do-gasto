# Handoff Opus → Sonnet — Paulínia: camada de SITE (2026-06-01)

**Para:** próxima sessão Sonnet. **Objetivo:** levar Paulínia ao ar no site, reusando Sorocaba.
Os **dados já estão publicados e validados** — esta leva é frontend/execução, com revisão Opus antes do deploy.

## ✅ Pré-requisito pronto (não refazer)
- **`data/public/paulinia/` com 89 CSVs validados** (commit `90290f5`, prefixo `[Claude]`).
  receita 6 · executivo 6 · fiscal 42 · seguranca 6 · transporte 12 · transf_federais 5 · transf_estaduais 6 · fns 6.
- `data/manifests/paulinia/qa.csv` (89 validated) + 15 datasets em `data/manifests/datasets.csv`.
- QA Opus: TCE×SICONFI bate (5/6 anos ao centavo; 2022 diverge 0,4%, SICONFI é o oficial).
- `paths.py`: ibge=3536505, sefaz_sp=5137, cnpj_prefeitura=45751435000106.

## 🎁 Boa notícia: o loader já é multi-município
`apps/web/lib/data.ts` (linha ~76) tem `getDataDirs(municipio)` e funções com
`municipio = "sorocaba"` como **default parametrizável** — leem de `data/public/<municipio>/<area>/saida`.
Passar `"paulinia"` já resolve a leitura. **Não reescrever o loader**; conferir cobertura de áreas
(saude/educacao podem não existir p/ Paulínia — tratar ausência graciosamente).

## Tarefas (execução Sonnet)

### 1. Página `/paulinia`
- Espelhar a estrutura de `apps/web/app/sorocaba/` (~22 sub-rotas) para `apps/web/app/paulinia/`.
- Começar pelas áreas que TÊM dado público: receita, executivo, fiscal (RCL/pessoal/dívida/RPPS),
  seguranca, transporte, transferencias (federais+estaduais), fns/saúde-fiscal.
- **NÃO criar** páginas para áreas sem dado público de Paulínia (autarquias URBES/SAAE, câmara,
  contratos/PNCP, controle-externo) — não há equivalente publicado.
- ⚠️ **OBRIGATÓRIO — nota metodológica de 2022** onde exibir total de despesa: o somatório do TCE
  granular é ~0,4% maior que o RREO/SICONFI (que é o número oficial exibido). Regra em DECISIONS.md.

### 2. `gerar_datasets_json.py` (hoje hardcoded sorocaba)
- `PUBLIC_DIR` (linha 31) e o `CATALOGO` são fixos em sorocaba. Parametrizar por `MUNICIPIO` (env)
  ou criar catálogo de Paulínia, e gerar `datasets_status.json` da página de lacunas de Paulínia.

### 3. Hierarquia nacional + navegação
- `/mapa-interativo`: agora há 2 municípios publicados → ativar Brasil→SP→{Sorocaba,Paulínia}
  (DECISIONS prevê isso "quando >1 município live"). Avaliar migração de URLs planas p/ `/uf/municipio`
  (decisão registrada; pode ficar para depois, não bloquear o lançamento de /paulinia).
- Adicionar Paulínia ao seletor de município do `/fluxo-financeiro` (hoje "em breve").

### 4. Validar build local (NÃO `npm install` — worm ativo)
- `cd apps/web && npm run build` (ou lint) antes de qualquer deploy. Sem instalar pacotes.

## Limites (portão Opus — NÃO fazer)
- **NÃO deployar** (Vercel) — revisão Opus do site antes do ar. Deploy é `vercel deploy --prod --yes` (Opus).
- **NÃO publicar PNCP/TCE granular** nem promover novos CSVs — política definida; é com cautela/curadoria.
- **NÃO escrever o texto editorial das contas 2020** — é Plínio/Opus (julgamento + voz pública).
- Commits com prefixo `[Claude]`. Branch atual: `codex/institutional-audit-data-catalog`.

## Ao terminar → handoff de volta p/ Opus
Listar páginas criadas + resultado do `npm run build`. Opus revisa o site, escreve o texto das
contas 2020 (Plínio), e faz o deploy.

## Referências
- `STATUS.md` (seção "Paulínia PROMOVIDA"), `DECISIONS.md` (TCE×SICONFI + nota 2022).
- Memórias: `project_paulinia_coleta_completa`, `reference_tce_sp_transparencia_api`, `feedback_model_economy_split`.
- Página-modelo: `apps/web/app/sorocaba/*`; loader: `apps/web/lib/data.ts`.
