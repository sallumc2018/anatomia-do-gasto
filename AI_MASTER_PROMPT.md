# AI Master Prompt

## 1. Objetivo Do Projeto

O Anatomia do Gasto expõe, de forma clara e legível para o cidadão comum, como o dinheiro público entra no governo e para onde ele vai depois, começando por Saúde e Educação em Sorocaba/SP e expandindo município por município até cobrir o Brasil.

## 2. Ecossistema De Trabalho

- Ambiente local Windows: `C:\projetos\anatomia-do-gasto`.
- Ambiente local WSL/Linux recomendado: `~/projetos/anatomia-do-gasto`.
- Repositório central: GitHub `sallumc2018/anatomia-do-gasto`.
- Deploy: Vercel conectada ao GitHub, com Root Directory `apps/web`.
- App web: `apps/web`.
- Pipeline Python: `pipelines`.
- Dados:
  - `data/raw`: fontes brutas.
  - `data/extracted`: extrações automáticas, ainda não publicadas.
  - `data/validated`: dados aprovados localmente.
  - `data/public`: única fonte de dados do site.
  - `data/manifests`: inventário e status dos datasets.
- RTK: ferramenta local de economia de contexto/token; binários e caches não são versionados.

## 3. Regras Permanentes

1. O site oficial só pode ler `data/public`.
2. CSV em `data/extracted` não é dado publicado.
3. CSV em `data/validated` só vira publicação depois de cópia explícita para `data/public`.
4. Alterações estruturais exigem atualização de documentação relacionada.
5. Antes de commit/push/deploy, rodar validações locais aplicáveis.
6. Não versionar `node_modules`, `.next`, `.venv`, `venv`, `.env.local`, caches ou binários RTK.
7. Preferir mudanças pequenas, rastreáveis e com justificativa objetiva.
8. Não duplicar contexto já documentado; referenciar `README.md`, `docs/arquitetura.md`, `docs/pipeline.md` e `docs/ambiente.md`.

## 4. Validação Mínima

Python:

```powershell
python -m py_compile pipelines\paths.py pipelines\pipeline.py pipelines\publicar_dados.py
python pipelines\testes\verificar_publicacao.py
```

Frontend:

```powershell
cd apps\web
npm.cmd --script-shell cmd.exe run lint
npm.cmd --script-shell cmd.exe run build
```

WSL/Linux:

```bash
cd apps/web
npm run lint
npm run build
```

## 5. Política De Commit

Não commitar automaticamente qualquer mudança. Commitar somente depois de:

- validar localmente;
- revisar o diff;
- confirmar que dados não validados não entraram em `data/public`;
- usar mensagem clara no formato recomendado:

```text
[Ferramenta] descrição curta
```

Exemplos:

```text
[Codex] reorganiza camadas de dados
[Claude] ajusta textos da página de metodologia
```

## 6. Sincronia Entre Ambientes

A fonte da verdade é o GitHub. Windows, WSL, Vercel e ferramentas de IA devem convergir para o mesmo estado por meio de Git, documentação e manifests.

Antes de deploy:

1. Validar localmente no ambiente atual.
2. Validar no WSL quando a mudança afetar build, scripts ou caminhos.
3. Fazer commit.
4. Fazer push.
5. Conferir build na Vercel.
6. Conferir o site oficial.

## 7. Resposta Esperada Das IAs

- Ser conciso.
- Explicar decisões técnicas quando houver tradeoff.
- Indicar arquivos afetados em mudanças estruturais.
- Não afirmar que algo foi validado sem ter rodado a validação.
- Se houver lacuna de ambiente, registrar claramente.
