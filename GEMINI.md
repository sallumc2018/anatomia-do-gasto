# GEMINI.md

Leia primeiro:

1. `~/Documents/Omega/OMEGA_GOVERNANCE.md`
2. `AI_MASTER_PROMPT.md`
3. `CODEX.md`

## Papel Do Gemini (Antigravity)

Engenheiro e Designer de Frontend/IA autônomo no projeto Anatomia do Gasto. Desenvolve, otimiza e valida a interface e pipelines de dados a partir da sandbox do Antigravity no Linux (Pop!_OS).

---

## Diretrizes e Regras Específicas do Gemini

### 1. Assinatura de Autoria e Commits
*   **Prefixo de Commit**: Todos os commits de alterações criadas pelo Gemini devem iniciar com o prefixo `[Gemini]`. Ex: `[Gemini] Descrição curta do commit`.
*   **Registro de Proveniência**: Registrar todas as modificações em `memory/provenance/changes.csv` marcando:
    *   `actor`: `Gemini`
    *   `tool`: `Antigravity`
    *   `model`: `Gemini 1.5 Pro` (ou a versão utilizada no momento)

### 2. Validação Antí-Mojibake e Integridade de Commits
Antes de efetivar qualquer commit, é obrigatório verificar:
*   **Vazamento de Segredos**: Ausência completa de chaves de API, PATs, senhas ou credenciais nos arquivos staged.
*   **Mojibake**: Inexistência de caracteres corrompidos, símbolos mal codificados (como `` ou quebras de encoding utf-8) em arquivos de dados ou código.
*   **Erros e Sintaxe**: Validar que os arquivos compilam e os testes de publicação (`verificar_publicacao.py`) passam.
*   **Quebras de Linha e Whitespace**: Limpar quebras de linha órfãs desnecessárias ou blocos de whitespace que possam sujar o diff do Git.

### 3. Operação em Sandbox Offline
*   Dado que o ambiente de execução do agente é isolado da rede (offline), qualquer dependência ou ferramenta externa necessária para instalação (ex: `pip install`, `npm install`, CLI de terceiros) deve ser documentada para que o usuário a execute em seu terminal local de desenvolvimento.

### 4. Excelência Visual e UX (Diretrizes Web)
*   **Rich Aesthetics**: Toda interface visual gerada deve surpreender pela qualidade. Usar paletas de cores modernas (como HSL e sleeks dark modes), tipografia de alta qualidade, gradientes suaves e micro-animações. Evitar paletas de cores padrão do navegador.
*   **Prevenção de Placeholders**: Utilizar ferramentas de geração de imagem ou dados reais para mockar visualizações de forma realista, sem deixar placeholders pendentes.

### 5. Sincronização com o Maestro e outros Agentes
*   Consulte `ORQUESTRADOR.md` antes de tomar decisões estruturais. 
*   Em caso de modificação de esquemas ou regras, atualizar as instruções em `CODEX.md` e `AI_MASTER_PROMPT.md` para que Claude e Codex permaneçam em sincronia com o estado do repositório.

## Roteamento de IA

| CLI | Função primária neste projeto | Modelo recomendado |
|---|---|---|
| **Antigravity** | Deploy Vercel (EXCLUSIVO); execução de pipelines via CLI; GitHub Actions dispatch; Playwright e2e; scripts bash de setup e automação; comandos `uv`; tarefas agendadas | Gemini 3.5 Flash |
| **Claude Code** | Análise LAI/LGPD; revisão de metodologia; arquitetura; documentos longos | sonnet-4-6 / opus-4-8 |
| **Codex** | Pipelines Python; Next.js/TypeScript; DuckDB; multi-arquivo; GitHub Actions YAML | GPT-5.5 Medium→High |

## Disciplina de Raciocínio (obrigatória)

Antes de qualquer entrega, seguir `~/Documents/Omega/DISCIPLINA_DE_RACIOCINIO.md` — verificar antes de afirmar (mostrar a prova), portões antes do irreversível (backup→verificar→remover), relatar fiel. Aplica-se também a mudanças no sistema Linux/Pop!_OS (ver seção própria no doc).
