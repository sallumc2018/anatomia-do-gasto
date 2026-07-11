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
| PA/CE/GO/MG/PR (amostra multi-região, sprint2) | auditoria de cobertura de 20 municípios (4/UF, read-only) | concluído | ab9bf08db98cbf2c8 | 2026-07-10 |

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

## Auditoria multi-estado (sprint2 nacional) — 2026-07-10

`data/public/` já cobre 493 municípios nacionalmente (projeto sprint2 —
FNS/emendas federais/transferências federais), muito além dos 21 de SP.
Amostra de 20 municípios em 5 UFs/regiões (PA, CE, GO, MG, PR) auditada
read-only: todos têm dado publicado não-vazio e manifest sprint2
correspondente; `verificar_publicacao.py --strict` passa limpo em todo
`data/public`. O gap do `datasets.csv` é o mesmo já documentado, agora
maior: **0 dos 493 municípios sprint2 estão cadastrados** (só os 5
originais: global, paulinia, sao_bernardo, sao_paulo, sorocaba).

**Achado novo, mais sério que o gap de cadastro**: cobertura sprint2 é
fortemente enviesada para o Norte (PA 93,8%, RO 92,3%, AM 93,5%, AP 93,8%,
TO 87,8%, RR 73,3% dos municípios do estado) contra 1,8%–6,7% em
Nordeste/Sudeste/Sul; nenhuma capital grande (Salvador, Recife, BH,
Curitiba, Porto Alegre, Manaus) está publicada; DF tem 0/1. Além disso,
~40 slugs de município são ambíguos entre UFs sem desambiguação clara no
pipeline (`belem`, `rio_branco`, `palmas`, `boa_vista`, `santo_andre`,
`sao_vicente`, etc. — cada um candidato a 2-4 municípios reais
diferentes). Risco real: sem resolução, esses diretórios podem estar
atribuindo dado FNS/emendas ao município errado. Pendente decisão do
usuário sobre prioridade (tratar ambiguidade de slug antes de expandir
`datasets.csv`, já que cadastrar dado mal atribuído seria pior que não
cadastrar).

## Investigação de ambiguidade de slugs — 2026-07-10 (concluída)

Auditoria read-only (`ace457ef7ec592619`) confirmou e refinou o achado
anterior. Existe mecanismo de desambiguação por UF já implementado
(`pipelines/sprint2_keys.py` + gate `tools/gates/check_sprint2_slug_collisions.py`,
feito pelo Codex em 2026-07-02, calcula chave canônica `slug_uf` a partir de
`data/manifests/ibge_municipios_completo.csv`), mas **não aplicado** aos
diretórios hoje publicados em `data/public/`. Rodando o gate: 9 slugs
ambíguos publicados: `alto_alegre, boa_vista, bonfim, cruzeiro_do_sul,
iracema, rio_branco, santana, santo_andre, sao_vicente`.

**7 desses 9** (`alto_alegre, boa_vista, bonfim, cruzeiro_do_sul, iracema,
rio_branco, santana`) têm dado correto — a escolha do IBGE segue sempre o
"menor código numérico" (artefato de ordenação, não é erro, mas o slug
não indica a UF, o que é ambíguo pro leitor). `santo_andre` está correto
(São Andre-SP real).

