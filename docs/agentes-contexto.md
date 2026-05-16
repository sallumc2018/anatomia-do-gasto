# Agentes e Economia de Contexto

> Referenciado por `CLAUDE.md` e `ORQUESTRADOR.md`. Leia este arquivo em vez de re-ler o orquestrador inteiro.

Este guia define como dividir trabalho entre agentes sem gastar contexto lendo arquivos irrelevantes.

## Principio

O orquestrador deve criar ou acionar subagentes apenas quando a tarefa puder ser isolada por funcao, arquivos e validacao. Um subagente nunca deve receber historico completo da conversa se um objetivo, paths e trechos rastreaveis bastarem.

Cada topico deve ter sua propria conversa. Quando o usuario mudar de assunto, area ou objetivo de trabalho, o agente deve avisar: "Este e um novo topico; abra uma nova conversa para economizar contexto." So continuar na conversa atual se o usuario confirmar que quer seguir mesmo assim.

## Gatilho Padrao Do Orquestrador

Quando o usuario disser algo como **"Chame o orquestrador, preciso completar os dados faltantes agora"**, Codex e Claude devem tratar isso como pedido composto de dados e executar o roteamento abaixo com contexto minimo.

Objetivo padrao: identificar lacunas em `data/public` e `data/manifests`, completar fontes oficiais ausentes, extrair para `data/extracted`, validar localmente e preparar handoff. Publicacao em `data/public`, commit, push e deploy continuam exigindo autorizacao explicita.

Fluxo padrao:

1. `orquestrador`: classifica area/anos faltantes e monta pacotes pequenos por agente.
2. `dados`: confere inventario e baixa fontes oficiais ausentes para `data/raw`.
3. `pipeline`: processa as fontes baixadas para `data/extracted` e, quando autorizado, usa `data/validated` como etapa local de validacao.
4. `analista`: le apenas `data/public` para apontar lacunas publicadas e impactos de leitura cidada.
5. `frontend`: so entra se a mudanca exigir pagina, componente ou loader do site.
6. `deploy`: so entra depois de autorizacao explicita para commit/push/deploy.

Pacote minimo para esse gatilho:

```text
Agente: <dados|pipeline|analista|frontend|deploy>
Objetivo: completar dados faltantes de <area> <anos>
Pode ler: paths estritamente necessarios
Pode alterar: somente o destino normal do agente
Nao ler: secrets, .env, historico de conversa e dados fora do escopo
Validacao: comando/check especifico do agente
Resposta: Achados, Mudancas, Validacao, Bloqueios
```

## Pacote Minimo De Tarefa

Todo subagente deve receber:

1. objetivo especifico;
2. tipo de agente;
3. arquivos ou diretorios que pode ler;
4. arquivos ou diretorios que pode alterar;
5. dados que nao pode ler;
6. validacao esperada;
7. formato curto de resposta.

Modelo:

```text
Agente: <frontend|pipeline|dados|analista|seguranca|tablet|engenheiro|deploy>
Objetivo: <resultado verificavel>
Pode ler: <paths exatos>
Pode alterar: <paths exatos ou "nenhum">
Nao ler: <secrets, data/raw, data/extracted, data/validated, etc. quando nao pertinentes>
Validacao: <comando ou checagem>
Resposta: achados, arquivos tocados, validacao, bloqueios
```

## Funcoes

| Agente | Leitura normal | Escrita normal | Validacao |
|---|---|---|---|
| `frontend` | `apps/web`, docs de UI, `data/public` necessario | `apps/web` | `npm run lint`, `npm run build`, checagem local de rotas |
| `pipeline` | `pipelines`, paths de entrada, manifest relevante | `pipelines`, `data/extracted`, `data/validated` quando autorizado | `python -m py_compile`, teste especifico |
| `dados` | fonte oficial, manifest de coleta, destino operacional | `data/raw`, manifest de fontes | conferencia de download e checksum quando houver |
| `analista` | `data/public`, docs de metodologia, manifest publico | docs ou texto analitico autorizado | checagem de fonte, escopo e periodo |
| `seguranca` | `.gitignore`, `CLAUDE.md`, docs de seguranca, `tools/security` | docs e scripts de seguranca | `check-site-local.ps1`, triagem supply-chain |
| `tablet` | `tools/tablet`, `docs/ambiente.md`, `docs/seguranca.md` | `tools/tablet`, docs relacionadas | checagem ADB/SSH quando autorizada |
| `engenheiro` | paths afetados pela refatoracao, `CODEX.md`, `ORQUESTRADOR.md` | escopo explicitamente definido | testes do modulo alterado |
| `deploy` | estado de build e autorizacao humana | nenhum por padrao | build local, depois autorizacao para push/deploy |

