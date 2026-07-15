# Handoff: Instalar Obsidian MCP no Codex Desktop
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Codex Desktop
**Prioridade:** baixa (melhoria de ecossistema, não blocker)

---

## Contexto

O `mcp-server-obsidian` foi instalado via `uv` e configurado no Claude Desktop.
O Obsidian Vault de NeoLogos fica no host Windows. Use a variável
`NEOLOGOS_VAULT` para informar o caminho local desse host.

O objetivo é que o Codex também acesse o Vault via MCP nativo (busca semântica,
leitura de notas, criação de páginas) — além do filesystem cru que o Claude já tem.

---

## O que foi feito no Claude Desktop

```json
// claude_desktop_config.json — entrada adicionada:
"obsidian": {
  "command": "C:\\Users\\user\\AppData\\Local\\Microsoft\\WinGet\\Links\\uv.exe",
  "args": [
    "tool", "run", "mcp-server-obsidian",
    "--vault", "${NEOLOGOS_VAULT}"
  ]
}
```

O servidor já está instalado globalmente via uv:
```
uv tool install mcp-server-obsidian  # já feito, não repetir
```

---

## O que o Codex precisa fazer

1. **Localizar o arquivo de config MCP do Codex Desktop**
   Provavelmente em um destes paths:
   - `C:\Users\user\.codex\mcp.json`
   - `C:\Users\user\AppData\Roaming\Codex\config.json`
   - Verificar na UI do Codex: Settings → MCP ou Extensions

2. **Adicionar a entrada do obsidian MCP** (mesma config do Claude):
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "C:\\Users\\user\\AppData\\Local\\Microsoft\\WinGet\\Links\\uv.exe",
         "args": [
           "tool", "run", "mcp-server-obsidian",
           "--vault", "${NEOLOGOS_VAULT}"
         ]
       }
     }
   }
   ```

3. **Verificar conexão**: o servidor expõe ferramentas de busca por tags, backlinks
   e leitura de notas. Testar com uma nota conhecida do Vault.

---

## Restrições
- **NÃO rodar `npm install`** — worm ativo (mai/2026). Usar apenas `uv`.
- O `uv.exe` está em `C:\Users\user\AppData\Local\Microsoft\WinGet\Links\uv.exe` (path completo, não depende de PATH).
- O mcp-server-obsidian já está instalado. Não reinstalar.
