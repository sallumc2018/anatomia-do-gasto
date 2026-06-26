# Auditoria de código — 2026-06-25

## Escopo e evidência

- Escopo: código, automações e frontend do repositório público Anatomia do Gasto.
- Fora do escopo: credenciais, serviços externos, deploy, publicação e configuração do sistema.
- Estado verificado: `main` em `48f0d6f`, com alterações locais de Codex e Claude ainda não commitadas.
- Inventário: 180 arquivos Python, 132 arquivos TypeScript/TSX, 3 arquivos Python `test_*.py` e nenhum teste de frontend.
- Validações executadas:
  - `python -m unittest discover`: 5 testes aprovados;
  - gate de canonical: 2 testes aprovados;
  - `python -m compileall`: aprovado;
  - ESLint e TypeScript: aprovados;
  - Next.js build: 108 rotas geradas;
  - memória, agentes, escopo e segredos: aprovados;
  - Ruff focalizado: 146 ocorrências de chaves duplicadas ou complexidade;
  - RTK: 145/145 testes, 40,8 milhões de tokens economizados (87,5%).
- Limitação de ambiente: uma repetição do build pelo wrapper `validate-area frontend`
  foi bloqueada pelo sandbox quando o Turbopack tentou abrir uma porta interna
  (`Operation not permitted`). O build direto imediatamente anterior concluiu as 108 rotas.

## Prioridade imediata

### P0 — publicação automática sem gate de integridade

- Evidência: `pipelines/publicar_municipios_brasil.py` copia qualquer `*.csv` encontrado de
  `data/extracted` para `data/public`, sem validar schema, conteúdo, município, período,
  tamanho mínimo, hash ou atomicidade.
- Evidência operacional: `scripts/coleta_noturna.sh` chama esse publicador automaticamente
  e depois sincroniza `data/public` para o armazenamento remoto.
- Risco: resposta HTTP válida da fonte não prova que a extração gerou conteúdo correto.
  HTML de erro salvo como CSV, arquivo truncado, cabeçalho incompatível ou município errado
  podem ser publicados silenciosamente.
- Correção recomendada:
  - criar contrato por área com colunas obrigatórias e validadores de município/IBGE;
  - rejeitar arquivo vazio, sem linhas ou com conteúdo não CSV;
  - preparar cópia em diretório temporário e promover por `Path.replace`;
  - gerar manifesto com SHA-256, tamanho, linhas, fonte e instante;
  - manter publicação sob gate humano até os validadores cobrirem as três áreas;
  - fazer o cron falhar de forma visível quando coleta ou publicação Sprint 2 falhar.
- Responsável recomendado: Claude Coleta e Publicação; revisão final Codex.

### P0 — falhas do Sprint 2 não entram em `FALHAS`

- Evidência: os passos 7 e 8 de `scripts/coleta_noturna.sh` apenas escrevem `AVISO` quando
  falham. Eles não adicionam a etapa ao array `FALHAS`.
- Impacto: o processo pode terminar com código zero, não enviar alerta e sincronizar estado
  parcial mesmo após falha de coleta ou publicação.
- Correção recomendada: executar ambos por `run_cmd` ou adicionar explicitamente a falha ao
  array, distinguindo coleta, validação e publicação.
- Responsável recomendado: Claude Coleta e Publicação.

## Prioridade alta

### P1 — API de download causa rastreamento de 13.556 arquivos

- Evidência: o build alerta que o acesso dinâmico em
  `apps/web/app/api/dados/[...slug]/route.ts` corresponde a 13.556 arquivos.
- Impacto: build mais lento, risco de empacotamento excessivo e aproximação do limite de
  tamanho das funções.
- Correção recomendada:
  - gerar allowlist de downloads a partir de `data/manifests/datasets.csv`;
  - resolver apenas caminhos presentes no catálogo;
  - servir arquivos grandes por armazenamento/CDN público estável, sem regras manuais por área;
  - testar que cada link catalogado existe e que paths não catalogados retornam 404.
- Princípios: inversão de dependência e open/closed; a rota depende do catálogo, não de uma
  lista fixa de exceções.
- Responsável recomendado: Claude UI/UX para a rota e catálogo; revisão Codex.

### P1 — canonicals incorretos em quatro rotas

