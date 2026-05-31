# DECISIONS — Anatomia do Gasto
> Decisões arquiteturais e editoriais que não mudam toda sessão.
> Atualizar só quando uma decisão for revisada ou nova.

## Site / Frontend

**Dois mapas separados**
- `/mapa-interativo` → navegação do site (áreas de dados, estrutura do conteúdo)
- `/fluxo-financeiro` → rastro do dinheiro público (Sankey: fontes → município → gastos)
- Razão: o mapa de navegação não conta a história do dinheiro; o fluxo não é um sitemap.

**Hierarquia nacional no mapa**
- Brasil → Estado → Município só entra no `/mapa-interativo` quando houver >1 município publicado.
- Hoje: Sorocaba como raiz (correto). Paulínia "em breve" só no `/fluxo-financeiro`.

**URLs planas por enquanto**
- Rotas: `/sorocaba/saude`, `/sorocaba/educacao` etc. (não `/sp/sorocaba/saude`)
- Migrar para URLs nacionais (`/uf/municipio/area`) só quando >1 município live.

**Deploy**
- Sempre via `vercel deploy --prod --yes` da raiz do repo.
- Integração GitHub → Vercel está desativada (cancela deploys automaticamente).

## Dados

**Fonte canônica**
- RREO/SICONFI para receita e despesa por função (Tesouro Nacional)
- Valores no Sankey em R$ milhões, receita escalada proporcionalmente ao liquidado.

**Política de publicação**
- `publicavel` → exibe livremente
- `publicavel_com_cautela` → agrega, sem perfil individual
- `nao_destacar_na_ui` → presente nos dados, fora do destaque visual

**Subvenções OSC**
- `subvencoes_por_entidade_sorocaba.csv` armazena valores em centavos → dividir por 100 para exibir.

## Ecossistema / IAs

**Multi-agente**
- Claude (este chat e outros) + Codex + Gemini rodam em paralelo no mesmo repo.
- Barramento: filesystem + git. Codex commita ativamente com prefixo `[Codex]`.
- Claude commita com prefixo `[Claude]`. Handoffs via `memory/handoffs/`.
- **OBRIGATÓRIO: todo commit DEVE ter prefixo `[Claude]` ou `[Codex]`.** O `git author` é sempre `Sallum` (identidade git = usuário), então o prefixo da mensagem é a ÚNICA forma de atribuir autoria. Reforçado em 30/mai/2026: 5 commits Claude ficaram sem prefixo no branch `institutional-audit`, impossibilitando atribuição por `git log --grep` — exigiu mapa manual. Sem prefixo = autoria ambígua = retrabalho.
- Enforçado por hook `commit-msg` em `.githooks/`. Ativar uma vez por clone: `git config core.hooksPath .githooks`.

**npm**
- Nunca rodar `npm install / update / audit fix`. Worm ativo (mai/2026).
- Pacotes auditados limpos: `context7@2.3.0`, `sequential-thinking`.

**Python no Windows**
- Usar `py script.py` (Python Launcher). `python` também funciona nesta máquina.
- Evitar `python3` (convenção Linux, não resolve no Windows por padrão).

**Segundo município**
- Paulínia/SP: "cidade rica que gasta mal". Contas 2020 rejeitadas pelo TCE-SP.
- Executar coleta só após consolidar Sorocaba completamente.
