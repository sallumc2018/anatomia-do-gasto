# Handoff Opus → Sonnet — Paulínia: coletar parecer das CONTAS MUNICIPAIS 2020 (2026-06-01)

**Para:** próxima sessão Sonnet (coleta/Playwright). **Objetivo:** obter o documento real do
julgamento das contas MUNICIPAIS de Paulínia 2020 no TCE-SP, que hoje **não existe no acervo**.
Sem ele, o Opus não pode escrever o texto editorial (Protocolo Sallum: sem documento, sem narrativa).

## Por que esta tarefa existe (achado do Opus 2026-06-01)
- O `inventario_pdfs_contas_anuais.csv` de Paulínia (318 PDFs) é **100% CONTAS DO GOVERNADOR (estado SP)**
  — 0 menções a Paulínia, 333 a "Governador". Processo TC-005866.989.20 (Dimas Ramalho, Tribunal Pleno).
- **Causa (bug de escopo):** `pipelines/baixar_tce_sorocaba.py` linha 142 aponta para
  `{TCE_HOST}/contas-anuais` — página **fixa e estadual**, sem filtro por município
  (`inventariar_contas_anuais`, linha 432). Para QUALQUER município ele traz os PDFs do Governador.
  Isso afeta Sorocaba também (o inventário "contas anuais" de Sorocaba é igualmente estadual).
- A premissa "contas 2020 de Paulínia rejeitadas" veio do briefing do usuário; **ainda não confirmada
  por documento**. Confirmar/refutar é parte da tarefa.

## ⚠️ Correção factual já aplicada (não reintroduzir)
A tese "pessoal 2020 = 59,5% da RCL acima do teto LRF 54%" é **FALSA** (era Pessoal_Bruto/RCL).
DTP/RCL real 2020 = 48,13%, dentro do teto; série nunca estourou. NÃO usar como motivo da rejeição.

## Tarefa
1. **Localizar o processo das contas MUNICIPAIS de Paulínia, exercício 2020** no TCE-SP:
   - Pesquisa processual: `https://www.tce.sp.gov.br/processos` (form legado em
     `https://www10.tce.sp.gov.br/pesquisa-drupal.asp`) — filtrar por município=Paulínia,
     tipo "Contas Anuais"/"Contas de Prefeitura", exercício 2020. Provável necessidade de Playwright.
   - Alternativa: portal de jurisprudência/decisões do TCE-SP por município.
2. **Baixar o(s) documento(s) decisivo(s):** parecer prévio, voto do relator, decisão do Pleno/Câmara,
   e o relatório de fiscalização. Salvar em `data/raw/paulinia/tce/contas_municipais_2020/`.
3. **Extrair os fatos** (não opinar) para `data/extracted/paulinia/tce/contas_municipais_2020.md`:
   - Resultado: contas aprovadas / aprovadas com ressalva / **rejeitadas (parecer desfavorável)**?
   - Fundamentos citados pelo relator (com nº de página/evento). Quais irregularidades concretas.
   - Datas, nº do processo, relator.
4. **(Opcional, se rápido) corrigir o bug de escopo** em `baixar_tce_sorocaba.py`: a coleta de
   "contas anuais" deveria mirar as contas municipais por ente, não a página estadual fixa. Se for
   grande, só registrar como pendência — não bloquear a tarefa principal.
   - ⚠️ **Bug é GENÉRICO: afeta Sorocaba também** (verificado 2026-06-01: inventário de Sorocaba é
     igualmente 318 PDFs estaduais, 0 menções ao município). A mesma pesquisa processual por
     município/exercício que resolve Paulínia deve servir para Sorocaba. Inócuo (CSV interno, nunca
     publicado) mas a correção vale para os dois. Ver memória `reference_tce_contas_anuais_bug`.

## Limites (portão Opus — NÃO fazer)
- **NÃO escrever o texto editorial** — é Plínio/Opus, a partir dos fatos que você extrair.
- **NÃO deployar** (decisão de deploy do site está pendente com o usuário).
- Coleta grava em `data/raw` e `data/extracted` apenas. Commits prefixo `[Claude]`.

## Estado do que já está pronto (contexto)
- `data/public/paulinia/` 89 CSVs validados (commit 90290f5). Site /paulinia 7 páginas, build ok
  (commit 1ffdd67) — **factualmente correto, não depende deste texto**. Deploy aguarda decisão.

## Ao terminar → handoff p/ Opus
Resumo dos fatos extraídos + caminho do .md + se confirma ou refuta a rejeição. Opus escreve o
texto (Plínio) e decide o deploy com o usuário.

## Referências
- `project_paulinia_coleta_completa` (memória, já corrigida), `reference_tce_sp_transparencia_api`,
  `reference_protocolo_sallum_cer` (regra editorial), `STATUS.md`.
