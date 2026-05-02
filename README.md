# Anatomia do Gasto — Dissecando o orçamento público município por município

## 1. Visão geral do projeto

**Problema:**
Portais de transparência públicos no Brasil são obrigatórios, mas os dados vêm em formatos de difícil acesso (PDFs confusos, CSVs sem padrão). O cidadão comum não consegue entender o destino do dinheiro público, gerando desconfiança e apatia.

**Solução:**
O **Anatomia do Gasto** é uma plataforma que:
- Automatiza a coleta e estruturação de dados públicos (começando por Sorocaba/SP, área da saúde).
- Gamifica a análise (missões, rankings, badges).
- Cria uma **Guarda de Moderadores** (Câmara 2): especialistas (estudantes de direito, advogados) validam as análises.
- Oferece uma **praça pública supervisionada** (Câmara 3) para comentários e perguntas.

Código aberto, sem fins lucrativos (ONG inspirada na Operação Serenata de Amor).

---

## 2. Arquitetura em 3 camadas (Câmaras)

| Câmara | Função | Responsável | Status |
|--------|--------|--------------|--------|
| **Câmara 1 – Curadoria de Dados** | Coletar, limpar e estruturar dados de portais. | Scripts Python (pdfplumber, pandas). | 🟢 Pipeline completo funcionando (2024 e 2025) |
| **Câmara 2 – Guarda de Elite** | Validar juridicamente as análises. | Moderadores voluntários (parceria com universidades). | 🔴 Não iniciado |
| **Câmara 3 – Praça Pública** | Comentários supervisionados do cidadão. | Cidadãos cadastrados + moderação. | 🔴 Não iniciado |

---

## 3. Estado atual do desenvolvimento

### 3.1. Dataset

- **Município:** Sorocaba/SP
- **Tema:** Despesas com saúde — Relatórios de Aplicação da LRF
- **Anos disponíveis:** 2024, 2025 (3 quadrimestres cada)
- **Fonte:** Portal de Transparência de Sorocaba (`fazenda.sorocaba.sp.gov.br/transparencia`)

### 3.2. Estrutura de pastas

```
G:\Meu Drive\anatomia-do-gasto
│
├── scripts
│   ├── pipeline.py               ← orquestra todo o fluxo (download → extração → verificação → HTML)
│   ├── baixar_pdfs.py            ← baixa PDFs do portal por ano
│   ├── extrator_universal.py     ← extrator genérico: qualquer PDF → JSON completo
│   ├── extrator_saude.py         ← extrator específico: PDFs de saúde → CSV
│   ├── gerar_html.py             ← CSV → HTML do relatório por ano
│   ├── gerar_index.py            ← gera index.html com todos os relatórios disponíveis
│   └── testes
│       ├── test_table_format.py  ← testa formatação visual da tabela
│       └── verificar_dados.py    ← compara CSV com PDF bruto (verificação de integridade)
│
├── sorocaba
│   └── saude
│       ├── entrada               ← PDFs brutos (baixados do portal)
│       ├── intermediario         ← JSONs gerados pelo extrator (não versionar)
│       └── saida                 ← CSV, HTMLs e index.html (produto final)
│
├── venv                          ← ambiente virtual Python (não versionar)
└── README.md
```

### 3.3. O que já funciona

- **Download automático** dos PDFs direto do portal, por ano (`baixar_pdfs.py --ano 2024`)
- **Extração** de todas as linhas de despesa por função e quadrimestre, sem linhas de TOTAL (`extrator_saude.py --ano 2024`)
- **Verificação de integridade** automática: compara CSV com o PDF bruto (96/96 valores corretos para 2024 e 2025)
- **Visualização HTML** responsiva por ano, com:
  - 3 abas (1º, 2º, 3º quadrimestre)
  - Cards mostrando de onde vem o dinheiro (Recursos Próprios, SUS Federal, SUS Estadual)
  - Tabela de despesas por área com indicação de fontes por pílulas coloridas
  - Legenda explicando cada coluna em português simples
- **Index** (`index.html`) listando todos os relatórios disponíveis com navegação entre eles
- **Pipeline completo** em um único comando

### 3.4. Pendências abertas

- [ ] Expandir para outros anos (2023 e anteriores, se disponíveis no portal)
- [ ] Expandir para outras áreas além de saúde
- [ ] Adicionar gráficos comparativos entre anos e quadrimestres
- [ ] Publicar os HTMLs em servidor (ex: GitHub Pages)
- [ ] Câmara 2: sistema de moderação jurídica
- [ ] Câmara 3: praça pública com comentários supervisionados

---

## 4. Como executar

### Pré-requisitos

- Windows 10/11, Python 3.12+
- VS Code (recomendado)

### Configuração inicial (apenas uma vez)

```powershell
cd "G:\Meu Drive\anatomia-do-gasto"
python -m venv venv
.\venv\Scripts\pip.exe install pdfplumber pandas
```

### Rodar o pipeline completo para um ano

```powershell
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2024
```

Isso executa em sequência:
1. **Download** — baixa os 3 PDFs do portal (pula se já existirem)
2. **Extração** — gera o CSV com despesas por função e quadrimestre
3. **Verificação** — compara CSV com o PDF bruto e reporta divergências
4. **HTML** — gera o relatório visual do ano
5. **Index** — atualiza o `index.html` com todos os anos disponíveis

### Opções do pipeline

```powershell
# Múltiplos anos de uma vez
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2024 --ano 2025

# PDFs já estão na pasta, pular download
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2024 --pular-download

# Forçar re-download e re-processamento
.\venv\Scripts\python.exe scripts\pipeline.py --ano 2024 --forcar
```

### Rodar scripts individualmente

```powershell
# Só baixar PDFs
.\venv\Scripts\python.exe scripts\baixar_pdfs.py --ano 2024

# Só extrair dados
.\venv\Scripts\python.exe scripts\extrator_saude.py --ano 2024

# Só verificar integridade
.\venv\Scripts\python.exe scripts\testes\verificar_dados.py --ano 2024

# Só gerar HTML
.\venv\Scripts\python.exe scripts\gerar_html.py --ano 2024

# Só gerar index
.\venv\Scripts\python.exe scripts\gerar_index.py
```

---

## 5. Segurança

O projeto é atualmente um pipeline local — scripts Python lendo PDFs e gerando arquivos estáticos. Não há servidor, banco de dados nem entrada de usuário. Não há superfície de ataque.

Segurança passa a ser relevante quando forem adicionados: servidor web, login de moderadores (Câmara 2), comentários de cidadãos (Câmara 3) ou banco de dados.