## Regras De Isolamento

- `frontend` nao le `data/raw`, `data/extracted` ou `data/validated`.
- `analista` trabalha com `data/public` e manifests; nao usa dado interno como fato publicado.
- `pipeline` pode citar `data/raw`, `data/extracted` e `data/validated`, mas nao publica para `data/public` sem decisao explicita.
- `dados` nao recebe conteudo bruto de PDFs quando nome, URL, path e checksum bastarem.
- `seguranca` nunca recebe secrets; valida nomes, paths e regras.
- `tablet` nao recebe chaves, tokens, fingerprints privados ou dumps pessoais.
- `deploy` exige autorizacao explicita antes de commit, push ou Vercel.

## Budget de Tokens por Agente

Metas a respeitar. Se a tarefa exigir mais, avisar o usuário antes de continuar.

| Agente         | Budget alvo  | Motivo                                      |
|----------------|-------------|---------------------------------------------|
| `orquestrador` | < 500 tok   | Só classifica e despacha — não executa      |
| `dados`        | < 3 K tok   | Checa arquivos + portal, sem análise        |
| `pipeline`     | < 5 K tok   | Roda script, lê output, reporta             |
| `analista`     | < 8 K tok   | Lê ~3 CSVs, calcula, formata relatório      |
| `frontend`     | < 12 K tok  | Código mais complexo, múltiplos arquivos    |
| `deploy`       | < 2 K tok   | Só comandos — nada de conteúdo de arquivo   |
| `engenheiro`   | por tarefa  | Escopo autorizado explicitamente            |
| `tablet`       | < 2 K tok   | Só scripts, sem dados                       |
| `seguranca`    | < 3 K tok   | Logs e status, sem dados do projeto         |

## Paralelismo entre Agentes

Permitido:
- `analista` + `frontend` (leem fontes distintas)
- `dados` para múltiplas áreas/anos simultaneamente
- `tablet` + qualquer outro (ambiente separado)

Proibido:
- `pipeline` + `analista` (pipeline escreve o que analista leria)
- `deploy` + qualquer outro (gate de publicação)
- `engenheiro` + `frontend` (podem editar os mesmos arquivos)

## Protocolo de Handoff

Todo agente que conclui emite:

```
## Handoff — [NomeAgente] → [ProximoAgente ou Usuário]
- **Feito:** [resumo em 1-2 linhas]
- **Saída:** [paths gerados ou alterados]
- **Pendente:** [o que precisa de validação ou autorização]
- **Próximo passo:** [/slash-command argumento OU ação do usuário]
```

## Quando Criar Subagente

Criar subagente quando:

- duas trilhas independentes podem andar em paralelo;
- a tarefa tem fronteira clara de arquivos;
- a resposta esperada cabe em resumo curto;
- o subagente nao precisa do historico completo.

Nao criar subagente quando:

- a proxima acao depende diretamente da resposta dele;
- a tarefa e pequena e local;
- o custo de explicar o contexto e maior que executar;
- ha risco de conflito em arquivos ja alterados por outro agente.

## Resposta Esperada

Cada subagente deve responder em no máximo quatro blocos:

- `Achados`: problemas ou confirmações relevantes.
- `Mudanças`: arquivos alterados, se houver.
- `Validação`: comando rodado e resultado.
- `Bloqueios`: autorização ou ambiente faltante.

Não incluir narrativa longa, histórico de conversa, logs extensos ou conteúdo de dados sensíveis.

## Verificação de Economia de Token

Quando solicitado ("quanto economizamos?"), responder com estimativa auditável:
- Arquivos evitados: [lista]
- Trechos não relidos: [quantos, de qual arquivo]
- Redução estimada: [faixa qualitativa — ex: "~40-60% menos contexto que re-ler arquitetura completa"]

Nunca inventar número exato. Sempre baseado em evidência verificável.
