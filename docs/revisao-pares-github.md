# Revisao por pares no GitHub

Este documento define o padrao minimo para que a estrutura interna do Anatomia do Gasto seja legivel por revisores externos no GitHub.

O objetivo nao e expor operacao privada. O objetivo e permitir que qualquer pessoa tecnica consiga responder:

1. o que mudou;
2. por que mudou;
3. quais fontes sustentam a mudanca;
4. quais validacoes foram executadas;
5. quais limites, lacunas ou riscos continuam abertos.

## Principio

Tudo que for commitado deve conseguir passar por revisao publica sem depender de contexto privado, conversa com agentes ou estado local da maquina.

Quando o trabalho nasceu em sandbox, Antigravity, VS Code, Codex, Claude, Gemini ou outro agente, o resultado publicavel precisa ser reconciliado com:

- arquivos versionados;
- docs publicas;
- manifests;
- validadores locais;
- proveniencia sanitizada.

## Checklist de PR

Antes de abrir PR ou fazer commit direto em `main`, verificar:

- O diff e pequeno o suficiente para revisao humana.
- A issue ou PR usa o template publico aplicavel quando a mudanca veio de contribuicao externa.
- O motivo da mudanca esta documentado no PR, issue, task ou doc.
- Arquivos de dados publicados continuam restritos a `data/public`.
- `data/extracted` e `data/validated` nao foram tratados como publicacao.
- Toda informacao publica nova tem fonte, periodo, escopo e limitacao.
- Benchmarks, notas e comparacoes usam evidencia medida, nao scores simulados.
- Mudancas de UI citam o comportamento esperado e as rotas afetadas.
- Mudancas de agente, memoria ou governanca registram proveniencia.
- Mudancas estruturais atualizam docs correspondentes.
- Validacoes locais foram executadas ou a ausencia delas foi declarada.

## Checklist de dados

Para dados novos ou alterados:

- Fonte oficial identificada.
- Metodo de coleta identificado.
- Camada correta preservada: raw, extracted, validated ou public.
- Dado ausente permanece ausente.
- Mock esta explicitamente marcado como ficticio.
- Nomes publicos so aparecem quando houver base legal/publica e contexto neutro.
- Nenhuma inferencia vira fato.

## Checklist de frontend

Para paginas e componentes:

- Conteudo editorial nao exagera cobertura, desempenho ou autoridade.
- Links internos existem ou estao no sitemap quando publicos.
- Rotas que mostram dados leem apenas `data/public`.
- Textos de botao, navegacao e cards cabem no layout.
- Lighthouse/PageSpeed so aparece como meta ou como resultado medido com evidencia.

## Checklist de agentes e memoria

Para trabalho feito por agentes:

- O agente esta identificado em `memory/provenance/changes.csv`.
- Falhas reutilizaveis estao em `memory/knowledge/problems.csv`.
- Correcoes reutilizaveis estao em `memory/knowledge/solutions.csv`.
- Economia de contexto esta registrada quando o trabalho for substantivo.
- Handoff publico existe quando o proximo revisor precisaria reler contexto amplo.

## Comando local

```powershell
python tools\agents\validate-area.py --area review
```

Esse comando nao substitui revisao humana. Ele apenas verifica se os principais artefatos de auditabilidade existem e continuam parseaveis.
