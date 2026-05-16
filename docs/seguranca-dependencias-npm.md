# Seguranca de dependencias npm

Este runbook foi criado em resposta a onda Mini Shai-Hulud divulgada em maio de 2026, com foco em ataques de supply chain contra npm, PyPI e GitHub Actions.

## Risco atual

A campanha Mini Shai-Hulud comprometeu pacotes legitimos e usou instalacoes de dependencias como ponto de execucao. Relatorios publicos de Aikido, Socket, Wiz e BleepingComputer descrevem:

- pacotes npm/PyPI publicados por pipelines aparentemente legitimos;
- abuso de GitHub Actions, cache poisoning, OIDC e trusted publishing;
- execucao por hooks como `prepare` e `preinstall`;
- roubo de tokens GitHub, npm, cloud, Kubernetes, Vault, SSH e arquivos `.env`;
- persistencia em diretorios como `.claude/` e `.vscode/`;
- rotinas destrutivas em alguns cenarios.

## Politica local temporaria

Enquanto a campanha estiver ativa:

1. Nao rodar `npm install`, `npm update`, `npm audit fix`, `npx` ou scripts de pacote sem autorizacao explicita.
2. Preferir leitura de `package.json` e `package-lock.json` antes de qualquer instalacao.
3. Se for indispensavel instalar dependencias, usar primeiro instalacao sem scripts:

```powershell
cd apps\web
npm.cmd ci --ignore-scripts
```

4. So rodar `npm.cmd rebuild`, `npm.cmd run build`, `npm.cmd run lint` ou scripts equivalentes depois de revisar dependencias e obter autorizacao.
5. Nao adicionar novas dependencias durante resposta a incidente.
6. Nao configurar GitHub Actions, npm publishing, OIDC ou secrets sem decisao humana.

## Primeira triagem para Claude

Executar somente comandos read-only:

```powershell
git status --short --branch
rg -n "tanstack|mistral|uipath|opensearch|guardrails|squawk|postinstall|preinstall|prepare" apps\web\package.json apps\web\package-lock.json
rg -n "pull_request_target|actions/cache|id-token|npm publish|trusted|setup-node|SHA1HULUD|Shai-Hulud|shai-hulud" .
powershell -ExecutionPolicy Bypass -File tools\security\check-npm-supply-chain.ps1
```

Se qualquer indicador aparecer, parar e reportar antes de instalar ou rodar scripts.

## Resultado local em 2026-05-14

Triagem inicial read-only feita em 2026-05-14:

- o repositorio estava limpo em `main...origin/main`;
- nao havia diretorio `.github` no repositorio;
- `package.json` e `package-lock.json` nao tinham referencias diretas aos namespaces mais citados da onda atual (`@tanstack`, `@mistralai`, `@uipath`, `@opensearch-project`, `guardrails`, `@squawk`);
- apareceu apenas `napi-postinstall` como dependencia transitiva no lockfile; isso nao e, por si so, indicador da campanha, mas reforca que instalacao deve ser feita com cautela.

## O que fazer se houver suspeita de exposicao

1. Nao revogar tokens antes de verificar persistencia local quando houver suspeita forte de Mini Shai-Hulud, pois alguns relatorios descrevem rotinas destrutivas ligadas a revogacao.
2. Procurar por `router_init.js`, `router_runtime.js`, `setup.mjs`, `gh-token-monitor`, `SHA1HULUD`, `Shai-Hulud` e workflows inesperados.
3. Auditar `.claude/` e `.vscode/` do projeto antes de executar ferramentas de agente.
4. Se houve instalacao de pacote afetado, considerar credenciais expostas e planejar rotacao: npm, GitHub, cloud, Vault, Kubernetes e CI/CD.
5. So depois da contencao local, limpar `node_modules` e reinstalar com lockfile conhecido e scripts bloqueados.

## Fontes de referencia

- Aikido: Mini Shai-Hulud Is Back, 2026-05-12.
- Socket: TanStack npm Packages Compromised, 2026-05-11.
- Wiz: Mini Shai-Hulud Strikes Again, 2026-05-12.
- BleepingComputer: Shai Hulud attack ships signed malicious TanStack, Mistral npm packages, 2026-05-12.
