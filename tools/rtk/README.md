# RTK

O RTK deve economizar contexto em qualquer sessão de desenvolvimento, seja no Windows ou no WSL/Linux.

Este diretório documenta o contrato de uso. Binários e caches não devem ser versionados.

## Regra De Uso

1. Instale o RTK localmente no ambiente em uso.
2. Gere índices/resumos apontando para a raiz do repositório.
3. Salve apenas saídas textuais pequenas e auditáveis quando elas forem úteis para sessões futuras.
4. Não use resumos do RTK como substituto de validação: antes de alterar código, leia os arquivos relevantes.

## Estrutura Recomendada Local

Windows:

```powershell
C:\ferramentas\rtk\rtk.exe
```

WSL/Linux:

```bash
~/bin/rtk
```

## Artefatos Permitidos No Git

- instruções de uso;
- mapas compactos de arquitetura;
- listas de arquivos relevantes;
- notas de decisão.

## Artefatos Proibidos No Git

- `rtk.exe`;
- binários Linux;
- caches;
- bancos locais;
- dumps grandes.
