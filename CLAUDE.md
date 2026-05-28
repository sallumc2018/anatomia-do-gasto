# CLAUDE.md - Anatomia do Gasto

Voce esta em um repositorio publico.

## Funcao

Este repositorio contem o codigo e a documentacao publica do site Anatomia do Gasto.

## Natureza

Publico. Tudo que for commitado aqui deve poder ser publicado.

## Proibicoes absolutas

Nunca commitar:

- senhas;
- tokens;
- cookies;
- chaves privadas;
- recovery codes;
- codigos 2FA;
- arquivos .env;
- conteudo de credenciais;
- prints sensiveis;
- memoria operacional privada;
- prompts internos privados;
- arquivos pessoais.

## Regras de dados

- Dado ausente nao e zero.
- Todo dado publico precisa de fonte.
- Periodo, escopo e metodologia devem ser claros.
- Nao forcar causalidade.
- Nao transformar inferencia em fato.
- Nao usar nomes reais em dados ficticios.
- Mock deve ser explicitamente marcado como ficticio.
- Nao publicar estatistica sem fonte.
- PDFs grandes do acervo bruto devem permanecer fora de `C:\Omega`, preferencialmente em `G:\Meu Drive\Omega-data\raw`; use `ANATOMIA_RAW_ROOT=G:\Meu Drive\Omega-data\raw` para apontar o pipeline para esse acervo externo.

## Fluxo obrigatorio

Antes de alterar:

git status -sb

Antes de instalar dependencias npm ou rodar scripts que possam disparar lifecycle hooks, leia `docs/seguranca-dependencias-npm.md`. Durante a campanha Mini Shai-Hulud, nao rode `npm install`, `npm update`, `npm audit fix`, `npx` ou scripts de pacote sem autorizacao explicita; comece por triagem read-only do `package-lock.json`.

Depois de alterar:

git status -sb
git log --oneline -5

## Edicao concorrente (Claude + Codex)

Quando Claude e Codex estiverem ativos ao mesmo tempo, o risco real e editar o mesmo arquivo sem que um saiba do outro. O `git status` antes de editar mitiga, mas nao previne totalmente.

Protocolo:
- Antes de qualquer escrita, verifique `git status -sb` e leia o timestamp dos arquivos alvo.
- Se um arquivo tiver modificacao recente nao commitada e voce nao foi quem fez, pare e informe antes de escrever.
- Nunca faca commit silencioso quando o working tree ja tiver mudancas: descreva o que e seu e o que nao e.
- Em caso de conflito real, prefira `git stash` ou branch temporaria em vez de sobrescrever.

## Separacao de contexto

Nao trazer para este repositorio conteudo privado, credenciais, registros operacionais internos ou arquivos pessoais.

Antes de trabalhos substantivos, opere em economia de contexto/token: localize fontes com `rg` ou comando seletivo, abra apenas os arquivos e trechos necessarios, evite reler documentacao ja estabilizada e consolide comandos quando isso nao esconder evidencia relevante.

Para iniciar um topico substantivo com contexto minimo, rode:

```powershell
python tools/agents/start-topic.py "<objetivo>" --rag-limit 3
```

Para objetivos amplos ou reutilizaveis, `/goal` e um slash command/protocolo local, nao uma skill. Use-o para definir objetivo verificavel, nao-objetivos, gates, rota inicial, pacote minimo, validacao e sinal de aprendizado antes do Maestro rotear.

Registre falhas, erros, barreiras e correcoes reutilizaveis em `memory/knowledge/problems.csv` e `memory/knowledge/solutions.csv`, sempre como conteudo publico e sanitizado.

Registre toda alteracao em `memory/provenance/changes.csv` com actor/agente, ferramenta, modelo ou familia de modelo, ambiente, escopo, paths alterados, resumo, validacao e privacidade. Para trabalho sensivel ou operacional, registre apenas resumo publico sanitizado e mantenha detalhes fora do Git em `.local/memory/`.

Ao usar agentes ou subagentes, siga `docs/agentes-contexto.md`: envie apenas objetivo, paths permitidos, proibicoes, validacao esperada e formato curto de resposta. Nao repasse historico completo quando diff, trecho ou resumo rastreavel bastar.

Para contexto ja documentado, use a memoria publica em `memory/` via `tools/memory/query-rag.py` quando isso reduzir contexto. RAG e auxiliar: antes de editar, publicar dados, rodar pipeline, fazer deploy ou mexer em infraestrutura, leia diretamente os arquivos relevantes. Handoffs publicos reutilizaveis ficam em `memory/handoffs/YYYY-MM/`; handoffs locais ou sensiveis ficam em `.local/memory/handoffs/YYYY-MM/`.

Quando houver economia auditavel e o conteudo for publico/sanitizado, registre em `memory/token-economy/YYYY-MM.md`: data, agente/ferramenta, escopo, arquivos consultados, arquivos ou trechos evitados, comandos consolidados, estimativa em faixa ou qualitativa e observacao de privacidade. Nunca registre prompts privados, conversa completa, secrets ou dados nao publicados.

Trabalho substantivo e qualquer tarefa com multiplos arquivos, validacao local, analise de dados, mudanca de regra/documentacao, subagente, investigacao, pipeline, frontend, deploy, seguranca ou decisao reutilizavel. Ao finalizar, inclua rodape: `Fim de trabalho substantivo: sim`; `Handoff recomendado: sim/nao - motivo curto`; `Modelo: adequado/recomendar troca - motivo curto`; `Proveniencia: <id ou local>`; `Economia de contexto: baixa/media/alta; base auditavel; estimativa em faixa ou qualitativa`.

Essa regra e portavel para qualquer projeto. Quando nao houver `memory/token-economy/`, registre a economia no mecanismo equivalente do projeto, no handoff, ou apenas no rodape da resposta.

Protocolo de modelo: use a menor capacidade suficiente. Recomende `/model` para modelo forte quando a tarefa exigir arquitetura, refatoracao ampla, bugs ambiguos, seguranca, dados sensiveis/metodologicos, decisoes permanentes ou conflitos. Recomende modelo economico/rapido para triagem, leitura seletiva, comandos simples, diffs pequenos e documentacao objetiva. Nao troque silenciosamente o modelo principal salvo API segura da plataforma; quando houver subagentes com modelo/tier explicito, roteie subtarefas isoladas para o modelo adequado.

Ao alterar memoria, agentes, handoffs ou RAG, rode:

```powershell
python -m compileall -q tools/memory
python -m compileall -q tools/agents
python tools/memory/audit-memory-scope.py
python tools/memory/validate-knowledge-base.py
python tools/memory/validate-provenance-log.py
python tools/memory/build-rag-index.py --check
python tools/memory/write-token-economy.py --check
python tools/memory/write-provenance.py --check
python tools/agents/validate-agent-contracts.py
python tools/agents/validate-maestro-learning.py
python tools/agents/check-scope-gates.py
```

Para validacao consolidada por area, use `python tools/agents/validate-area.py --area memory|agents|scope|pipeline|frontend|publication`.

Se o usuario disser "Chame o maestro, preciso completar os dados faltantes agora", acione o fluxo composto `/frontino status -> dados -> pipeline -> qa -> vitruvio? -> deploy?` descrito em `docs/agentes-contexto.md` e `.claude/commands/maestro.md`.

Cada topico deve ter sua propria conversa. Se o usuario mudar de assunto, area ou objetivo, avise para abrir uma nova conversa antes de continuar.
