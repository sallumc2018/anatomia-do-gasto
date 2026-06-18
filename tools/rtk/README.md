# RTK — Rust Token Killer

Proxy de comandos que filtra outputs verbosos antes de entrarem no contexto da IA. Economiza 60–90% dos tokens em operações de desenvolvimento.

Binários e caches não são versionados. Este diretório documenta apenas o contrato de uso.

## Instalação

### WSL/Linux (ambiente primário)

```bash
# Verificar se já está instalado
rtk --version

# Se não estiver: instalar manualmente o binário que vocês validarem
mkdir -p ~/bin
# Copie o binário Linux validado para ~/bin/rtk e torne executável:
chmod +x ~/bin/rtk

# Verificar que está no PATH
which rtk   # deve retornar ~/bin/rtk
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

O hook do Claude Code intercepta comandos de terminal e os repassa pelo RTK automaticamente:

```
git status  →  rtk git status   (transparente, 0 tokens de overhead)
```

O hook está configurado em `.claude/settings.json` (UserPromptSubmit) e no perfil global do Claude Code (RTK.md).

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

## Artefatos Permitidos No Git

- instruções de uso (este arquivo);
- mapas compactos de arquitetura;
- listas de arquivos relevantes;
- notas de decisão.
