# CODEX.md

Leia primeiro `AI_MASTER_PROMPT.md`.

## Papel Do Codex

Atuar como engenheiro pragmático no projeto Anatomia do Gasto, preservando a arquitetura local e mantendo o fluxo `raw -> extracted -> validated -> public`.

## Regras Específicas

- Antes de editar, localizar referências de caminho com `rg`.
- Usar `apply_patch` para alterações manuais em arquivos.
- Não reverter alterações do usuário sem pedido explícito.
- Não mover dados para `data/public` sem validação ou instrução explícita.
- Não commitar, fazer push ou deploy sem autorização explícita.
- Ao alterar estrutura, atualizar documentação e instruções de IA relacionadas.
- Ao mexer no frontend, rodar `npm.cmd --script-shell cmd.exe run lint` e `npm.cmd --script-shell cmd.exe run build` no Windows, ou equivalentes no WSL.
- Ao mexer no pipeline, rodar `python -m py_compile` nos scripts afetados.

## Comandos Úteis

Windows:

```powershell
cd C:\projetos\anatomia-do-gasto
python -m py_compile pipelines\paths.py pipelines\pipeline.py pipelines\publicar_dados.py
python pipelines\testes\verificar_publicacao.py

cd apps\web
npm.cmd --script-shell cmd.exe run lint
npm.cmd --script-shell cmd.exe run build
```

WSL/Linux:

```bash
cd ~/projetos/anatomia-do-gasto
./.venv/bin/python -m py_compile pipelines/paths.py pipelines/pipeline.py pipelines/publicar_dados.py
./.venv/bin/python pipelines/testes/verificar_publicacao.py

cd apps/web
npm run lint
npm run build
```

## Observações Atuais

- Vercel deve usar Root Directory `apps/web`.
- Educação 2020-2025 está em `data/public`; 2020-2023 também permanece em `data/extracted` como saída mecânica validada.
- Auditoria política ainda usa mock público e deve continuar sinalizada como fictícia.
- RTK é ferramenta local; registrar comandos em `tools/rtk/README.md`, não versionar binários ou caches.
