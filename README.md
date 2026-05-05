# Anatomia do Gasto

Ferramenta de extração e verificação de integridade de dados orçamentários municipais.

**Site:** [anatomiadogasto.ong.br](https://anatomiadogasto.ong.br)  
**Contato:** [contato@anatomiadogasto.ong.br](mailto:contato@anatomiadogasto.ong.br)

---

## Situação Atual (Maio/2026)

- Câmara 1 (Curadoria de Dados): 🟢 Funcional para 2024 e 2025.
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

1. 🟢 Saúde — concluído para 2024 e 2025
2. 🟡 Educação — iniciado para 2024 e 2025 (HTMLs publicados, CSVs de extração ainda não versionados)
3. 🔴 Transporte
4. 🔴 Segurança pública
5. 🔴 Saneamento básico
6. 🔴 Obras e investimentos
7. 🔴 Cultura, eventos e esporte
8. 🔴 Assistência social
9. 🔴 Meio ambiente e habitação
10. 🔴 Administração e pessoal (salários, cargos, previdência)

Cada novo setor seguirá o mesmo pipeline: download automático → extração → verificação de integridade → publicação HTML.

---

## 2. Arquitetura em 3 camadas (Câmaras)

| Câmara | Função | Responsável | Status |
|---|---|---|---|
| Câmara 1 – Curadoria de Dados | Coletar, limpar e estruturar dados de portais. | Scripts Python (pdfplumber, pandas). | 🟢 Pipeline completo funcionando (2024 e 2025) |
| Câmara 2 – Guarda de Moderadores | Validar juridicamente as análises. | Moderadores voluntários (parceria com universidades e com outras ONGs dispostas a participar). | 🔴 Não iniciado |
| Câmara 3 – Praça Pública | Comentários supervisionados do cidadão. | Cidadãos cadastrados + moderação. | 🔴 Não iniciada |

---

## 3. Estado atual do desenvolvimento

### 3.1. Saúde

- **Município:** Sorocaba/SP
- **Tema:** Despesas com saúde — Relatórios de Aplicação da LRF
- **Anos disponíveis:** 2024 e 2025 (verificados 🟢) e 2020 a 2023 (verificação de integridade pendente 🟡)
- **Fonte:** [Portal de Transparência de Sorocaba](https://fazenda.sorocaba.sp.gov.br/transparencia)
- **Status do pipeline:** 🟢 Completo (download, extração, verificação 96/96 valores corretos, HTML gerado)

### 3.2. Educação

- **Município:** Sorocaba/SP
- **Tema:** Despesas com educação — Relatórios de Aplicação da LRF
- **Anos disponíveis:** 2024 e 2025 (HTMLs publicados 🟢, CSVs de extração ainda não versionados 🟡)
- **Status da verificação de integridade:** 🟡 Pendente (não foi executado `verificar_dados.py` para educação)
- **Fonte:** [Portal de Transparência de Sorocaba](https://fazenda.sorocaba.sp.gov.br/transparencia)
- **Observação:** A estrutura do site já exibe os relatórios de educação lado a lado com os de saúde, demonstrando a capacidade de expansão do pipeline para outras áreas.

### 3.3. Estrutura de pastas

```
anatomia-do-gasto/
│
├── scripts/
│ ├── pipeline.py ← orquestra todo o fluxo (download → extração → verificação → HTML)
│ ├── baixar_pdfs.py ← baixa PDFs do portal por ano
│ ├── extrator_universal.py ← extrator genérico: qualquer PDF → JSON completo
│ ├── extrator_saude.py ← extrator específico: PDFs de saúde → CSV
│ ├── gerar_html.py ← CSV → HTML do relatório por ano
│ ├── gerar_index.py ← gera index.html com todos os relatórios disponíveis
│ └── testes/
│ ├── test_table_format.py ← testa formatação visual da tabela
│ └── verificar_dados.py ← compara CSV com PDF bruto (verificação de integridade)
│
├── sorocaba/
│ ├── saude/
│ │ ├── entrada/ ← PDFs brutos baixados do portal
│ │ ├── intermediario/ ← JSONs gerados pelo extrator (não versionar)
│ │ └── saida/ ← CSV, HTMLs (produto final)
│ └── educacao/
│ ├── entrada/ ← PDFs brutos baixados do portal
│ ├── intermediario/ ← JSONs gerados pelo extrator (não versionar)
│ └── saida/ ← CSV, HTMLs (produto final)
│
├── requirements.txt ← dependências Python
├── venv/ ← ambiente virtual (não versionar)
├── README.md
├── GOVERNANCE.md
├── LIMITACOES.md
└── LICENSE ← MIT
```

### 3.4. O que já funciona

- Download automático dos PDFs direto do portal, por ano (`baixar_pdfs.py --ano 2024`)
- Extração de todas as linhas de despesa por função e quadrimestre, sem linhas de TOTAL (`extrator_saude.py --ano 2024`)
- Extração genérica para novos formatos de PDF (`extrator_universal.py`)
- Verificação de integridade automática: compara CSV com o PDF bruto (96/96 valores corretos para saúde 2024 e 2025)
- Visualização HTML responsiva por ano, com:
  - 3 abas (1º, 2º, 3º quadrimestre)
  - Cards mostrando de onde vem o dinheiro (Recursos Próprios, SUS Federal, SUS Estadual)
  - Tabela de despesas por área com indicação de fontes por pílulas coloridas
  - Legenda explicando cada coluna em português simples
- Index (`index.html`) listando todos os relatórios disponíveis com navegação entre eles
- Pipeline completo em um único comando

### 3.5. Pendências abertas

- 🟡 Verificar integridade dos dados de saúde de 2020 a 2023
- 🟡 Versionar CSVs de educação e executar `verificar_dados.py` para esses anos
- 🔴 Expandir para outros setores (transporte, segurança, etc.)
- 🔴 Adicionar gráficos comparativos entre anos e quadrimestres
- 🔴 Publicar os HTMLs em servidor próprio (em andamento via `anatomiadogasto.ong.br`)
- 🔴 Câmara 2: sistema de moderação jurídica
- 🔴 Câmara 3: praça pública com comentários supervisionados

---

## 4. Como executar

### Pré-requisitos

- Python 3.12 ou superior
- Git instalado (para clonar o repositório)
- VS Code (recomendado, mas opcional)

### Configuração inicial (apenas uma vez)

```bash
# Clone o repositório
git clone https://github.com/sallumc2018/anatomia-do-gasto.git
cd anatomia-do-gasto
```

```bash
# Crie o ambiente virtual
python -m venv venv
```

### Ative o ambiente virtual
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### Instale as dependências
```bash
pip install -r requirements.txt
```

### Rodar o pipeline completo para um ano
```bash
python scripts/pipeline.py --ano 2024
```

### Isso executa em sequência:

1. Download — baixa os PDFs do portal (pula se já existirem)
2. Extração — gera o CSV com despesas por função e quadrimestre
3. Verificação — compara CSV com o PDF bruto e reporta divergências
4. HTML — gera o relatório visual do ano
5. Index — atualiza o index.html com todos os anos disponíveis

### Opções do pipeline

### Múltiplos anos de uma vez
```bash
python scripts/pipeline.py --ano 2024 --ano 2025
```

### PDFs já estão na pasta, pular download
```bash
python scripts/pipeline.py --ano 2024 --pular-download
```

### Forçar re-download e re-processamento
```bash
python scripts/pipeline.py --ano 2024 --forcar
```

### Rodar scripts individualmente
### Só baixar PDFs
```bash
python scripts/baixar_pdfs.py --ano 2024
```

### Só extrair dados
```bash
python scripts/extrator_saude.py --ano 2024
```

### Só verificar integridade
```bash
python scripts/testes/verificar_dados.py --ano 2024
```

### Só gerar HTML
```bash
python scripts/gerar_html.py --ano 2024
```

### Só gerar index
```bash
python scripts/gerar_index.py
```

## 5. Segurança
O projeto é atualmente um pipeline local — scripts Python lendo PDFs e gerando arquivos estáticos. Não há servidor, banco de dados nem entrada de usuário. Não há superfície de ataque.
Segurança passa a ser relevante quando forem adicionados: servidor web, login de moderadores (Câmara 2), comentários de cidadãos (Câmara 3) ou banco de dados.

## 6. Limitações Importantes
Veja o arquivo LIMITACOES.md para entender o que este projeto NÃO oferece e como usar os dados com responsabilidade.

Anatomia do Gasto — Dissecando o orçamento público município por município.
