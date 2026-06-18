from collections import defaultdict

items = [
  # COBERTURA_PUBLICADOS (executivo x8)
  ('executivo','publicado',6,6), ('executivo','publicado',6,6), ('executivo','publicado',6,6),
  ('executivo','publicado',6,6), ('executivo','publicado',6,6), ('executivo','publicado',6,6),
  ('executivo','publicado',6,6), ('executivo','publicado',6,6),
  # camara publicado (1)
  ('camara','publicado',6,6),
  # LACUNAS contratos
  ('contratos','publicado',6,6),  # fornecedores
  ('contratos','publicado',6,6),  # restos
  ('contratos','publicado',3,3),  # PNCP 3/3 anos (Sorocaba entrou 2023)
  ('contratos','publicado',2,2),  # pre-2022 (licitacoes_sorocaba_2020_2021.csv, 1078 regs)
  ('contratos','parcial',6,6),    # obras (obras_sorocaba.csv, 69 regs ativos 2020-2026; incompleto)
  ('contratos','publicado',6,6),  # empenhos
  ('contratos','parcial',6,6),    # precatórios (1358 regs, R$336.8M, TRT15/TRT3/TRF3/DEPRE 2020-2026, TRT_2025 scanned)
  # LACUNAS executivo
  ('executivo','publicado',6,6),  # despesa detalhe
  ('executivo','publicado',5,5),  # LOA pub
  # inexistente excluido
  ('executivo','lacuna',6,0),     # receita analítica
  ('executivo','lacuna',6,0),     # pessoal
  ('executivo','lacuna',6,0),     # patrimônio
  # LACUNAS camara
  ('camara','publicado',6,6),     # emendas 6/6 (2020-2025 no cepa; 2020-2021 com 2 regs cada)
  ('camara','publicado',7,7),     # gabinete (7 CSVs publicados 2020-2026)
  ('camara','publicado',6,6),     # camara despesas TCE 2020-2025 (24.417 registros)
  ('camara','lacuna',6,0),        # contratos camara
  # LACUNAS autarquias
  ('autarquias','publicado',6,6),    # SAAE despesas+receitas TCE 6/6
  ('autarquias','parcial',6,6),       # Urbes Lei 8890 despesas mensais (75 regs, 2020-2026; sem contratos/licitações)
  ('autarquias','publicado',6,6),    # FUNSERV RPPS 6/6 anos
  ('autarquias','publicado',6,6),    # FUNSERV Saude (9.154 registros, R$3,27B)
  ('autarquias','publicado',6,6),    # Empresas municipais (EDUSS+PT)
  ('autarquias','lacuna',6,0),       # Consórcios
  # LACUNAS transferencias (NOVAS)
  ('transferencias','publicado',6,6), # federais TCE FPM+SUS+FNDE+outros
  ('transferencias','publicado',6,6), # estaduais Sefaz-SP ICMS+IPVA detalhado
  ('transferencias','publicado',6,6), # subvencoes
  # LACUNAS controle_externo
  ('controle_externo','parcial',6,1),   # TCE alertas 1/6 anos
  ('controle_externo','parcial',6,6),   # auditoria proxy
  ('controle_externo','publicado',6,6), # DCA SICONFI 2020-2025 (11.466 registros)
]

STATUS = {'publicado':1.0,'parcial':0.5,'em_coleta':0.2,'lacuna':0.0,'inexistente':None}
PESO = {'executivo':0.30,'contratos':0.20,'camara':0.10,'autarquias':0.15,'transferencias':0.15,'controle_externo':0.10}

acc = defaultdict(lambda: {'soma':0.0,'n':0})
for (dim, st, ap, ac) in items:
    base = STATUS[st]
    if base is None:
        continue
    yf = ac/ap if ap > 0 else 0
    acc[dim]['soma'] += base * yf
    acc[dim]['n'] += 1

total = 0.0
for dim in ['executivo','contratos','camara','autarquias','transferencias','controle_externo']:
    v = acc[dim]
    sc = v['soma']/v['n'] if v['n'] else 0
    contrib = sc * PESO[dim]
    total += contrib
    print(f"{dim:20s} score={sc:.3f} contrib={contrib*100:.1f}pp  ({v['n']} items)")

print(f"\nTOTAL: {total*100:.1f}%")
