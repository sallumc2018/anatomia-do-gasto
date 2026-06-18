# Handoff Claude → Codex/Opus — Paulínia: TCE-SP destravado (2026-05-31)

Sessão Opus. **Ambiente desta sessão corrompeu outputs de ferramentas** (Read devolvendo
artefatos falsos; bash sandbox e até curl reportando tamanhos trocados + mensagens
`environment output corrupted`). Por isso: **descoberta verificada, sem harvest em massa**
(colher ~144 arquivos sem poder validar tamanho/conteúdo violaria o padrão "todo número confere
com a fonte"). Nada commitado. O harvest deve rodar numa **sessão estável**.

## 🎯 DESCOBERTA DECISIVA — TCE-SP transparência API funciona para Paulínia

Confirmado por chamadas curl repetidas e consistentes (1.318.069 B estável p/ despesas 2024/1):

- **Endpoint**: `https://transparencia.tce.sp.gov.br/api/json/{dataset}/{slug}/{ano}/{mes}`
  - `dataset` ∈ {`despesas`, `receitas`}
- **Slug canônico de Paulínia = `paulinia`** — confirmado na API oficial de municípios
  (`/api/json/municipios` → `{"nome":"Paulínia","url":"paulinia"}`).
- **despesas/paulinia/2024/1** → HTTP 200, ~1,3 MB JSON real (órgãos incl. `PAULINIA PREVI`,
  campos `orgao, mes, ds_fonte_recurso, ds_cd_aplicacao_fixo, ...`).
- **receitas/paulinia/2024/1** → HTTP 200, ~36 KB.
- ⭐ **Isso dispensa CNPJ, portal com WAF e Playwright** — é o MAIOR reuso da toolchain de Sorocaba.
  É a mesma API que `pipelines/baixar_tce_sorocaba.py` já consome (linha 475).

## ✅ EXECUTADO nesta sessão — TCE-SP de Paulínia coletado

`pipelines/baixar_tce_sorocaba.py` **parametrizado p/ multi-município** (mesmo padrão `paths.CFG`
dos outros 17 pipelines; sem fork, sem renomear o arquivo):
- import passou a `from paths import CFG, EXTRACTED_DIR, MUNICIPIO, RAW_DIR`; `MUNICIPIO_NOME = CFG["nome"]`;
- helper `_sem_acentos()` p/ comparar "Paulínia"(CSV nacional, com acento) vs "Paulinia"(CFG);
- todos os nomes de saída e o filtro de links usam `{MUNICIPIO}`/`MUNICIPIO_NOME`;
- `COMUNICADOS_SDG_2025` agora é filtrado por município (Sorocaba mantém seus 4; outros → vazio);
- docstring/USER_AGENT atualizados. **Compila OK; Sorocaba não quebra** (CFG default = sorocaba).

Rodado: `MUNICIPIO=paulinia python pipelines\baixar_tce_sorocaba.py --amostra-transparencia`
com 6 anos × 12 meses. **Resultado (verificado em `resumo_coleta_tce_paulinia.json`):**
- API transparência: **144/144 consultas OK, 0 bloqueios**;
- **despesa 364.803 reg. + receita 8.202 reg.** (2020-2025);
- alertas LRF: **16** (15 prefeitura + 1 câmara, exerc. 2019);
- **318 PDFs de contas anuais inventariados (2002-2024)** — inclui 2020 (contas rejeitadas, gancho);
- raw 107 MB em `G:\...\raw\paulinia\tce\2026-05-31\`; recortes em `data/extracted/paulinia/tce/`.

⚠️ Diagnóstico do linter (não-bloqueante, pré-existente): `coletar_amostra_transparencia`
complexidade cognitiva 28>15 — herdado de Sorocaba, não introduzido aqui.

**Não commitado** (branch do Codex ativo). Sugiro o Codex commitar a parametrização do TCE com
prefixo `[Claude]` quando consolidar o branch.

## Demais fontes (sessão estável + Playwright)

- **`sefaz_sp`** (paths.py None p/ Paulínia): código do município no `fazenda.sp.gov.br`
  (Repasse de Receitas aos Municípios, cota-parte ICMS/IPVA) → destrava
  `baixar_transferencias_estaduais_sp.py`. (Sorocaba = "6695".)
- **CNPJ prefeitura** (paths.py None): candidato `46.392.130/0001-18` é **INVÁLIDO** (BrasilAPI 404).
  Obter via Playwright no rodapé do portal/PNCP → destrava PNCP `/api/search/?q=<CNPJ>&...`.
- **Portais próprios**: `transparencia.paulinia.sp.gov.br` e Câmara (SMARAPD
  `transparencia-cmpaulinia.smarapd.com.br`) — atrás de Imperva Incapsula (GET=200/0B) → `/playwright`.
- **Contas anuais TCE** (parecer das **contas 2020 rejeitadas** — gancho editorial): o
  `baixar_tce_sorocaba.py` já inventaria PDFs de contas anuais; sai junto na parametrização.

## ⚠️ Estado do repo (não mexer)

Branch `codex/institutional-audit-data-catalog`, mudanças NÃO commitadas do Codex
(`pipelines/gerar_pncp_publicacao.py`, 3 pages `apps/web/...`, README, `.claude/settings.json`).
Não commitei nada para não atropelar o Codex.

## SICONFI (já feito, contexto)

88 CSVs em `data/extracted/paulinia/` (junction → G:\Omega-data), por tema. Pop. FPM 118.836;
dados desde 2013. Achado: **pessoal 2020 = 59,5% da RCL** (acima do teto LRF de 54%) — provável
causa da rejeição das contas 2020.
