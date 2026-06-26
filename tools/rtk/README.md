# RTK — Rust Token Killer

Proxy de comandos que filtra outputs verbosos antes de entrarem no contexto da IA. Economiza 60–90% dos tokens em operações de desenvolvimento.

Binários e caches não são versionados. Este diretório documenta apenas o contrato de uso.

## Instalação

### WSL/Linux (ambiente primário)

```bash
# Verificar se já está instalado
rtk --version

# Se não estiver: instalar manualmente um binário previamente validado.
# O caminho pode variar; neste ambiente o local observado e ~/.local/bin/rtk.
mkdir -p ~/.local/bin
chmod +x ~/.local/bin/rtk

# Verificar que está no PATH
command -v rtk
rtk verify
rtk gain    # deve mostrar analytics de economia
```

⚠️ Esta documentação não fixa uma origem única de instalação. Validem o binário e a origem antes de padronizar qualquer fluxo automatizado.

### Windows

```powershell
# Estrutura esperada:
# C:/ferramentas/rtk/rtk.exe

# Verificar se está no PATH:
rtk --version

# Se não estiver no PATH, adicionar manualmente:
$env:PATH += ";C:/ferramentas/rtk"
```

## Como Funciona

O hook global nativo do Claude Code pode interceptar comandos de terminal e
repassa-los pelo RTK automaticamente:

```
git status  →  rtk git status   (transparente, 0 tokens de overhead)
```

Use `rtk verify` como fonte de verdade da integridade do hook. O arquivo
`.claude/settings.json` deste projeto apenas autoriza comandos RTK e configura
o RAG local; ele nao instala nem prova o hook global.

## Verificar Economia

```bash
rtk gain            # economia total acumulada
rtk gain --history  # histórico por comando
rtk discover        # oportunidades não aproveitadas no histórico do Claude Code
```

`rtk gain` ajuda a medir e auditar economia local, mas o registro versionado do projeto e o Markdown sanitizado em `memory/token-economy/YYYY-MM.md`. Nao versionar caches, bancos locais ou outputs brutos do RTK.

## Regras De Uso

1. Instalar o binário localmente em cada ambiente (WSL e Windows separados).
2. Não usar outputs do RTK como substituto de leitura de arquivos — RTK filtra, não interpreta.
3. Salvar apenas artefatos textuais pequenos e auditáveis quando úteis para sessões futuras.
4. Não versionar: `rtk.exe`, binários Linux, caches, bancos locais.
5. Para trabalhos substantivos, registrar uma entrada sanitizada em `memory/token-economy/YYYY-MM.md` quando houver economia auditavel.
6. `tools/setup_linux.sh` e somente diagnostico local: nao baixa binarios e nao
   instala dependencias.

## Artefatos Permitidos No Git

- instruções de uso (este arquivo);
- mapas compactos de arquitetura;
- listas de arquivos relevantes;
- notas de decisão.
