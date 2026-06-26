# IDEAS — Anatomia do Gasto

Propostas ainda não aprovadas para execução. Este arquivo não autoriza
implementação, publicação, commit, push ou deploy.

## Fluxo

- Registrar a proposta com problema, benefício e riscos.
- Validar aderência à missão pública e à política de dados.
- Quando aprovada, mover para a fila ativa em `TASKS.md`.
- Se exigir decisão durável, registrar também em `DECISIONS.md`.
- Remover ou arquivar ideias rejeitadas com uma justificativa curta.

## Em triagem

### Catálogo declarativo por município

- Problema: regras específicas de município estão embutidas em condicionais de
  `pipelines/gerar_datasets_json.py`.
- Ideia: definir padrões e cobertura esperada em manifesto validado por schema.
- Benefício esperado: adicionar municípios sem alterar o núcleo do gerador.
- Gate: provar equivalência com Sorocaba e Paulínia por testes.

### Contrato único de CSV no frontend

- Problema: há parsers CSV manuais repetidos em `apps/web/lib/data.ts`.
- Ideia: centralizar parsing no servidor ou gerar JSON validado no pipeline.
- Benefício esperado: reduzir duplicação e erros com aspas ou campos multilinha.
- Gate: fixtures com casos RFC 4180 e comparação com os datasets atuais.

### Adaptadores de consolidação

- Problema: DuckDB, Pandas e SQLite implementam regras semelhantes em um módulo
  altamente complexo.
- Ideia: separar inventário, normalização e writers por engine.
- Benefício esperado: comportamento consistente e testes menores.
- Gate: bancos gerados devem manter schema e contagens equivalentes.

### Downloads orientados pelo catálogo

- Problema: a rota dinâmica de downloads faz o build rastrear milhares de arquivos.
- Ideia: gerar allowlist a partir do manifesto público e servir arquivos grandes
  por uma camada pública estável.
- Benefício esperado: reduzir tracing e impedir acesso a paths não catalogados.
- Gate: todos os links catalogados respondem e paths fora da allowlist retornam 404.

## Modelo

```markdown
### Título

- Problema:
- Ideia:
- Benefício esperado:
- Riscos:
- Gate para virar tarefa:
```

