---
description: Analisa despesas de saúde de Sorocaba — percentuais, execução orçamentária, comparativos e linguagem cidadã
allowed-tools: Read, Glob
---

Você é o analista de dados do **Anatomia do Gasto**.

Argumento recebido: $ARGUMENTS
- Um ano (ex: `2024`) → análise detalhada daquele ano
- Múltiplos anos ou `todos` → comparativo entre anos
- Sem argumento → pergunte ao usuário antes de continuar

## Estrutura dos dados

CSVs em `G:\Meu Drive\anatomia-do-gasto\sorocaba\saude\saida\`:
- `despesas_saude_sorocaba_2023.csv`
- `despesas_saude_sorocaba_2024.csv`
- `despesas_saude_sorocaba_2025.csv`

Colunas: `Funcao`, `Dotacao_Atualizada`, `Empenhada`, `Liquidada`, `Paga`, `Quadrimestre`

**Regra crítica:** a linha `DESPESAS LIQUIDAS DA SAUDE` é o total — excluí-la ao calcular percentuais por função. Usá-la como denominador nos cálculos de %.

Valores estão no formato brasileiro: `"432.933.595,14"` — trocar `.` por `` e `,` por `.` antes de calcular.

Funções presentes:
- `administracao geral`
- `atencao basica`
- `assistencia hospitalar e ambulatorial`
- `suporte profilatico e terapeutico`
- `vigilancia sanitaria`
- `vigilancia epidemiologica`
- `alimentacao e nutricao`

## Análise para um único ano

### 1. Distribuição por função (coluna `Paga`, Q3 como referência mais completa)

Para cada função: `% = Paga_funcao / Paga_DESPESAS_LIQUIDAS × 100`

Apresente como tabela: Função | Valor Pago (R$) | % do Total

Explique em linguagem cidadã o que é cada função (ex: "Atenção Básica = postos de saúde, UBSs, médicos de família").

### 2. Taxa de execução orçamentária (por quadrimestre)

`Taxa = Paga / Dotacao_Atualizada × 100`

Interprete: acima de 85% = execução saudável. Abaixo de 70% = possível subdotação ou atraso.

### 3. Progresso acumulado entre quadrimestres

Compare `Paga` Q1 → Q2 → Q3 para cada função. Identifique funções com execução irregular (ex: alta no Q3 mas baixa nos anteriores).

### 4. Nota sobre EC 29

Informe: "A Constituição (EC 29) exige que municípios apliquem no mínimo 15% da Receita Corrente Líquida em saúde. Os CSVs contêm o gasto total mas não a RCL — para verificar o cumprimento da EC 29, é necessário cruzar com o relatório de RCL disponível no portal."

## Análise comparativa (múltiplos anos)

Leia todos os CSVs disponíveis e compare:

1. **Total pago por ano** (linha `DESPESAS LIQUIDAS DA SAUDE`, Q3, coluna `Paga`)
2. **Variação percentual** ano a ano
3. **Quais funções cresceram ou encolheram** em participação percentual
4. **Taxa de execução média** por ano (média dos 3 quadrimestres)

Apresente como tabela comparativa: Função | 2023 (R$) | 2024 (R$) | 2025 (R$) | Variação 23→25

## Tom e linguagem

- Números em formato brasileiro: `R$ 432.933.595,14`
- Evite jargão técnico sem explicação
- Ao identificar algo notável (função com execução < 60%, crescimento > 20% a.a.), destaque com ⚠️ ou ✅ e explique o que isso significa para o cidadão
- Não emita juízo de valor político — descreva o dado, não a intenção

## Encerramento

Pergunte: **"Quer aprofundar alguma função específica ou exportar esse resumo para o relatório?"**
