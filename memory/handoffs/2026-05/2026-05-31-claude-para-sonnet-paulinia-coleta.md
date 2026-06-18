# Handoff Claude(Opus) → Sonnet — Paulínia: fase de COLETA (2026-05-31)

**Para:** próxima sessão Sonnet. **Objetivo:** terminar a coleta de Paulínia (IBGE 3536505,
slug TCE `paulinia`) reusando a toolchain de Sorocaba. Tudo abaixo grava em `data/raw`/`data/extracted`
(gitignored, junction → G:) — **é coleta, não publicação**, portanto escopo Sonnet pela regra do portão.

## ⚠️ Antes de começar
- **Ambiente oscilou na sessão anterior** (ferramentas devolvendo saída corrompida). Se notar
  saída inconsistente, **reinicie a sessão antes de rodar Playwright**.
- **NÃO commitar / NÃO promover a `data/public`.** Branch `codex/institutional-audit-data-catalog`
  está com mudanças não commitadas do Codex. Deixe commits para o Codex (prefixo `[Claude]`).
- **NÃO rodar `npm install/update/audit`** (worm ativo).
- Python: usar `python` (3.12) ou `py`. Pipelines leem o município de `env MUNICIPIO`.

## Já feito (não repetir)
- SICONFI: 89 CSVs em `data/extracted/paulinia/` (por tema).
- **TCE-SP: COMPLETO** — `baixar_tce_sorocaba.py` já é multi-município; despesa/receita 2020-2025
  (372k reg.), alertas LRF, 318 PDFs de contas anuais inventariados. Em `data/extracted/paulinia/tce/`.
- **PASSO 1 (sefaz_sp + transferências estaduais): COMPLETO** (2026-05-31, Opus).
  `paths.py` → `"sefaz_sp": "5137"` (validado: Sorocaba=6695 confere na mesma lista do portal).
  Coletado `transferencias_estaduais_sp_paulinia_2020..2026` (85 linhas; ICMS 2024 = R$1,51 bi).
  Em `data/extracted/paulinia/transferencias_estaduais/saida/`. **Comece no PASSO 2.**

## Sequência de coleta (ordem importa — há dependências)

### Passo 1 — `sefaz_sp` ✅ CONCLUÍDO (2026-05-31, Opus)
Paulínia = `5137` (descoberto nas `<option>` do `ddlMuni` em
`fazenda.sp.gov.br/RepasseConsulta/Consulta/repasse.aspx`; validado por Sorocaba=6695 na mesma lista).
Já gravado em `paths.py` e já coletado (ver "Já feito"). Nada a fazer aqui.

### Passo 2 — CNPJ da prefeitura (destrava PNCP)
- ⚠️ Candidato `46.392.130/0001-18` é **INVÁLIDO** (BrasilAPI 404). NÃO usar.
- Obter via Playwright no rodapé de `transparencia.paulinia.sp.gov.br` ou `www.paulinia.sp.gov.br`
  (ambos atrás de Imperva Incapsula → precisa de browser headless; GET puro devolve 200/0B).
  Alternativa: buscar o órgão "Município de Paulínia" no próprio PNCP e ler `orgao_cnpj`.
- **Validar** o CNPJ encontrado: `https://brasilapi.com.br/api/cnpj/v1/<14digitos>` deve retornar
  razão social compatível (Prefeitura/Município de Paulínia). Só então confiar.
- Ao confirmar: editar `pipelines/paths.py` linha 11 → `"cnpj_prefeitura": "<14digitos>"`.

### Passo 3 — PNCP (depende do CNPJ do passo 2)
⚠️ **Parametrização pendente:** `pipelines/baixar_pncp_playwright.py` linha 49 tem
`CNPJ = "46634044000174"` (Sorocaba) **hardcoded** — ainda não lê de `paths.CFG`.
- Parametrizar (mesmo padrão dos outros): trocar por
  `from paths import CFG, EXTRACTED_DIR` e `CNPJ = CFG["cnpj_prefeitura"]` (com guard se None,
  como em `baixar_transferencias_estaduais_sp.py` linhas 32-36).
- Rodar: `MUNICIPIO=paulinia python pipelines\baixar_pncp_playwright.py` (ver `--help` p/ tipos/anos).
  - Workaround já embutido: usa `/api/search/?...&status=todos&q=<CNPJ>` (o `/api/consulta/v1/` dá 403).
  - Saída: `data/extracted/paulinia/pncp/saida/`.

### Passo 4 — Portais próprios (Playwright)
- **Prefeitura**: `transparencia.paulinia.sp.gov.br` (SPA + Imperva Incapsula). Inventariar
  endpoints de despesa/receita; extrair p/ `data/extracted/paulinia/`. (Referência de padrão:
  `baixar_camara_playwright.py`, `baixar_saae_playwright.py`.)
- **Câmara**: portal SMARAPD `transparencia-cmpaulinia.smarapd.com.br/#/`.
- ⚠️ Autarquias de Sorocaba (URBES/SAAE/FUNSERV/CEPA) **não se aplicam** a Paulínia.

## Ao terminar a coleta → handoff de volta p/ Opus (portão de publicação)
NÃO promover a public você mesmo. Deixe para o Opus:
- QA cruzado e decisão de promoção a `data/public/paulinia`;
- interpretação editorial das **contas 2020 rejeitadas** + alertas LRF (texto público / Plínio);
- reconciliação de manifesto (`paulinia_100_auditavel.csv`).

## Referências
- `docs/roadmap-paulinia.md`, `STATUS.md` (atualizados 2026-05-31).
- Memórias: `reference_tce_sp_transparencia_api`, `reference_pncp_api_workaround`,
  `feedback_model_economy_split`, `project_known_blockers`.
- Slugs/códigos: TCE slug `paulinia`; IBGE `3536505`; pop. FPM 118.836 / Censo 2022 112.003.