- Evidência: `tools/gates/check_canonical_routes.py` detecta `/fluxo`,
  `/fluxo-financeiro`, `/mapa-interativo` e `/sandbox` herdando o canonical da home.
- Impacto: mecanismos de busca podem tratar páginas distintas como duplicatas da raiz.
- Correção recomendada:
  - metadata própria por `layout.tsx` nas páginas client;
  - definir `/sandbox` como `noindex` se for ambiente experimental;
  - integrar o gate ao CI somente depois de zerar os quatro achados.
- Responsável recomendado: Claude UI/UX.

### P1 — cobertura de testes insuficiente

- Evidência: 180 arquivos Python para 3 arquivos `test_*.py`; 132 arquivos TS/TSX sem testes.
- Impacto: parsers fiscais, publicação e componentes podem regredir mesmo com lint e build verdes.
- Correção recomendada:
  - pirâmide mínima: unidades para normalização/parsing, contratos para datasets e smoke de rotas;
  - fixtures pequenas e sintéticas, sem copiar bases públicas inteiras;
  - prioridade inicial: publicador Sprint 2, rota de downloads, `gerar_datasets_json.py`,
    consolidação DuckDB/SQLite e parsers CSV do frontend.
- Responsável recomendado: Codex para contratos e testes de confiabilidade; Claude para testes
  dos fluxos que implementar.

### P1 — parsing CSV manual e repetido

- Evidência: `apps/web/lib/data.ts` contém múltiplos loops manuais para dividir CSV; a busca
  ampla encontrou 112 usos de parsing CSV no código Python/TypeScript.
- Risco: o parser atual alterna estado a cada aspas e não cobre de forma confiável aspas
  escapadas, quebras de linha em campos e outros casos válidos de RFC 4180.
- Correção recomendada:
  - usar uma única biblioteca de CSV no servidor ou gerar JSON validado no pipeline;
  - centralizar `parseBrNumber`, resolução de cabeçalhos e validação de linhas;
  - evitar enviar parsing fiscal ad hoc para componentes.
- Princípios: DRY e responsabilidade única.
- Responsável recomendado: Codex para desenho do contrato; Claude UI/UX para migração.

## Prioridade média

### P2 — `getDataDirs` viola DRY e aceita fallback silencioso

- Evidência: `apps/web/lib/data.ts` repete seis caminhos para quatro municípios e usa Sorocaba
  como fallback para qualquer chave desconhecida.
- Risco: erro de digitação em município mostra dados de Sorocaba em vez de falhar.
- Correção recomendada:
  - declarar `MunicipioKey` como união fechada;
  - construir caminhos com `path.join(DATA_PUBLIC_ROOT, municipio, area, "saida")`;
  - lançar erro controlado ou retornar ausência para chave inválida.
- Princípios: DRY, fail-fast e substituição segura.

### P2 — consolidação mistura descoberta, transformação e três engines

- Evidência: `tools/data/consolidacao_duckdb.py::consolidar_sqlite` tem complexidade 38,
  42 branches e 122 statements.
- Risco: DuckDB, Pandas e CSV puro implementam regras semelhantes de formas diferentes,
  produzindo resultados potencialmente divergentes.
- Correção recomendada:
  - `DatasetInventory` para descoberta;
  - `ColumnNormalizer` puro e testado;
  - adaptadores `DuckDBWriter` e `SQLiteWriter`;
  - uma representação intermediária comum;
  - context managers para conexões e transações atômicas.
- Princípios: SRP, strategy, dependency inversion e DRY.

### P2 — catálogo possui regras municipais embutidas

- Evidência: `gerar_datasets_json.py::checar_dataset` tem complexidade 26 e uma cadeia de
  condicionais específica para Paulínia.
- Risco: cada novo município amplia a função e exige mudança no núcleo.
- Correção recomendada:
  - mover padrões para manifesto declarativo versionado;
  - separar detecção, override e renderização;
  - validar o manifesto com schema;
  - eliminar imports não usados (`glob`, `os`) e testar os estados
    `publicado`, `parcial`, `em_coleta` e `lacuna`.
- Princípios: open/closed, SRP e data-driven design.

### P2 — avisos de dimensão dos gráficos no build

