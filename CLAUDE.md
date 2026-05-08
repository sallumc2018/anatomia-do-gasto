# Anatomia do Gasto — contexto para Claude Code

Leia primeiro `AI_MASTER_PROMPT.md`.

## Papel Do Claude Code

Assistente interativo de desenvolvimento local. Executa tarefas no terminal, lê e edita arquivos, e aciona subagentes especializados via skills. É o ponto de entrada padrão para tarefas interativas, validação local e análise iterativa.

Codex pode estar trabalhando em paralelo. Antes de editar qualquer arquivo, verificar o estado atual do repositório para não sobrescrever trabalho em andamento.

## Economia De Contexto E Token

Claude Code deve operar com contexto mínimo por padrão:

- ler apenas arquivos e trechos necessários para a tarefa atual;
- antes de ler um arquivo grande, usar `Grep` para localizar símbolo, seção ou caminho relevante e então ler só o trecho necessário com `offset` + `limit`;
- arquivos com mais de 150 linhas não devem ser lidos integralmente por padrão; só fazer isso quando a tarefa exigir compreensão da estrutura completa;
- preferir `git diff`, `rg`, `head`, `tail` e leituras parciais a `Get-Content` integral de arquivos longos;
- evitar reler documentação já estabilizada no mesmo fluxo;
- usar RTK quando isso reduzir contexto sem esconder fatos relevantes;
- não repetir no chat conteúdo já registrado no repositório;
- agrupar validações quando isso reduzir rodadas sem sacrificar o diagnóstico; quando a falha precisar ficar legível, preferir chamadas separadas ou paralelas em vez de uma única linha encadeada;
- se houver ambiguidade metodológica, risco institucional ou divergência de fonte, ampliar a leitura e a validação mesmo que isso consuma mais contexto; economia de token nunca substitui rigor.

Quando o usuário pedir quanto foi reduzido:

- não inventar contagem exata de token se a ferramenta não expuser esse número;
- responder com estimativa auditável baseada em:
  - arquivos que deixaram de ser relidos;
  - trechos que foram lidos parcialmente;
  - comandos consolidados;
  - contexto reaproveitado por referência em vez de repetição;
- explicitar se a redução foi baixa, média ou alta, e estimar percentualmente quando houver base razoável.

## Skills Disponíveis

| Comando | Responsabilidade | Ambiente preferido |
|---|---|---|
| `/orquestrador` | Analisa o pedido e roteia para o subagente correto | qualquer |
| `/iniciar` | Inicializa e verifica todos os ambientes (WSL, Windows, tablet) | qualquer |
| `/dados` | Verifica e baixa novos PDFs do portal | WSL / Windows |
| `/pipeline` | Processa PDFs em CSV/JSON | WSL (primário) |
| `/analista` | Analisa despesas com linguagem cidadã | WSL / Windows |
| `/frontend` | Sobe servidor Next.js local | WSL (primário) |
| `/deploy` | Faz build e publica na Vercel | WSL / Windows |
| `/tablet` | Sincroniza e monitora o tablet Android via ADB | Windows |

## Regras De Frontend

- Stack: Next.js + TypeScript + Recharts.
- Não importar módulos `fs`/`path` em componentes `"use client"`.
- `apps/web/lib/data.ts` lê CSVs de `data/public`.
- `apps/web/lib/auditoria.ts` lê dados de auditoria de `data/public`.

## Servidor De Desenvolvimento

Windows:
```powershell
cd "C:\projetos\anatomia-do-gasto\apps\web"
npm.cmd run dev
```

WSL/Linux:
```bash
cd ~/projetos/anatomia-do-gasto/apps/web
npm run dev
```
