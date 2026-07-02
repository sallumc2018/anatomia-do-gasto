# Roteamento Codex e Claude

Este e o contrato canonico de divisao de trabalho entre as duas ferramentas
principais da Anatomia do Gasto. Antigravity/Gemini nao faz parte da operacao
ativa. Suas antigas funcoes ficam temporariamente com Claude Code.

Para commit, push e deploy, aplicar tambem `docs/release-ownership.md`.

## Codex: auditoria e confiabilidade

Codex e o auditor principal de codigo e o engenheiro de confiabilidade do
projeto.

Responsabilidades primarias:

- revisar commits, diffs, arquitetura e codigo existente;
- investigar bugs, regressões, concorrencia e falhas ambiguas;
- implementar e refatorar Python, TypeScript, Next.js, CI e automacoes;
- aplicar DRY, SOLID, tipagem, limites de complexidade e separacao de camadas;
- criar testes, validadores, quality gates e mecanismos contra reincidencia;
- auditar seguranca de implementacao, subprocessos, paths, inputs e secrets;
- medir performance, cobertura de testes e divida tecnica;
- revisar tecnicamente blocos de maior risco produzidos nas sessoes Claude.

Codex nao e o executor padrao de deploy, publicacao de dados, operacao de
contas externas ou decisao editorial/legal final. Pode preparar e validar esses
fluxos, mas a acao externa continua exigindo gate humano.

## Claude: Coleta e Publicacao

Sessao recomendada: `Anatomia do Gasto - Coleta e Publicacao`.

Responsabilidades primarias:

- localizar e interpretar fontes oficiais;
- executar coletas, Playwright, cron, jobs e pipelines operacionais;
- reconciliar manifests, cobertura, proveniencia e metodologia;
- preparar promocao entre camadas de dados;
- executar push, GitHub Actions, Vercel e publicacao somente com autorizacao;
- absorver temporariamente as antigas funcoes operacionais do Antigravity.

Mudancas em publicacao automatica, secrets, rede, cron, GDrive, GitHub ou
Vercel devem receber revisao tecnica do Codex antes do fechamento quando houver
codigo, automacao ou risco de seguranca.

## Claude: UI/UX

Sessao recomendada: `Anatomia do Gasto - UI/UX`.

Responsabilidades primarias:

- linguagem cidada, arquitetura de informacao e consistencia editorial;
- design, acessibilidade, responsividade e experiencia de navegacao;
- paginas, componentes, copy, SEO editorial e visualizacoes;
- Playwright visual e verificacao de fluxos de interface;
- metodologia, LAI/LGPD e documentos longos com implicacao editorial ou legal.

Codex deve revisar bugs de implementacao, duplicacao estrutural, tipos, testes,
performance, seguranca e contratos de dados quando a mudanca de UI for
substancial.

## Regra de desempate

- Se o problema principal for corretude de codigo, arquitetura, teste,
  automacao ou confiabilidade: Codex.
- Se o problema principal for fonte, coleta, publicacao, operacao externa ou
  metodologia: Claude Coleta e Publicacao.
- Se o problema principal for interface, conteudo, acessibilidade ou linguagem:
  Claude UI/UX.
- Se cruzar areas, o produtor trabalha em sua sessao e entrega diff, validacao e
  riscos; Codex faz a revisao tecnica final do bloco de maior risco.

## Effort recomendado

- Low: triagem, leitura seletiva, comandos simples e diff pequeno.
- Medium: implementacao normal, pipeline, frontend ou revisao multi-arquivo.
- High: auditoria integral, arquitetura, seguranca, metodologia ou conflito.
- xHigh: incidente critico, migracao extensa ou decisao dificil de reverter.

## Gates permanentes

- Nenhuma ferramenta faz push, deploy ou publicacao sem autorizacao explicita.
- Nenhuma ferramenta inclui secrets, memoria privada ou dados nao publicaveis.
- Todo produtor preserva alteracoes concorrentes e registra proveniencia.
- Revisao do Codex nao substitui QA de dados, decisao metodologica nem
  autorizacao humana.
- Claude faz commit, push e deploy apenas do proprio escopo autorizado
  (coleta/publicacao ou UI/UX). Codex faz commit e push apenas do proprio escopo
  autorizado; deploy pelo Codex e excecao, somente com limite operacional
  suficiente e autorizacao explicita.
- Cada agente commita apenas o proprio escopo. Se publicar commits de outro
  agente, deve declarar quais commits sao de quem e quais gates cobrem o lote.
- Antes de push/deploy, rodar `python tools/agents/check-release-readiness.py`
  no estagio correspondente.
