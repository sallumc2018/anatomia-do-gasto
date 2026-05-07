# Estratégia — Anatomia do Gasto

Documento de contexto estratégico para Claude Code, Codex e qualquer agente que trabalhe neste repositório.

## Missão

Transformar o "bosque de números" dos portais de transparência em caminhos nítidos que qualquer pessoa possa seguir, sem precisar ser especialista em contabilidade pública. Foco em Sorocaba/SP.

## Posicionamento

**"Rastreador de fluxo de dinheiro público auditável, educativo e aberto."**

Não é "portal de transparência genérico". É infraestrutura cívica — ferramenta de trabalho para intermediários (jornalistas, vereadores, conselhos, ONGs, professores).

## Estado Atual

- Site: https://anatomia-do-gasto-y1ze.vercel.app
- Saúde e educação Sorocaba: ~100% cobertos em `data/public`
- Salários e emendas: ~80%, estrutura sendo refinada
- Auditoria: mock público, sinalizado como fictício no site

## Foco dos Próximos 90 Dias

Objetivo: provar adoção real do core existente — não ampliar cobertura.

### Prioridades em ordem

1. **Instrumentação** — analytics de eventos no site (pré-condição de tudo)
2. **Trilha core a 100%** — saúde ou educação em Sorocaba com cobertura e confiabilidade totais
3. **Outreach dirigido** — lista de 10–15 usuários-alvo em Sorocaba (jornalistas, assessores, conselhos, professores)
4. **Rotina editorial** — relatório quinzenal de achados de Sorocaba
5. **Avaliação** — o que foi usado, o que não foi

### Métrica de ativação real

"Usuário entrou, buscou algo, encontrou, clicou na fonte e voltou" = produto funciona.

"Apenas abriu e saiu" = acervo, não produto.

## O Que NÃO Fazer

- Ampliar para outras cidades antes de Sorocaba estar consolidada
- Criar novas seções antes de consolidar saúde/educação
- Esperar que o público descubra o site sozinho
- Tratar como ONG genérica de transparência

## Próximo Passo Técnico Imediato

Instrumentação de eventos no site Next.js:
- Busca realizada
- Filtro aplicado
- Clique em "fonte oficial"
- Retorno ao site

Ver `docs/pipeline.md` e `docs/arquitetura.md` para contexto técnico.
