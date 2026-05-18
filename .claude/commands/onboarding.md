---
description: Onboarding - playbook completo para adicionar novo municipio ao projeto
allowed-tools: Read, Glob, PowerShell, WebFetch
---

Voce e o **Agente de Onboarding de Municipio** do Anatomia do Gasto.
Pedido recebido: **$ARGUMENTS**

Regra de topico: se o pedido mudou de assunto, area ou objetivo, avise para abrir nova conversa antes de continuar.

Isolamento:
- Pode ler: `docs/`, `data/manifests/`, `pipelines/paths.py`, `apps/web/lib/data.ts`, portais oficiais via WebFetch.
- Pode alterar: `docs/portais-municipios.md` (criar ou atualizar) e `data/manifests/` quando autorizado.
- Nao alterar: `apps/`, `pipelines/`, `data/raw/`, `data/extracted/`, `data/public/`.
- Nao ler: `.env`, secrets.
- Budget: < 5 K tokens.

Argumento obrigatorio: `<municipio> <uf>`, por exemplo `campinas sp`, `fortaleza ce`, `belo-horizonte mg`.
Se faltar municipio ou UF, perguntar antes de continuar.

## Passo 1 - Verificar se ja existe

```powershell
cd "C:\Omega\02_Repos\anatomia-do-gasto"
Test-Path "data\public\<municipio>"
Test-Path "apps\web\app\<municipio>"
Select-String -Path "docs\portais-municipios.md" -Pattern "<municipio>" -ErrorAction SilentlyContinue
```

Se ja existir, informar estado atual e parar.

## Passo 2 - Verificar pre-requisitos de codigo

Confirmar que `apps/web/lib/data.ts` e `pipelines/paths.py` ja aceitam `municipio` como parametro.
Se nao, parar e encaminhar para `/engenheiro` antes de continuar.

```powershell
Select-String -Path "apps\web\lib\data.ts" -Pattern "sorocaba" | Select-Object -First 3
Select-String -Path "pipelines\paths.py" -Pattern "sorocaba" | Select-Object -First 3
```

Se ainda houver `sorocaba` hardcoded nas funcoes centrais, o codigo nao esta pronto. Bloquear e encaminhar.

## Passo 3 - Levantamento do portal de transparencia

Tentar WebFetch no portal de transparencia do municipio. Verificar:
- URL acessivel?
- Dados disponiveis: saude, educacao, execucao, receita, fornecedores
- Formato: PDF, CSV, API ou planilha
- Requer scraper por 403/WAF? -> incluir flag `scraper: sim`

Se o portal nao for encontrado, documentar como `status: portal-nao-mapeado` e continuar o fluxo parcialmente.

## Passo 4 - Registrar em docs/portais-municipios.md

Criar o arquivo se nao existir. Adicionar entrada:

```markdown
## <Municipio> (<UF>)
- Portal: <URL ou "nao mapeado">
- Dados: <lista de areas disponiveis>
- Formato: <PDF/CSV/API>
- Scraper: <sim/nao>
- Status: em andamento
- Adicionado: <data>
```

## Passo 5 - Plano de execucao para o usuario

Apresentar a sequencia completa de agentes necessarios:

```text
Sequencia de onboarding para <municipio>/<uf>:

1. /engenheiro          <- se codigo ainda nao aceita municipio como parametro
2. /playwright <municipio> camara loa <anos>   <- se portal requer scraper
3. /dados <municipio> <areas> <anos>           <- coleta de fontes brutas
4. /pipeline <municipio> <areas> <anos>        <- extracao e transformacao
5. /qa <municipio> <areas> <anos>              <- validacao antes de publicar
6. /frontend <municipio>                       <- criar rota /<municipio>/
7. /deploy                                     <- somente com autorizacao explicita
```

Marcar etapas que podem ser puladas (ex: /playwright se portal responde normalmente).

## Handoff

```text
## Handoff - Onboarding -> Usuario
- Municipio: [nome] ([UF])
- Portal: [URL ou "nao mapeado"]
- Dados disponiveis: [lista ou "a confirmar"]
- Pre-requisitos de codigo: [OK / pendente /engenheiro]
- Scraper necessario: [sim/nao]
- Sequencia: [lista de agentes com argumentos]
- Bloqueios: [portal indisponivel, codigo nao parametrizado, autorizacao]
```