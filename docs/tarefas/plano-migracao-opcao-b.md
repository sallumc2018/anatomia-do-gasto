# Plano De Migracao Para A Opcao B

Data base: 2026-05-07

Objetivo: alinhar o repositório público à política de **open source seletivo com manifests públicos**.

## Resumo Executivo

Hoje o repositório rastreia:

- `174` arquivos públicos por padrão;
- `132` arquivos em camadas que deveriam ser internas por padrão:
  - `data/raw`: `46`
  - `data/extracted`: `44`
  - `data/validated`: `42`

Fonte: `python pipelines/testes/auditar_exposicao_repositorio.py`

## O Que A Opção B Exige

Continuam públicos:

- código;
- documentação;
- `data/public`;
- `data/manifests`.

Passam a ser internos por padrão:

- `data/raw`;
- `data/extracted`;
- `data/validated`.

## O Que Cada Caminho Significa

### Caminho 1 - corrigir daqui para frente

Significa:

- remover essas camadas da árvore atual do repositório público;
- manter o histórico antigo intacto;
- reforçar manifests e testes para impedir regressão.

Vantagens:

- menor risco operacional;
- não reescreve histórico;
- mais fácil de coordenar entre Windows, WSL, GitHub e Vercel.

Desvantagens:

- arquivos antigos continuam acessíveis no histórico do GitHub.

Quando usar:

- quando a ONG quer melhorar a postura pública sem fazer cirurgia no histórico agora.

### Caminho 2 - corrigir também o histórico

Significa:

- reescrever o histórico Git para remover `raw`, `extracted` e `validated` do passado público;
- forçar sincronização completa dos clones e do remoto.

Vantagens:

- postura de exposição mais forte;
- reduz acesso retrospectivo às camadas internas.

Desvantagens:

- operação delicada;
- muda hashes do histórico;
- exige coordenação rigorosa com GitHub, WSL, Windows, Vercel e qualquer clone externo;
- alto risco de erro humano se for feito cedo demais.

Quando usar:

- só depois de a política já estar estabilizada e a ONG decidir que a exposição histórica também precisa ser reduzida.

## Recomendação

Adotar o **Caminho 1** agora.

Depois de estabilizar manifests, docs e processo de publicação, reavaliar se o **Caminho 2** vale o custo.

## Sequência Recomendada

### Fase 1 - política e prova

- [x] Formalizar a política da Opção B.
- [x] Fortalecer `data/manifests`.
- [x] Criar auditoria local de exposição do repositório.

### Fase 2 - inventário e exceções

- [ ] Classificar todos os arquivos atuais em `raw`, `extracted` e `validated`.
- [ ] Marcar exceções reais que devem continuar públicas.
- [ ] Justificar cada exceção por escrito.

### Fase 3 - ajuste técnico no repositório

- [ ] Remover do repositório público o que não deve permanecer público.
- [ ] Preservar apenas `data/public` e `data/manifests` como camadas públicas de dados.
- [ ] Atualizar documentação, testes e checklist após a remoção.

### Fase 4 - endurecimento

- [ ] Avaliar se vale reescrever histórico.
- [ ] Só executar reescrita histórica com plano de rollback e sincronização total entre ambientes.

## Critério De Exceção

Um arquivo em `raw`, `extracted` ou `validated` só deve continuar público se:

1. houver necessidade clara de auditoria externa;
2. manifesto, hash, amostra ou documentação não bastarem;
3. o risco de exposição adicional for aceitável;
4. a justificativa estiver registrada em documento institucional.
