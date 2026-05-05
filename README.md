# Anatomia do Gasto

Ferramenta de extração, verificação e visualização de dados orçamentários municipais.

**Site:** [anatomiadogasto.ong.br](https://anatomiadogasto.ong.br)  
**Contato:** [contato@anatomiadogasto.ong.br](mailto:contato@anatomiadogasto.ong.br)

---

## Situação Atual (Maio/2026)

- Câmara 1 (Curadoria de Dados): 🟢 Funcional — saúde 2020–2025, educação 2024–2025.
- Câmara 2 (Validação Jurídica): 🔴 Não iniciada (parceria com UFSCar Sorocaba em prospecção).
- Câmara 3 (Praça Pública): 🔴 Não iniciada.

Este projeto extrai, estrutura e verifica automaticamente os dados do Portal da Transparência de Sorocaba nas áreas de saúde e educação. Ele **não realiza auditoria jurídica, não interpreta legislação e não emite juízos de valor sobre a legalidade dos gastos.** Para análises conclusivas, consulte profissionais habilitados.

---

## 1. Visão geral do projeto

**Problema:** Portais de transparência públicos no Brasil são obrigatórios, mas os dados vêm em formatos de difícil acesso (PDFs confusos, CSVs sem padrão). O cidadão comum não consegue entender o destino do dinheiro público, gerando desconfiança e apatia.

**Solução:** O Anatomia do Gasto é uma plataforma que:

- Automatiza a coleta e estruturação de dados públicos (começando por Sorocaba/SP, áreas de saúde e educação).
- Cria uma Guarda de Moderadores (Câmara 2): especialistas (estudantes de direito, advogados) validam as análises.
- Oferece uma praça pública supervisionada (Câmara 3) para comentários e perguntas.
- É 100% código aberto, sem fins lucrativos (inspirada na Operação Serenata de Amor).

**Visão de futuro (não implementado):**

- Assistente virtual (IA) integrado ao site para explicar os dados, as limitações e a metodologia do projeto em linguagem cidadã.
- Gamificação da análise (missões, rankings, badges).

- **Radar de gastos dos representantes públicos** — do bairro à presidência. A plataforma exibirá para cada ocupante de cargo eletivo ou de alto escalão:
  - **Cota máxima permitida** (teto de gastos com gabinete, transporte, moradia, alimentação, etc.), conforme legislação vigente.
  - **Gasto efetivo** mês a mês, em valores brutos e percentual do teto.
  - **Economia gerada** em relação ao teto (valor bruto e %), destacando quem devolveu recursos ao erário.
  - **Benefícios previstos em lei** a que cada servidor tem direito (auxílios, verbas indenizatórias, planos de saúde, etc.).
  - **Lista de presença** em sessões e comissões.
  - **Proposições legislativas**: quem propôs cada lei e como cada parlamentar votou (a favor, contra, abstenção).
  - **Identificação padronizada**: `CARGO - NOME_DO_SERVIDOR - PARTIDO`.

**Ordem de abrangência (do bairro à Presidência):**

1. Vereador
2. Prefeito
3. Deputado Estadual
4. Governador
5. Deputado Federal
6. Senador
7. Presidente da República

A atualização respeitará os calendários de divulgação das fontes oficiais (portais de transparência, diários oficiais, sistemas do Legislativo), com prazo máximo de 24 a 48 horas para espelhar os novos dados no site.

**Roteiro de expansão de setores (do município para o país):**

O projeto começou por saúde e educação em Sorocaba. A meta é cobrir progressivamente todos os setores do orçamento público, na seguinte ordem de prioridade:

1. 🟢 Saúde — completo para 2020–2025
2. 🟢 Educação — completo para 2024–2025 (2020–2023 sem dados no portal de Sorocaba)
3. 🔴 Transporte
4. 🔴 Segurança pública
5. 🔴 Saneamento básico
6. 🔴 Obras e investimentos
7. 🔴 Cultura, eventos e esporte
8. 🔴 Assistência social
9. 🔴 Meio ambiente e habitação
10. 🔴 Administração e pessoal (salários, cargos, previdência)

Cada novo setor seguirá o mesmo pipeline: download automático → extração → verificação de integridade → publicação no frontend.

---

## 2. Arquitetura em 3 camadas (Câmaras)

| Câmara | Função | Responsável | Status |
|---|---|---|---|
| Câmara 1 – Curadoria de Dados | Coletar, limpar, estruturar e publicar dados de portais. | Scripts Python (pdfplumber, pandas) + frontend Next.js. | 🟢 Funcional (saúde 2020–2025, educação 2024–2025) |
| Câmara 2 – Guarda de Moderadores | Validar juridicamente as análises. | Moderadores voluntários (parceria com universidades e ONGs). | 🔴 Não iniciado |
| Câmara 3 – Praça Pública | Comentários supervisionados do cidadão. | Cidadãos cadastrados + moderação. | 🔴 Não iniciada |

---

## 3. Estado atual do desenvolvimento

### 3.1. Saúde

- **Município:** Sorocaba/SP
- **Tema:** Despesas com saúde — Relatórios de Aplicação da LRF (RREO Anexo 12)
- **Anos disponíveis:** 2020–2025 🟢 (3 quadrimestres cada)
- **Fonte:** [Portal de Transparência de Sorocaba](https://fazenda.sorocaba.sp.gov.br/transparencia)
- **Status do pipeline:** 🟢 Completo (download, extração, verificação 96/96 valores corretos, publicado no frontend)

### 3.2. Educação

- **Município:** Sorocaba/SP
- **Tema:** Despesas com educação — Relatórios de Aplicação da LRF (mínimo 25%, Art. 256 CE-SP)
- **Anos disponíveis:** 2024–2025 🟢 (4 trimestres cada); 2020–2023 sem dados no portal
- **Status da verificação de integridade:** 🟡 Pendente (verificar_dados.py ainda não cobre educação)
- **Fonte:** [Portal de Transparência de Sorocaba](https://fazenda.sorocaba.sp.gov.br/transparencia)

### 3.3. Estrutura de pastas

```
anatomia-do-gasto/
│
├── docs/ ← documentação do projeto
│ ├── arquitetura.md ← stack, fluxo de dados, decisões técnicas
│ ├── faq.md ← perguntas frequentes
│ ├── glossario.md ← termos técnicos em linguagem cidadã
│ ├── pipeline.md ← documentação detalhada do pipeline
│ ├── politica-de-moderacao.md ← regras para Câmaras 2 e 3
│ ├── roadmap.md ← fases de evolução do projeto
│ ├── seguranca.md ← política de segurança
│ └── auditoria/ ← trilha de auditoria de agentes políticos
│ ├── README.md
│ ├── 01-fontes.md
│ ├── 02-atores.md
│ ├── 03-metodologia.md
│ ├── 04-visualizacoes.md
│ ├── 05-emendas-saude.md
│ └── 06-lacunas.md
│
├── frontend/ ← site Next.js (source of truth)
│ ├── app/ ← rotas Next.js (App Router)
│ │ ├── page.tsx ← home com gráficos comparativos
│ │ ├── saude/
│ │ │ ├── page.tsx ← hub de saúde
│ │ │ └── relatorio/[ano]/ ← relatório por ano (dinâmico)
│ │ ├── educacao/
│ │ │ ├── page.tsx ← hub de educação
│ │ │ └── relatorio/[ano]/ ← relatório por ano (dinâmico)
│ │ ├── sobre/
│ │ ├── metodologia/
│ │ ├── termos/
│ │ ├── politica-de-dados/
│ │ └── politica-de-neutralidade/
│ ├── components/ ← componentes React (gráficos, layout, UI)
│ ├── data/ ← CSVs gerados pelo pipeline Python
│ │ ├── saude/saida/ ← despesas e receitas SUS por ano
│ │ └── educacao/saida/ ← despesas educação por ano
│ └── lib/
│ ├── data.ts ← leitura de CSV (server only, usa fs/path)
│ └── types.ts ← interfaces e labels (browser-safe)
│
├── scripts/ ← pipeline Python (extração de dados)
│ ├── pipeline.py ← orquestrador principal
│ ├── baixar_pdfs.py
│ ├── baixar_pdfs_educacao.py
│ ├── baixar_rreo_sus.py
│ ├── extrator_saude.py
│ ├── extrator_educacao.py
│ ├── extrator_rreo.py
│ ├── extrator_rreo_sus.py
│ ├── extrator_universal.py
│ └── testes/
│ └── verificar_dados.py ← compara CSV com PDF bruto
│
├── sorocaba/ ← dados brutos e saídas do pipeline
│ ├── saude/
│ │ ├── entrada/ ← PDFs brutos (não versionar)
│ │ ├── intermediario/ ← JSONs de extração
│ │ ├── rreo/entrada/ ← PDFs do RREO
│ │ └── saida/ ← CSVs extraídos
│ └── educacao/
│ ├── entrada/ ← PDFs brutos (não versionar)
│ └── saida/ ← CSVs extraídos
│
├── .gitignore
├── CLAUDE.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── GOVERNANCE.md
├── LICENSE
├── LIMITACOES.md
├── README.md
└── requirements.txt
```

### 3.4. Fluxo de dados

```
Portal de Transparência (PDF)
        ↓ scripts/pipeline.py
frontend/data/{area}/saida/*.csv
        ↓ lib/data.ts (server component)
frontend/app/.../page.tsx (Next.js)
        ↓ build / Vercel
anatomiadogasto.ong.br
```

### 3.5. O que já funciona

- Download automático dos PDFs do portal por ano e área
- Extração das linhas de despesa por função e período, sem totalizadores
- Detecção automática de PDFs com texto RTL (invertido) — já tratado no extrator
- Verificação de integridade: compara CSV com o PDF bruto (96/96 valores corretos para saúde 2024 e 2025)
- Frontend Next.js publicado em [anatomiadogasto.ong.br](https://anatomiadogasto.ong.br):
  - Home com gráficos comparativos entre anos
  - Relatório por ano para saúde e educação
  - Cards de receitas (Recursos Próprios, SUS Federal, SUS Estadual)
  - Gráficos de despesas por área (Recharts)
  - Páginas de termos, política de dados e política de neutralidade

### 3.6. Pendências abertas

- 🟡 Verificar integridade dos dados de saúde 2020–2023 e educação 2024–2025
- 🟡 Implementar trilha de auditoria de agentes políticos (coleta de remuneração e emendas)
- 🔴 Câmaras 2 e 3 (moderação jurídica e praça pública)

Demais pendências e fases de expansão estão no [roadmap do projeto](docs/roadmap.md).

---

## 4. Como executar

### Pré-requisitos

- Python 3.12 ou superior
- Node.js 20 ou superior
- Git

#### Configuração inicial (apenas uma vez)

```bash
git clone https://github.com/sallumc2018/anatomia-do-gasto.git
cd anatomia-do-gasto

# Ambiente Python
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt

# Dependências do frontend
cd frontend
npm install
```

### Pipeline de dados (Python)

Extrai PDFs do portal e gera os CSVs consumidos pelo frontend.

```bash
# Pipeline completo para um ano
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025

# Opções
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2024 --ano 2025
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025 --pular-download
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2025 --forcar

# Verificação de integridade (saúde)
.\venv\Scripts\python.exe scripts\testes\verificar_dados.py --ano 2025
```

Os CSVs gerados ficam em `frontend/data/{saude,educacao}/saida/` e são lidos diretamente pelo Next.js.

### Frontend (Next.js)

```bash
cd frontend
npm run dev      # servidor local em http://localhost:3000
npm run build    # build de produção
npm run start    # rodar build localmente
```

---

## 5. Segurança

O site é gerado pelo Next.js e publicado via Vercel (arquivos estáticos + server components). Não há banco de dados, login ou entrada de usuário na versão atual. A superfície de ataque é mínima.

Segurança passa a ser relevante quando forem adicionados: autenticação de moderadores (Câmara 2) e comentários de cidadãos (Câmara 3).

Para mais detalhes, veja [`docs/seguranca.md`](docs/seguranca.md).

## 6. Limitações Importantes

Veja o arquivo [LIMITACOES.md](LIMITACOES.md) para entender o que este projeto NÃO oferece e como usar os dados com responsabilidade.

---

Anatomia do Gasto — Dissecando o orçamento público município por município.
