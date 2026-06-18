# Security guidance — Anatomia do Gasto

## Dados sensíveis

- Nunca logar CPF, RG, número de documento ou `account_number` em qualquer nível de log.
- Credenciais de API (ex: `PORTAL_TRANSPARENCIA_KEY`, `ANTHROPIC_API_KEY`) nunca devem aparecer hardcoded em código, logs ou strings de erro.
- Tokens OAuth e chaves de acesso devem ser lidos apenas de variáveis de ambiente.

## Pipelines de dados

- Dados lidos de portais externos (CSV, JSON, PDF) são não-confiáveis. Sempre validar schema antes de processar.
- Nunca usar `pickle`, `yaml.load()` ou `eval()` em dados vindos de APIs governamentais.
- Evitar `subprocess.run(..., shell=True)` com parâmetros derivados de nomes de arquivo ou URLs externas.
- Chamadas a `os.system()` são proibidas — usar `subprocess.run([...])` com lista de argumentos.

## Frontend Next.js

- Nunca usar `dangerouslySetInnerHTML` com dados vindos de arquivos CSV ou APIs.
- Dados monetários e textos de fontes externas devem ser escapados antes de renderizar.
- Rotas de API (`/api/*`) não precisam de autenticação (dados são públicos), mas devem validar parâmetros de entrada (ano, município, área) contra listas de valores permitidos antes de acessar o filesystem.

## Filesystem

- Caminhos de arquivo construídos com parâmetros externos devem ser validados com `os.path.abspath()` para prevenir path traversal.
- Dados publicados ficam apenas em `data/public/` — nunca expor `data/raw/` ou `data/extracted/` via API ou frontend.

## Dependências

- npm install está bloqueado neste projeto por política de segurança (worm ativo em mai/2026).
- pip install de novos pacotes deve ser avaliado cuidadosamente antes de executar.
