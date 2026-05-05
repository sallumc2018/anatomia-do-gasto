# Arquitetura do Anatomia do Gasto

## Visão Geral

O projeto segue o modelo de três câmaras, com pipeline de dados desacoplado do frontend.

```
┌─────────────────────────────────────────────────────────┐
│ FONTES DE DADOS                                         │
│ Portal da Transparência · APIs federais · LAI · ONGs    │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│ CÂMARA 1 — CURADORIA DE DADOS                           │
│ Scripts Python (pdfplumber, pandas)                     │
│ Download → Extração → Verificação → CSV/JSON            │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│ ARMAZENAMENTO                                           │
│ frontend/data/ (CSVs versionados)                       │
│ sorocaba/ (PDFs brutos, intermediários)                 │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js + Vercel)                             │
│ Server Components · Recharts · Tailwind CSS             │
│ anatomiadogasto.ong.br                                  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│ USUÁRIO FINAL                                           │
│ Cidadão · Jornalista · Pesquisador · Órgão de controle  │
└─────────────────────────────────────────────────────────┘
```


## Stack Tecnológica

### Backend (extração de dados)

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Linguagem | Python 3.12+ | Ecossistema maduro para ETL e análise de dados |
| Extração de PDFs | pdfplumber | Melhor precisão em PDFs com tabelas, suporte a texto RTL |
| Manipulação de dados | pandas | Padrão para ETL tabular |
| Scraping | requests | Leve, sem dependência de navegador |
| Agendamento | GitHub Actions | Gratuito para repositórios públicos (2000 min/mês) |

### Frontend

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components reduzem JS no cliente, build estático, deploy fácil |
| Visualizações | Recharts | Biblioteca React madura, gráficos responsivos, sem dependência de D3 direto |
| Estilo | Tailwind CSS | Produtividade, sem CSS global acumulado |
| Hospedagem | Vercel | Gratuito para projetos pessoais, deploy automático com Git, domínio customizado |
| Domínio | Registro.br | `.ong.br` reforça natureza sem fins lucrativos |

## Fluxo de Dados Detalhado

```
Portal de Transparência (PDFs)
│
▼

scripts/pipeline.py
├── baixar_pdfs.py ← download dos PDFs
├── extrator_saude.py ← extrai tabelas do PDF de saúde
├── extrator_educacao.py ← extrai tabelas do PDF de educação
├── extrator_rreo.py ← extrai RREO (saúde)
├── extrator_universal.py ← extrator genérico para novos setores
└── testes/verificar_dados.py ← checagem de integridade (96/96)
│
▼

frontend/data/{area}/saida/*.csv
│
▼

frontend/lib/data.ts (Server Component)
└── Lê CSVs com fs/path (runtime Node.js, sem fetch no cliente)
│
▼

frontend/app/{area}/page.tsx
└── Renderiza gráficos com Recharts + Tailwind
│
▼

Vercel (build estático + server components)
└── anatomiadogasto.ong.br
```


## Estrutura de Pastas

```
anatomia-do-gasto/
├── docs/ ← documentação
│ ├── auditoria/ ← trilha de auditoria (agentes políticos)
│ └── arquitetura.md ← este arquivo
├── frontend/ ← site Next.js
│ ├── app/ ← rotas (pages)
│ ├── components/ ← React (charts, layout, ui)
│ ├── data/ ← CSVs consumidos pelo site
│ └── lib/ ← leitura de dados, tipos
├── scripts/ ← pipeline Python
│ └── testes/ ← verificação de integridade
├── sorocaba/ ← PDFs brutos e saídas do pipeline
│ ├── saude/
│ └── educacao/
├── CLAUDE.md ← instruções para Claude Code
├── CONTRIBUTING.md ← guia de contribuição
├── CODE_OF_CONDUCT.md ← código de conduta
├── GOVERNANCE.md ← governança do projeto
├── LICENSE ← MIT
├── LIMITACOES.md ← limitações e escopo
├── README.md ← visão geral
└── requirements.txt ← dependências Python
```


## Decisões de Design

### Por que CSVs versionados em vez de banco de dados?
- **Simplicidade:** sem custo de infraestrutura (sem PostgreSQL, sem cloud).
- **Transparência:** qualquer pessoa pode ver os dados brutos no repositório.
- **Portabilidade:** CSVs são universais, fáceis de abrir no Excel/LibreOffice.
- **Limite:** funciona bem até ~100 MB. Acima disso, migrar para Git LFS ou banco.

### Por que Next.js em vez de Flask/Streamlit?
- **Custo zero de servidor:** Vercel hospeda gratuitamente.
- **Performance:** Server Components renderizam no servidor sem JS pesado no cliente.
- **Escalabilidade:** suporta dezenas de milhares de acessos simultâneos sem custo adicional.

### Por que pipeline separado do frontend?
- **Desacoplamento:** o pipeline pode rodar em qualquer máquina (local, GitHub Actions, servidor).
- **Resiliência:** se o frontend mudar de tecnologia, os scripts de extração não são afetados.

## Limites Conhecidos

| Limite | Valor | Mitigação |
|---|---|---|
| Tamanho máximo de CSV prático | ~100 MB | Acima disso, migrar para formato colunar (Parquet) ou banco de dados |
| Tempo de execução do pipeline | ~5 minutos por ano | GitHub Actions tem limite de 6h; suficiente para décadas |
| Acessos simultâneos (Vercel Hobby) | 100.000/mês (faixa gratuita) | Se exceder, plano Pro ($20/mês) |
| Armazenamento no repositório | Sem limite rígido, mas >1 GB desaconselhado | Mover PDFs para armazenamento externo (S3, Cloudflare R2) se necessário |

## Próximos Passos Técnicos

- [ ] Migrar pipeline para GitHub Actions (coleta automática semanal).
- [ ] Adicionar suporte a novos setores (transporte, segurança).
- [ ] Implementar Câmara 2 (sistema de moderação jurídica).
- [ ] Implementar Câmara 3 (praça pública com comentários).
- [ ] Banco de dados em grafo (Neo4j) para cruzamento de CNPJs e vínculos.
- [ ] Assistente IA integrado ao site (explicação em linguagem cidadã).