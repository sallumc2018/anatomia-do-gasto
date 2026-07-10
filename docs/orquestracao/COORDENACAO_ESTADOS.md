# Coordenação de Coleta por Estado — sessão hub

Criado em 2026-07-10. Esta sessão (Claude Code) funciona como hub de
orquestração: em vez de o usuário abrir um terminal por estado/município,
o hub despacha `Agent` (Claude Code, foreground ou background) para tarefas
delimitadas e acompanha o resultado aqui.

## Contrato herdado

Todo `Agent()` despachado por este hub segue o contrato já validado em
`memory/agents/registry.csv` e no protocolo do Maestro (`ORQUESTRADOR.md`,
`AI_MASTER_PROMPT.md`). Não é um sistema novo — é o mesmo roteamento por
domínio (dados, pipeline, playwright, qa, seguranca, analista) só que a
*execução* usa o mecanismo `Agent`/`Workflow` do Claude Code em vez de
personas digitadas manualmente numa única sessão.

Regras que todo agente despachado herda (ver `registry.csv` para o
domínio específico):
- nunca ler `.env`, secrets, `data/raw`/`data/extracted`/`data/validated`
  como fato publicado — apenas `data/public` é fonte de verdade publicada;
- nunca commitar, dar push, publicar ou fazer deploy sem autorização
  explícita do usuário neste hub — mesmo em background;
- pacote mínimo de contexto: escopo explícito (estado/município/domínio),
  não repassar histórico completo da sessão hub;
- dado ausente não é zero — reportar "AUSENTE", nunca inferir;
- qualquer achado publicável (fix, gap, decisão) é reportado ao hub, que
  decide se vira memória/handoff, não o agente delegado sozinho.

O hub (esta sessão) atua como Maestro em confiança **C2 (route-readonly)**:
posso propor rota, montar pacote mínimo e despachar leitura/auditoria
sozinho; qualquer escrita em `data/public`, commit, push ou deploy
continua exigindo aprovação explícita do usuário antes de cada ação —
igual ao nível de confiança já registrado em
`memory/agents/maestro-confidence-state.csv`. Não escalo esse nível sem
evidência validada, seguindo a própria régua do sistema.

## Estado da cobertura (baseline 2026-07-10)

Municípios configurados em `pipelines/paths.py::MUNICIPIOS` (SP, Sprint 1 +
avulsos): sorocaba, paulinia, sao_paulo, guarulhos, campinas,
sao_bernardo_do_campo, santo_andre, osasco, ribeirao_preto,
sao_jose_dos_campos, maua, sao_jose_do_rio_preto, santos, mogi_das_cruzes,
diadema, jundiai, carapicuiba, piracicaba, bauru, itaquaquecetuba,
sao_vicente (21 municípios).

Com manifest/QA publicado em `data/manifests/` até 2026-07-10: campinas,
paulinia, sao_bernardo, sao_paulo, sorocaba (+ lote `sprint2`). Os demais
15 têm pipeline configurado mas cobertura de publicação não auditada
recentemente — primeiro alvo natural de auditoria read-only.

## Tabela de acompanhamento

| Estado | Município/escopo | Status | Agente/Task ID | Última atualização |
|---|---|---|---|---|
| SP | auditoria de cobertura dos 21 municípios (read-only) | concluído | a9b76eeaa7749eb1a | 2026-07-10 |

Mecanismo validado: agente em background, sem TUI extra, sem escrita,
resultado revisado pelo hub. Achado da auditoria (ver resultado completo
no handoff/summary desta sessão): todos os 21 municípios têm dados em
`data/public/<slug>/`, mas apenas 5 (campinas, paulinia, sao_paulo,
sao_bernardo, sorocaba) têm `qa.csv` em `data/manifests/` — os outros 16
têm dado publicado sem manifest de QA documentado. Nota: a pasta de
manifest de São Bernardo do Campo usa o slug `sao_bernardo`, divergente
do slug `sao_bernardo_do_campo` usado em `pipelines/paths.py` e em
`data/public/` — só isso já é um achado real de inconsistência de nomes
entre camadas.

**Tentativa em 2026-07-10 — bloqueada, não é mais "próximo passo pendente":**
rodei `pipelines/gerar_qa_manifest.py --municipio <slug>` para os 16
municípios sem manifest. Resultado real: os 16 `qa.csv` gerados vieram
**vazios (0 entradas, só cabeçalho)** — removidos em seguida (não commitados,
sem custo real deixar zero rastro).

Causa raiz: `gerar_qa_manifest.py` mapeia cada CSV publicado usando
`data/manifests/datasets.csv` como dicionário (área/tipo/fonte por
`Arquivo_Padrao`). Esse arquivo só tem linhas para
`global, paulinia, sao_bernardo, sao_paulo, sorocaba` — exatamente os 5 que
já tinham manifest. Os outros 16 municípios (coleta Sprint1, via
`coletar_municipio_sp.py`) nunca foram registrados em `datasets.csv`, então
todo CSV deles cai em "sem correspondência" e o manifest sai vazio.

**Isso não é o mesmo problema do achado anterior** (falta de manifest) — é um
problema a montante: falta o cadastro desses 16 municípios em
`data/manifests/datasets.csv` (área, tipo, fonte, padrão de nome de arquivo,
por dataset). Sem isso, gerar manifest é mecanicamente impossível, não é só
rodar o script.

Próximo passo real (não disparado, aguardando decisão do usuário): decidir
se vale cadastrar os 16 municípios em `datasets.csv` (trabalho de mapeamento
manual/semiautomático, maior que a tarefa original) — ou se a prioridade é
outra e essa cobertura de QA fica como gap documentado por ora.

Atualizar esta tabela a cada despacho novo — é o estado persistente que
substitui reexplicar tudo a cada sessão nova, conforme pedido do usuário.