**`sao_vicente` é um bug real, não apenas ambiguidade**: dentro do mesmo
diretório `data/public/sao_vicente/`, os dados FNS (pipeline sprint2, 12
arquivos) usam IBGE 355100 = São Vicente-SP correto, mas os dados de
execução orçamentária/RREO/DCA/transporte (pipeline SICONFI "sprint1 Top 20
SP", 131 arquivos) usam IBGE `3551702`, que pertence a **Sertãozinho-SP**,
não a São Vicente. Causa raiz: `pipelines/paths.py:40` tem o código IBGE
errado hardcoded para `sao_vicente` (correto seria `3551009`). Resultado:
qualquer página de execução orçamentária de São Vicente hoje publicada está
mostrando dado financeiro de Sertãozinho rotulado como São Vicente —
violação real de qualidade/transparência, não hipotética.

**Ação pendente (aguardando autorização do usuário, escrita fora do escopo
C2 read-only):** corrigir `pipelines/paths.py:40` (`3551702` → `3551009`) e
reprocessar/republicar `data/public/sao_vicente/{executivo,transporte,
seguranca,rreo,dca,...}` com o IBGE correto; depois expor UF no slug (ou no
frontend) dos outros 7 casos ambíguos; rodar
`check_sprint2_slug_collisions.py --strict` como gate de publicação.

## Correção São Vicente + gate de IBGE — 2026-07-10 (concluído, commits locais e6698a9a + seguinte, sem push)

Corrigido `pipelines/paths.py:40` (IBGE errado de Sertãozinho → correto de
São Vicente) e reprocessado. Descoberta durante a correção: o reprocesso
inicial só cobriu 2020-2025 (range padrão dos extratores SICONFI) — anos
2015-2019 ficaram com o IBGE errado por mais um ciclo até ser pego pelo
gate novo. Lição: **nunca aceitar "reprocessei" sem verificar o conteúdo
completo**, spot-check por amostra não é suficiente.

Criado `tools/gates/check_ibge_match.py`: compara o IBGE embutido no
CONTEÚDO de cada CSV publicado (não só o nome do arquivo/caminho) contra
o esperado pro slug do diretório. Rodado em `--strict` sobre todo
`data/public` (4290 arquivos, 494 municípios): limpo, com 1 achado novo
pendente — **FNS traz `CO_MUNICIPIO_IBGE=352310` para
Itaquaquecetuba/SP, mas o IBGE oficial é 3523602**; nome e UF do registro
batem (é claramente a mesma cidade), então parece anomalia da própria
fonte FNS/DATASUS, não erro nosso — mas não foi investigado a fundo.
Próximo passo: checar se é código IBGE antigo/recodificado ou erro de
cadastro no FNS, e se afeta outros municípios silenciosamente.

Também documentado: `sao_bernardo` (slug curado) precisou de alias
explícito no gate para `sao_bernardo_do_campo` — sem isso o gate batia
com o município real "São Bernardo/MA" (2110609) e dava falso positivo.
Confirma na prática o risco de ambiguidade de slug já mapeado.

**Decisão de arquitetura (via advisor, antes de escalar):** NÃO escalar a
publicação nacional via bypass de QA gate (`--skip-qa-gate` /
`datasets.csv` vazio) — foi exatamente esse bypass que permitiu o bug do
São Vicente chegar em produção sem detecção. Coleta (`data/extracted`) é
reversível e pode escalar livremente; a porta de `data/public` fica
condicionada ao gate de IBGE passar limpo. Refatorar
`publicar_dados.py` para aceitar regra de área agnóstica de município
(em vez de exigir 5571 linhas em `datasets.csv`) é o próximo passo real
antes de qualquer coleta nacional de SICONFI/SIOPS em escala.

## Escalar coleta nacional SICONFI/SIOPS — 2026-07-10 (autorizado, não iniciado)

Usuário autorizou implementar e rodar em fases por região. Gap técnico:
`pipelines/paths.py` já suporta modo dinâmico (`MUNICIPIO_IBGE/NOME/UF`
via env, mesmo mecanismo do sprint2), mas `coletar_municipio_sp.py`
exige município cadastrado no dict `MUNICIPIOS` — não usa o modo
dinâmico. Falta um orquestrador nos moldes de
`coletar_municipios_brasil.py` (concorrência, checkpoint, filtro por UF)
que rode SICONFI+SIOPS+SIOPE via modo dinâmico para os 5571 municípios,
usando a chave canônica `slug_uf` de `sprint2_keys.py` para evitar a
ambiguidade já documentada. Bloqueado pela decisão de arquitetura acima
(gate de IBGE + publicação sem bypass) antes de rodar em escala real.

## Pendência — data/public/sao_bernardo/educacao/fnde_repasses_* sem gate (2026-07-10)

Achado ao investigar `data/public/sao_bernardo/educacao/*` (não é trabalho
meu, arquivos não rastreados, timestamp 2026-07-10 14:56 — provável Codex):
11 arquivos `fnde_repasses_sao_bernardo_{2015..2025}.csv` publicados
diretamente em `data/public`, sem passar pelo `publicar_dados.py` (não há
entrada `sao_bernardo,educacao,...,fnde_repasses_sao_bernardo_{ano}.csv` em
`data/manifests/datasets.csv` — só existe a entrada `siope-federal` para
`siope_sao_bernardo_{ano}.csv`). Conteúdo é um placeholder legítimo
("SEM FONTE PÚBLICA AUTOMATIZÁVEL — verificado 2026-07-09, endpoint
/transferencias/municipios não existe no PT-Gov v3"), IBGE correto
(3548708), não é dado errado — mas é a mesma classe de risco do bug do São
Vicente: arquivo em `data/public` sem ter passado por nenhum gate.
Não commitei nem toquei (não é meu trabalho, arquivo não rastreado — ver
regra de edição concorrente no CLAUDE.md do repo). Ação pendente para quem
gerou: registrar o padrão `fnde_repasses_sao_bernardo_{ano}.csv` em
`data/manifests/datasets.csv` (área `educacao`, dataset novo tipo
`fnde-sem-fonte` ou similar) e commitar formalmente, ou mover para
`data/validated` e publicar via `publicar_dados.py`.

## Orquestrador nacional SICONFI + publicação com gate — 2026-07-10 (implementação iniciada)

Descoberta importante ao investigar antes de programar do zero: infra
parcial **já existe** e implementa exatamente o princípio "gate de
conteúdo, sem bypass" decidido na seção anterior:

- `pipelines/coletar_municipios_brasil.py` já tem `FONTES_FEDERAIS` com 8
  extratores SICONFI (receita, executivo, rcl, natureza_despesa,
  receita_capital, rgf_pessoal, rgf_divida, divida_detalhada) rodando em
  modo dinâmico (`MUNICIPIO_IBGE/NOME/UF`) — docstring do arquivo está
  desatualizada (diz que SICONFI "não é coletado aqui", mas é). Faltam
  `extrator_rreo_seguranca.py` e `extrator_rreo_transporte.py` (áreas
  seguranca/transporte) e SIOPS/SIOPE nessa lista.
- `pipelines/publicar_municipios_brasil.py` + `pipelines/sprint2_contracts.py`
  (`AREA_CONTRACTS`, `validate_csv`, `_ibge_matches`) já fazem publicação
  `data/extracted → data/public` com gate de conteúdo por arquivo (IBGE,
  colunas mínimas, não-vazio, cópia atômica + SHA-256) — mas só para 3
  áreas (`transferencias_federais`, `emendas_federais`, `fns`); SICONFI
  não está em `AREA_CONTRACTS` porque o IBGE ali não vem em coluna própria,
  vem embutido em `Fonte_URL` (`id_ente=<7 dígitos>`) — é o mesmo regex já
  usado em `tools/gates/check_ibge_match.py`.

Criando `pipelines/coletar_publicar_siconfi_brasil.py`: reusa a lista
SICONFI de `coletar_municipios_brasil.py` (+ seguranca/transporte) pra
coleta, e na publicação usa a extração de IBGE via `Fonte_URL` (mesmo
regex do gate) pra só copiar pra `data/public` arquivo cujo conteúdo bate
com o IBGE esperado — nunca copia por padrão de nome sozinho. Roda por UF
(`--uf`) ou por região (`--regiao Norte|Nordeste|Centro-Oeste|Sudeste|Sul`),
plano é começar com lote pequeno de teste antes de escalar.

## Correção Itaquaquecetuba/SP — 2026-07-11 (concluído)

Achado anterior (seção "Correção São Vicente + gate de IBGE") estava
**parcialmente errado**: a suspeita de anomalia da fonte FNS (`352310`) não
era bug — bate com o IBGE correto (`3523107`) truncado em 6 dígitos,
convenção normal do DATASUS/TABWIN. O IBGE `3523602` citado ali como
"oficial" de Itaquaquecetuba estava errado — é o código de **Itirapina/SP**.

O bug real, mesma classe do São Vicente/Sertãozinho: `pipelines/paths.py:39`
tinha Itaquaquecetuba cadastrado com o IBGE de Itirapina (`3523602`).
Confirmado que o SICONFI foi consultado com esse código errado: todo o dado
publicado em `data/public/itaquaquecetuba/{executivo,fiscal,receita,
transporte}/` (129 arquivos, 2015-2026) trazia `id_ente=3523602` — ou seja,
era o dado financeiro real de Itirapina rotulado como Itaquaquecetuba.

Corrigido `pipelines/paths.py:39` (`3523602` → `3523107`) e reprocessado
2015-2025 (extrator default só cobre 2020-2025; 2015-2019 precisou de
`--ano` explícito por extrator, lição do São Vicente aplicada desde o
início desta vez). 2026 retornou "dados indisponíveis" em todos os
extratores (RREO do exercício corrente ainda não submetido) — os 6 arquivos
de 2026 com IBGE errado foram removidos (dado ausente != zero, não dá pra
deixar Itirapina rotulado como Itaquaquecetuba por falta de dado real).

Descoberta lateral: `itaquaquecetuba` não tem nenhuma linha em
`data/manifests/datasets.csv` (mesmo gap dos outros 15 municípios Sprint1
já documentado acima) — `publicar_dados.py` não consegue publicar para esse
município estruturalmente. A promoção `data/extracted → data/public` foi
feita por cópia direta (mesmo padrão usado originalmente para publicar esse
município, commit `7f361c4d`), legítimo para as áreas SICONFI
(`AREAS_EXTRACTED`, integridade garantida pela API federal, sem
curadoria manual) e só depois de `check_ibge_match.py --strict` confirmar
zero mismatch em todo `data/public` (4549 arquivos, 495 municípios).

Achado adicional não corrigido aqui (fora de escopo, reportado para
decisão futura): `fase_publicar()` em `pipelines/coletar_municipio_sp.py`
verifica a existência de `data/validated/<municipio>/<area>/saida` antes de
chamar `publicar_dados.py` para TODAS as áreas — inclusive as de
`AREAS_EXTRACTED` (executivo/fiscal/receita/transporte/seguranca), que por
design nunca têm pasta `validated` (ver docstring de `publicar_dados.py`).
Resultado: a fase de publicação da coleta noturna Sprint1 sempre WARN e
nunca promove essas áreas para `data/public` automaticamente — a
publicação real desses dados sempre dependeu de passo manual. Não
investigado se isso afeta só os 21 municípios SP ou também outros.

Atualizar esta tabela a cada despacho novo — é o estado persistente que
substitui reexplicar tudo a cada sessão nova, conforme pedido do usuário.
