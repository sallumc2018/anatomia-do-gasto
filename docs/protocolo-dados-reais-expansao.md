# Protocolo De Dados Reais E Expansao Segura

Este protocolo define como a ONG expande municipio, area e tema sem trocar transparencia por volume. A regra central e simples: nada entra no site se nao for real, rastreavel, corrigivel e publicamente auditavel.

## O Que Conta Como Dado Real

Um dado so pode ser tratado como real quando todos os pontos abaixo forem verdadeiros:

1. vem de fonte oficial, primaria ou institucionalmente identificada;
2. tem municipio, orgao, area, periodo e escopo definidos;
3. preserva a diferenca entre valor zero, dado ausente e dado nao encontrado;
4. tem arquivo publico final em `data/public` ou lacuna registrada em manifest;
5. tem rastro em `data/manifests` suficiente para auditor externo refazer a verificacao;
6. nao depende de memoria de agente, prompt, conversa ou inferencia nao documentada.

## Estados Permitidos

| Estado | Uso | Pode aparecer no site? |
|---|---|---|
| `raw` | Evidencia primaria bruta | Nao |
| `extracted` | Saida mecanica de extrator | Nao |
| `validated` | Dado revisado localmente | Nao, ate promocao explicita |
| `public` | Dado publicado pela ONG | Sim |
| `gap` | Lacuna classificada | Sim, como ausencia/lacuna, nunca como zero |

## Classificacao De Lacunas

Toda lacuna deve usar uma categoria explicita:

- `ausente`: a fonte oficial existe, mas nao traz o dado esperado.
- `incompleto`: a fonte traz parte do dado, mas falta periodo, orgao, area ou campo essencial.
- `indisponivel`: a fonte oficial nao esta acessivel no momento da coleta.
- `nao_encontrado`: a busca foi feita e documentada, mas o dado nao foi localizado.
- `nao_aplicavel`: o dado nao se aplica ao municipio, orgao ou periodo.
- `pendente_lai`: depende de pedido LAI ou resposta oficial.

Nenhuma dessas categorias pode ser convertida em `0`.

## Campos Minimos Para Expansao

Antes de abrir um novo municipio ou area, deve existir registro em manifest com:

- `municipio`
- `uf`
- `area`
- `orgao`
- `periodo_inicio`
- `periodo_fim`
- `fonte_nome`
- `fonte_url`
- `status`
- `camada_atual`
- `arquivo_publico` ou `lacuna_categoria`
- `observacao`

Para publicacao em `data/public`, tambem sao obrigatorios os campos definidos em `docs/contrato-validacao-publicacao.md`.

## Cadencia Operacional

1. Inventariar fontes oficiais e registrar lacunas conhecidas.
2. Coletar fonte bruta sem publicar automaticamente.
3. Extrair para camada mecanica.
4. Validar localmente e registrar QA.
5. Promover para `data/public` apenas com autorizacao explicita.
6. Regenerar manifests derivados e datasets do site.
7. Publicar changelog ou nota metodologica quando houver mudanca relevante.

## Responsabilidades Por IA

| Ferramenta | Responsabilidade | Limite |
|---|---|---|
| Codex | Gates, scripts, refatoracao, validacao, manifests e automacao local | Nao publica nem faz deploy sem autorizacao |
| Claude Code | Metodologia, LAI/LGPD, narrativa cidadã, auditoria e decisoes editoriais | Nao executa deploy nem altera dados em massa sem gate |
| Antigravity | Execucao de pipeline, Playwright, Vercel e deploy autorizado | Nao define sozinho politica de publicacao |

## Criterio Para Novo Municipio

Um municipio novo so deve ser aberto quando:

- houver pelo menos uma fonte oficial identificada;
- existir linha de fila em `data/manifests/municipios_pipeline.csv`;
- a classificacao publica/privada estiver clara;
- houver plano de QA minimo;
- o site puder comunicar lacunas sem parecer falha ou acusacao.

## Criterio Para Publicacao

Antes de qualquer publicacao:

- `python tools/agents/check-commit-gate.py --staged`
- `python tools/agents/validate-area.py --area realdata`
- `python tools/agents/validate-area.py --area publish`

Se houver remocao de arquivo em `data/public`, a decisao deve estar documentada e o commit deve ser deliberado. O gate bloqueia delecoes por padrao.

## Correcao De Erros

Quando um dado publicado estiver errado:

1. registrar o problema em doc, issue ou memoria publica sanitizada;
2. corrigir o CSV ou marcar lacuna;
3. atualizar manifest e validacao;
4. manter rastro da correcao em `memory/provenance/changes.csv`;
5. publicar nota de correcao quando o erro afetar leitura cidadã.
