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

### Entidades indiretas de Sorocaba

| Entidade | URL base | Dados | Scraper | Status |
|---|---|---|---|---|
| Câmara Municipal | https://camarasorocaba.sp.gov.br/transparencia | LOA, RREO, DCA, contratos | playwright (403) | gabinete publicado; LOA/RREO/DCA pendente |
| CEPA (emendas) | https://servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas | Emendas impositivas por vereador | browser/API a mapear | destino do link publico divulgado pela Prefeitura; subdominio antigo nao resolveu no pre-deploy |
| Urbes | https://www.urbes.com.br/transparencia/index | Contratos transporte/receitas/outros, Relatórios Anuais, Cartas de Governança | requests direto (sem WAF) | mapeado 2026-05-18; script: `baixar_urbes_playwright.py` |
| SAAE | https://transparencia.saaesorocaba.sp.gov.br/ | Receita, Despesa, RH, Contratos, Licitações (2011–2026) | TDAPortal JavaScript SPA | PDFs RH/contratos baixados; dados abertos requer endpoint API |

#### Urbes — detalhes (mapeado 2026-05-18)
- Acesso direto via requests (sem Playwright obrigatório)
- Dados disponíveis: Cartas de Governança (2018–2025), Relatórios Anuais Integrados (2021–2025), Contratos de Transporte (concessão + aditivos), Contratos de Receitas (2013–2025), Contratos Outros (2022–2025)
- Scraper: `pipelines/baixar_urbes_playwright.py`
- Raw dir: `data/raw/sorocaba/transporte/urbes/`

#### SAAE — detalhes (mapeado 2026-05-18)
- Portal institucional: https://www.saaesorocaba.com.br/transparencia — PDFs estáticos (RH, contratos)
- Portal de transparência: https://transparencia.saaesorocaba.sp.gov.br/ (eTransparência — TDAPortal)
  - Sistema: Consenso Tecnologia / eTransparência
  - Anos disponíveis: 2011–2026
  - Seções: Receita, Despesa (fixado/empenhado/pago), RH, Contratos, Licitações, Restos a Pagar, Transferências, PPA/LDO/LOA, Obras
  - **"Dados Abertos"**: filtro por ano/mês/formato (CSV/Excel/JSON) — endpoint de download via JavaScript SPA; requer inspeção de rede para capturar URL exata
- Scraper: `pipelines/baixar_saae_playwright.py`
- Raw dir: `data/raw/sorocaba/saae/`
- Próximo passo: abrir portal no browser, selecionar ano+CSV, capturar URL da requisição de download no DevTools

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
