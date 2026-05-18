# Portais de Transparência por Município

Referência de URLs e características de acesso aos portais de transparência.
Atualizar ao adicionar cada novo município via `/onboarding`.

---

## Sorocaba (SP)

- Portal: https://transparencia.sorocaba.sp.gov.br
- Dados: saúde, educação, execução orçamentária, receita, fornecedores, empenho, restos a pagar
- Formato: CSV (execução, empenho), PDF (LRF/RREO/DCA)
- Scraper: sim (Câmara requer Playwright — 403 em requests diretos)
- Status: publicado
- Adicionado: 2026-05-18

### Entidades com 403/WAF em Sorocaba

| Entidade | URL base | Dados | Scraper |
|---|---|---|---|
| Câmara Municipal | https://camarasorocaba.sp.gov.br/transparencia | LOA, RREO, DCA, contratos | playwright |
| CEPA (emendas) | https://cepa.camarasorocaba.sp.gov.br | Emendas impositivas por vereador | playwright |
| Urbes | https://www.urbes.com.br/transparencia/index | Despesas, contratos de transporte | playwright |
| SAAE | https://www.saaesorocaba.com.br/transparencia | Orçamento e contratos água/esgoto | playwright |

---

<!-- Template para novos municípios:

## <Município> (<UF>)

- Portal: <URL>
- Dados: <lista de áreas disponíveis>
- Formato: <PDF/CSV/API>
- Scraper: <sim/não>
- Status: em andamento | publicado
- Adicionado: <data>

-->