- Evidência: o build gerou cinco avisos Recharts com largura e altura `-1`.
- Impacto: risco de gráfico vazio ou instável durante SSR/hidratação.
- Correção recomendada:
  - identificar os cinco renders com teste de rota;
  - usar contêiner com altura/min-height estável;
  - renderizar o gráfico apenas após existir dimensão útil quando necessário.
- Responsável recomendado: Claude UI/UX.

### P2 — chaves duplicadas em dicionários

- Evidência Ruff:
  - `pipelines/extrair_despesas_gabinete_camara.py`: `"MARCO"` repetido;
  - `pipelines/gerar_dca_siconfi.py`: `"SaldoPatrimonial"` repetido com labels diferentes;
  - `tools/gates/check_grammar.py`: `"composicao"`, `"catalogo"` e `"analitico"` repetidos.
- Impacto: Python mantém somente o último valor; no DCA há perda silenciosa de uma decisão de label.
- Correção recomendada: remover duplicações e adicionar teste que falhe ao construir glossários
  ou mapas com chaves repetidas.

### P2 — títulos duplicam a marca

- Evidência: o layout aplica template `%s | Anatomia do Gasto`, enquanto as páginas de
  atualizações já incluem `— Anatomia do Gasto` no campo `title`.
- Impacto: título final repete a marca.
- Correção recomendada: fornecer apenas o título específico ou usar `title.absolute`.
- Responsável recomendado: Claude UI/UX.

### P2 — notificação Telegram precisa de endurecimento

- Evidência: o diff local de `scripts/coleta_noturna.sh` usa `mktemp`, mas não define
  `umask 077` nem `trap` para remover o arquivo temporário.
- Correção recomendada:
  - carregar somente as variáveis necessárias sem exportá-las;
  - criar arquivo com permissão 600;
  - remover por `trap` inclusive em sinal/erro;
  - não incluir caminho local de log na mensagem;
  - manter envio externo sujeito à política operacional explícita.
- Responsável recomendado: Claude Coleta e Publicação.

### P2 — observabilidade do wrapper de validação

- Achado: `tools/agents/validate-area.py` descartava stderr sempre que o comando também
  escrevia em stdout, ocultando a causa de falhas de build.
- Correção aplicada nesta auditoria:
  - stdout e stderr agora são exibidos separadamente;
  - subprocessos Python reutilizam `sys.executable`, evitando depender de `python3` no PATH.
- Validação: Ruff, `py_compile`, gate de agentes e teste funcional de saída.

## Economia de tokens

- RTK está instalado em `~/.local/bin/rtk`, versão 0.42.3.
- `rtk verify`: hook nativo registrado e 145/145 testes aprovados.
- `rtk gain`: 46,6 milhões de tokens de entrada, 5,8 milhões de saída e 40,8 milhões
  economizados, equivalente a 87,5%.
- O RAG local compila e o contrato do índice passa.
- GPTCache está instalado, mas `pipelines/gptcache_helper.py` não possui consumidores.
- Recomendação:
  - manter RTK e RAG como mecanismos ativos;
  - remover GPTCache dos requisitos ou criar um caso de uso real com medição, política de
    invalidação e teste;
  - não adicionar mais camadas de cache sem métrica de hit, custo e risco de resposta obsoleta.

## Sequência recomendada

1. Suspender publicação automática Sprint 2 ou inserir gate mínimo de integridade.
2. Corrigir propagação de falhas no cron.
3. Corrigir canonicals, títulos e dimensões dos gráficos.
4. Restringir o rastreamento e a superfície da API de downloads.
5. Criar testes de contrato para publicação, catálogo e parsers.
6. Refatorar `gerar_datasets_json.py` para configuração declarativa.
7. Refatorar consolidação em inventário, normalização e adaptadores.
8. Centralizar parsing CSV e caminhos municipais.
9. Resolver gradualmente os demais hotspots de complexidade, começando pelos que escrevem em
   `data/public` ou consolidam dados.

## Critério de encerramento

- Nenhuma publicação promove arquivo sem validação e manifesto.
- Falha de coleta/publicação resulta em exit code não zero e alerta auditável.
- Gate de canonical retorna zero.
- Build não alerta por tracing amplo nem dimensão inválida.
- Módulos críticos possuem testes de contrato.
- Ruff não encontra chaves duplicadas.
- Complexidade dos cinco hotspots principais fica abaixo do limite definido pelo projeto.
