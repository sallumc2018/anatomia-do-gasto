# ENGINEERING_SCOPE — Anatomia do Gasto

Contrato local de responsabilidade técnica. Complementa o
`~/Documents/Omega/MODEL_ROUTING.md`.

## Responsável principal

Codex é o responsável técnico principal pelo código:

- auditoria e revisão de diffs;
- arquitetura e confiabilidade;
- bugs e regressões;
- refatoração DRY/SOLID;
- Python, TypeScript e Next.js no aspecto de engenharia;
- testes, CI, gates, segurança e performance.

Claude permanece responsável preferencial por pesquisa ampla, fontes,
metodologia, coleta/publicação operacional e UI/UX editorial. Mudanças
substanciais dessas frentes recebem revisão técnica do Codex.

## Effort vigente

O effort informado na conversa/TUI é válido até nova indicação do usuário.
Agentes não devem pedir sua repetição.

- Low: triagem, documentação, leitura seletiva e alteração pequena.
- Medium: implementação e refatoração delimitada.
- High: arquitetura, auditoria ampla, segurança ou refatoração transversal.

Se uma tarefa começar em Low, Codex deve executar tudo que for seguro nessa
faixa e avisar somente antes da etapa que realmente exigir aumento.

## Alerta de contexto

- Avisar: `Contexto próximo de 80K: execute /compact antes de continuarmos.`
- O alerta deve ocorrer por volta de 80K, antes do limite de 90K.
- Após a compactação, reler somente `STATUS.md`, `TASKS.md` e os arquivos
  diretamente envolvidos na tarefa.

## DRY/SOLID no site

Uma limpeza integral é programa de trabalho, não uma única alteração:

1. mapear duplicação, complexidade, acoplamento e cobertura;
2. congelar comportamento com testes;
3. priorizar hotspots por risco e frequência de mudança;
4. refatorar em lotes pequenos e temáticos;
5. validar lint, testes, build e diff em cada lote;
6. evitar abstrações sem duplicação ou complexidade comprovada.

Separar commits de frontend, pipelines, dados e governança. Não misturar
alterações concorrentes de Claude e Codex.
