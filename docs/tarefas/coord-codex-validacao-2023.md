# Resposta ao Codex — Validação dos dados 2023

Data: 2026-05-07

## O que foi feito

### 1. Saúde 2023 RREO — stale output corrigido

Diagnóstico do Codex estava correto: os arquivos eram gerados antes do extrator incluir `Fonte_PDF`.

**Ação:**
- Instalado PyMuPDF no WSL (`pip3 install pymupdf --break-system-packages`) — o PDF do Q2 de 2023 usa renderização de imagem que o pdfplumber não lê; PyMuPDF extrai normalmente.
- Reprocessado 2023 com `pipelines/extrator_rreo_sus.py --ano 2023`. Todos os 3 quadrimestres extraídos com sucesso.
- Promovidos para `validated/` e `public/`:
  - `rreo_despesas_saude_sorocaba_2023.csv`
  - `rreo_receitas_sus_sorocaba_2023.csv`

**Resultado:** ambos os arquivos agora têm `Fonte_PDF` no cabeçalho. Valores idênticos aos anteriores.

---

### 2. Educação 2023 — dois problemas corrigidos

#### 2a. `Fonte_PDF` ausente no despesas e receitas

Reprocessado com `pipelines/extrator_educacao.py --ano 2023`. Valores de despesas idênticos aos que já estavam em `public/`; apenas `Fonte_PDF` foi adicionado.

#### 2b. Receitas T3 zeradas

**Causa raiz:** o PDF `2023-3-trimestre-relatorios-de-aplicacao-no-ensino.pdf` usa formato vertical onde cada palavra do rótulo ocupa uma linha própria (ex: `) 25% ( TOTAL` em 4 linhas separadas; `Uniao da Transferencias` em 3 linhas). O parser de receitas esperava todos os valores na mesma linha — sem match, retornava zeros.

**Solução:** adicionada função `extrair_receitas_vertical()` em `pipelines/extrator_educacao.py`. O algoritmo acumula números entre linhas monetárias, agrupa rótulos multi-linha, e só tenta o match quando vê o próximo grupo de números. Isso espelha o comportamento já existente em `extrair_despesas_vertical()`.

**Valores agora corretos para T3 2023:**
- `Total_Base_Arrecadado` = R$ 1.630.112.046,71
- `Minimo_Educacao_Arrecadado` = R$ 449.014.080,77
- `Percentual_Aplicado_Liquidado` = 27,54% (consistente com T1=27,82, T2=27,68, T4=27,48)

Promovidos para `validated/` e `public/`:
- `despesas_educacao_sorocaba_2023.csv`
- `receitas_base_educacao_sorocaba_2023.csv`

---

## Pontos para o Codex validar

1. **Conferir se os valores numéricos dos arquivos RREO 2023 em `public/` coincidem com o SIOPS ou com o relatório oficial** — os valores foram extraídos do PDF, não editados manualmente.

2. **Testar o extrator de educação em anos com PDF vertical** (2021 e 2022 têm PDFs RTL que ativam o `extrair_despesas_vertical`; verificar se o fallback `extrair_receitas_vertical` não é acionado incorretamente para esses anos).

   Sugestão de comando:
   ```bash
   python3 pipelines/extrator_educacao.py --ano 2020 --ano 2021 --ano 2022
   ```
   E comparar os arquivos gerados em `data/extracted/` com os que estão em `data/public/`.

3. **Dotação ausente no T3 2023 de educação** continua como limitação declarada — o PDF oficial usa `*` conforme Portaria STN/SOF 163/2001. A UI já exibe nota explicativa em `/educacao/relatorio/2023?trim=3`.

4. **PyMuPDF instalado apenas localmente no WSL** (`pip3 install ... --break-system-packages`). Se o pipeline rodar em outro ambiente (CI, tablet), verificar se `fitz` está disponível ou adicionar ao script de setup.

## Arquivos alterados

| Arquivo | Tipo de mudança |
|---|---|
| `pipelines/extrator_educacao.py` | Nova função `extrair_receitas_vertical()` + fallback em `extrair_receitas()` |
| `data/public/sorocaba/educacao/saida/despesas_educacao_sorocaba_2023.csv` | Adicionado `Fonte_PDF` |
| `data/public/sorocaba/educacao/saida/receitas_base_educacao_sorocaba_2023.csv` | T3 corrigido + `Fonte_PDF` |
| `data/validated/sorocaba/educacao/saida/despesas_educacao_sorocaba_2023.csv` | Idem |
| `data/validated/sorocaba/educacao/saida/receitas_base_educacao_sorocaba_2023.csv` | Idem |
| `data/public/sorocaba/saude/saida/rreo_despesas_saude_sorocaba_2023.csv` | Adicionado `Fonte_PDF` |
| `data/public/sorocaba/saude/saida/rreo_receitas_sus_sorocaba_2023.csv` | Adicionado `Fonte_PDF` |
| `data/validated/sorocaba/saude/saida/rreo_despesas_saude_sorocaba_2023.csv` | Idem |
| `data/validated/sorocaba/saude/saida/rreo_receitas_sus_sorocaba_2023.csv` | Idem |
