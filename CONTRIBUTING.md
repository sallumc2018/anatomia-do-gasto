# Como Contribuir

Obrigado pelo interesse em contribuir com o Anatomia do Gasto. Este documento orienta como você pode ajudar.

## Código de Conduta

Todas as interações neste projeto são regidas pelo nosso [Código de Conduta](CODE_OF_CONDUCT.md). Leia antes de participar.

---

## Formas de Contribuir

### 1. Reportar Problemas

Encontrou um bug, dado incorreto ou melhoria? [Abra uma issue](https://github.com/sallumc2018/anatomia-do-gasto/issues) usando o template apropriado.

Inclua:
- Descrição clara do problema.
- Passos para reproduzir (se for bug).
- Comportamento esperado vs. observado.
- Capturas de tela, se relevante.

### 2. Sugerir Melhorias

Use o template de issue para propor:
- Novos setores (transporte, segurança, etc.).
- Novos municípios.
- Funcionalidades (visualizações, cruzamentos, alertas).

### 3. Contribuir com Código

1. **Fork** o repositório.
2. **Clone** seu fork localmente.
3. Crie uma **branch** descritiva: `feat/nova-visualizacao` ou `fix/correcao-csv-2023`.
4. Faça as alterações.
5. **Teste** localmente (veja [README.md](README.md#ambiente)).
6. Siga o estilo do projeto:
   - **Python:** PEP 8.
   - **TypeScript/React:** ESLint configurado em `apps/web`.
   - **Documentação:** Markdown, um parágrafo por linha.
7. **Commits em português**, com prefixos descritivos:
   - `feat:` para novas funcionalidades.
   - `fix:` para correções.
   - `docs:` para documentação.
   - `refactor:` para reorganização de código.
   - `chore:` para tarefas de manutenção.
8. **Push** para seu fork e abra um Pull Request.
9. Descreva claramente o que foi feito e por quê.

### 4. Contribuir com Dados

- Identificou uma fonte de dados pública que pode enriquecer o projeto? Abra uma issue com a URL e uma breve descrição.
- Encontrou uma inconsistência nos dados já publicados? Reporte como issue, incluindo a fonte que comprova o valor correto.

### 5. Contribuir com Moderação (futuro)

Quando as Câmaras 2 (validação jurídica) e 3 (praça pública) forem implementadas, voluntários poderão se candidatar a moderadores. As regras específicas estarão em [`docs/politica-de-moderacao.md`](docs/politica-de-moderacao.md).

---

## Pull Requests — Critérios de Aceitação

- O código roda sem erros no ambiente descrito no README.
- Novas funcionalidades incluem documentação mínima (comentários, atualização de README ou docs/).
- Mudanças no pipeline de dados devem ser testadas com pelo menos um ano real.
- O PR não introduz dependências desnecessárias.
- Mudanças com dados, benchmark, agentes ou governança devem seguir [`docs/revisao-pares-github.md`](docs/revisao-pares-github.md).
- Quando aplicável, rode `python tools/agents/validate-area.py --area review` antes de abrir o PR.
- O GitHub Actions executa gates de memória, agentes, escopo, publicação, revisão por pares, lint e build.

---

## Dúvidas?

Abra uma issue com a tag `dúvida` ou escreva para [contato@anatomiadogasto.ong.br](mailto:contato@anatomiadogasto.ong.br).
