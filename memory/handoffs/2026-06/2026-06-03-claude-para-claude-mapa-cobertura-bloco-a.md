# Handoff: Mapa de cobertura + Bloco A (Sorocaba 100%)

**De:** Claude Opus (sessão Mapa de cobertura — 2026-06-03)
**Para:** próxima sessão (Bloco A restante / Bloco B)
**Branch:** `claude/tenacity-retry` (commits locais, **não pushados**)

---

## Feito nesta sessão

1. **PNCP 2021 → fonte-ausente** (commit `08315e1`): PNCP não tem 2020-2021 de Sorocaba (ramp Lei 14.133/2021). Evidência em `data/extracted/sorocaba/pncp/diagnosticos/`.
2. **Receita proxy validada** (commit `7758e8d`): cross-extractor com fiscal RREO bate ao centavo 2020-2025; 6 linhas qa.csv retroativo→validated; 2 linhas manifesto → publicado_parcial.
3. **Gerador read-only** (commit `9ae933d`, sessão irmã Catão-aprovada): `gerar_sorocaba_100_auditavel.py` não é mais destrutivo. **NUNCA usar `--regenerate-scratch` para rotina** (descarta texto curado, só avisa). Usar `--write` (merge-preserve) ou default (relatório).
4. **Mapa de cobertura + A3** (commit `08cbc1d`): mapa versionado 3 níveis + inventário de 20 pareceres TCE publicado.

## Estado do Sorocaba 100% (manifesto validado = fonte de verdade)

- **Sem-LAI: 25/37 publicado (68%)** — 12 publicado + 13 publicado_parcial.
- **Falta sem-LAI: 12** (9 parcial + 3 coletado_pendente_validacao).
- LAI: 18 · Ausência comprovada: 2 (PNCP 2020-21, LOA 2020-21).
- Mapa: `docs/mapa-cobertura-sorocaba-2026-06-03.md` + `data/manifests/sorocaba/mapa_cobertura.csv`.

## Bloco A — restante (próximo passo concreto)

- **A1 AUDESP** (`coletado_pendente_validacao`): `resumo_coleta_tce_sorocaba.json` é **log de coleta**, não dataset. ⚠️ As "contas anuais" do TCE estão **bugadas** (apontam contas estaduais/Governador — ver blocker conhecido). Próximo: identificar download público real por ente municipal antes de tratar como cobertura. **Não publicar o que existe hoje.**
- **A2 SAAE licitações/contratos/obras** (`parcial`): extracted são **tabelas raw** (`saae/tdaportal/.../tabela_00..27`), precisam estruturação. Classificação atual = `gap, nao_exibir_ate_promocao`. **Exige autorização cautelosa explícita do usuário** antes de publicar (contratos podem ter dados sensíveis). Próximo: estruturar tabelas → QA → pedir autorização.

## Bloco B (recoleta) e pendências

- Urbes relação mensal despesas + remuneração transporte: **raw sumiu** → recoleta Playwright (`baixar_urbes_playwright.py`) antes de OCR/QA.
- Despesa registro analítico 2021-2023; SIOPS saúde; LOA programas/ações; Câmara contratos+projetos de lei.

## Tarefas que o usuário marcou "depois" (não fazer agora)

1. Varrer iniciativas existentes (Base dos Dados, Querido Diário, etc.) para ver se já têm os dados dos 18 LAI antes de pedir manualmente.
2. Investigar se 55/55 cobre toda Sorocaba — o que falta além do inventário conhecido.

## Notas de governança

- Headline antigo "28/37" estava **inflado**; corrigido para 25/37 no STATUS.
- STATUS tem histórico de claims stale (ex.: dizia pareceres publicado quando estava só em extracted). **Tratar manifesto como fonte de verdade, não o STATUS.**
- Catão auditou os commits da sessão: limpo (sem segredos/PII/supply-chain). Liberado para push quando o usuário autorizar.
