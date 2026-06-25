# Programa de refatoração dos 33 commits

## Escopo

- Intervalo indicado pelo usuário: `72e942b..2e3361c`, incluindo os 33 commits
  mais recentes observados em 2026-06-25.
- A autoria individual não é inferida: os commits não possuem rodapé Codex
  pesquisável e usam autor Git compartilhado.
- Dados gerados (`CSV`, schemas e manifests) não entram em avaliação
  DRY/SOLID. Recebem gates próprios de integridade e reprodutibilidade.
- Código analisável no intervalo: 79 arquivos, cerca de 3.995 inserções e 230
  remoções em `apps/web`, `pipelines`, `scripts` e `tools`.

## Critérios

DRY e SOLID são heurísticas, não metas isoladas. A revisão também aplica:

- KISS e YAGNI;
- coesão alta e acoplamento baixo;
- separação entre domínio, I/O e apresentação;
- complexidade ciclomática e tamanho de funções/componentes;
- tipagem e contratos explícitos;
- tratamento de erros e observabilidade;
- segurança de inputs, paths, subprocessos e publicação;
- testes de comportamento e regressão;
- desempenho e custo operacional;
- acessibilidade e semântica no frontend;
- legibilidade e facilidade de reversão.

## Gates

- Nenhuma mudança apenas para “aplicar padrão”.
- Abstração exige duplicação, acoplamento ou complexidade comprovada.
- Preservar comportamento antes de refatorar.
- Lotes pequenos, temáticos e reversíveis.
- Não misturar frontend, pipelines, dados e governança no mesmo commit.
- Não editar paths sob trabalho concorrente de outro agente.
- Cada lote passa pelos testes, lint, build e gates aplicáveis.

## Lotes

- [x] Lote 0 — contratos Sprint 2 e testes de promoção/publicação.
- [ ] Lote 1 — duplicação estrutural nas páginas municipais Next.js.
- [ ] Lote 2 — componentes e utilitários compartilhados do frontend.
- [ ] Lote 3 — coletores/orquestradores Python e separação de I/O.
- [ ] Lote 4 — cron, scripts operacionais e propagação uniforme de erros.
- [ ] Lote 5 — API de dados, allowlist e fronteiras de segurança.
- [ ] Lote 6 — hotspots de complexidade e chaves duplicadas do Ruff.
- [ ] Lote 7 — regressão completa, documentação e auditoria final.

## Effort

- Low: inventário, classificação e definição dos gates.
- Medium: lotes 0 a 6, um por vez.
- High: decisões arquiteturais transversais e lote 7.

## Estado

- [x] Intervalo e volume de código delimitados.
- [x] Critérios e gates definidos.
- [ ] Inventário detalhado de duplicações e hotspots.
- [x] Implementação iniciada.

## Lote 0 — resultado

- Contratos explícitos para `transferencias_federais`, `emendas_federais` e
  `fns`, com parsing CSV e comparação exata de colunas normalizadas.
- Validação de município por IBGE, incluindo o código FNS de 6 dígitos contra
  o código IBGE canônico de 7 dígitos.
- Promoção atômica com temporário único, `fsync`, SHA-256 antes/depois da
  cópia e preservação do destino em caso de falha.
- Cobertura de CSV vazio, header sem dados, HTML/XML, schema inválido, IBGE
  divergente, hash, promoção atômica e integração com manifesto.
- Evidência: 15 testes direcionados, Ruff, `py_compile`, `git diff --check`,
  `bash -n` e validação de um CSV FNS real.
- Pendência externa ao lote: o Claude criou `baixar_emendas_federais.py` após
  a revisão Codex. O coletor ainda exige validação isolada com a API real antes
  da próxima execução operacional do Sprint 2.

## Lote 1 — andamento

- Primeira fatia concluída: páginas de receita de Paulínia, São Paulo e São
  Bernardo consolidadas em um Server Component configurável.
- Similaridade original medida entre 93% e 95%.
- Volume reduzido de 1.414 para 641 linhas, preservando metadados, JSON-LD,
  conteúdo editorial, links e seleção de ano por município.
- Gates: ESLint, `next build` com TypeScript, 108 rotas geradas e HTTP 200 nas
  três rotas locais.
- Próximas áreas candidatas: `saude-fiscal`, `seguranca` e `transporte`, uma
  por vez.
