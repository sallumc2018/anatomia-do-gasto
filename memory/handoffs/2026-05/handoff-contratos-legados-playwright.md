# Handoff — /pipeline → /playwright
# Tarefa: Contratos e licitações 2020-2021 + Obras públicas (Portal Sorocaba)

**Data:** 2026-05-22
**Motivo do bloqueio:** Portal fazenda.sorocaba.sp.gov.br/transparencia é WordPress com árvore de PDFs estáticos — não tem API REST; seção de contratos/obras/licitações requer navegação JavaScript.

---

## Contexto

Tentado via requests normais: portal responde HTTP 200 mas os dados são PDFs organizados em
árvore de diretórios (php_file_tree). A seção de contratos específicos 2020-2021 não foi
encontrada via link parsing. O portal tem 4.189 links, mas a navegação interativa (expandir
categorias, navegar anos) requer JavaScript.

## URL base

```
https://fazenda.sorocaba.sp.gov.br/transparencia
```

## O que /playwright deve fazer

### 1. Mapear a seção "Contratos e Licitações"

Navegar para a aba/seção de contratos no portal e listar todos os links de PDFs para 2020 e 2021.

O portal provavelmente tem estrutura como:
```
Transparência
  └── Licitações e Contratos
        ├── 2020/
        │     ├── contrato_001_2020.pdf
        │     └── ...
        └── 2021/
```

### 2. Seção "Obras" (se disponível)

No menu principal há um link "obras" — navegar para encontrar PDFs de obras públicas 2020-2026.

Alerta: PNCP não tem obras de Sorocaba (HTTP 204 para modalidades Concorrência/Tomada de Preços
em 2023; HTTP 403 em 2024-2025). O portal municipal pode ser a única fonte de obras históricas.

### 3. Download e estrutura esperada

Para contratos: `data/raw/sorocaba/contratos/legados/2020-2021/`
Para obras: `data/raw/sorocaba/contratos/obras/`

Criar inventário CSV: `data/extracted/sorocaba/contratos/inventario_contratos_legados.csv`
com colunas: `ano`, `titulo`, `url_pdf`, `tamanho_bytes`, `status_download`

### 4. Extração dos PDFs

Após download, usar pdfplumber para extrair:
`ano`, `numero_contrato`, `objeto`, `contratada`, `cnpj`, `valor`, `data_assinatura`,
`vigencia_inicio`, `vigencia_fim`, `modalidade_licitacao`

### 5. Saídas esperadas

- `data/public/sorocaba/contratos/saida/contratos_portal_sorocaba_2020_2021.csv`
- `data/public/sorocaba/contratos/saida/obras_sorocaba_2020_2026.csv` (se disponível)

## Atualização lacunas.ts após publicação

```typescript
// Contratos 2020-2021
status: "publicado",
anosCobertos: 2,

// Obras públicas
status: "parcial",  // ou "publicado" se cobertura boa
anosCobertos: N,    // ajustar conforme dados encontrados
```

## Validação

```python
python c:/tmp/calc_score.py  # contratos deve subir acima de 72.5%
```
