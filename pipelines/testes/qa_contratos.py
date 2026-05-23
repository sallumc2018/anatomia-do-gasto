"""QA formal — sorocaba/contratos 2020-2021."""
import csv
import re
from pathlib import Path

BASE = Path(r"C:\Omega\02_Repos\anatomia-do-gasto\data\extracted\sorocaba\contratos")

COLS_LIC = {"id", "ano_publicacao", "codigo_processo", "numero_edital",
            "modalidade", "descricao_objeto", "situacao",
            "data_abertura", "data_publicacao", "data_criacao"}
COLS_OBRAS = {"obra_id", "contrato", "objeto", "secretaria", "empresa_contratada",
              "cnpj", "cnpj_valido", "valor_contrato", "percentual_concluido", "status"}

_moji = re.compile(r"[\xC2-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\x80-\x9F]|�")
_pct_ok = re.compile(r"^\d+,\d{2}%$")

fails = []

# ── Licitações ──────────────────────────────────────────────────────────────
f_lic = BASE / "licitacoes_sorocaba_2020_2021.csv"
rows = list(csv.DictReader(f_lic.open(encoding="utf-8")))
cols = set(rows[0].keys()) if rows else set()

if not COLS_LIC.issubset(cols):
    fails.append(f"licitacoes: colunas ausentes {COLS_LIC - cols}")

nulos_id  = sum(1 for r in rows if not r.get("id"))
nulos_ano = sum(1 for r in rows if not r.get("ano_publicacao"))
nulos_obj = sum(1 for r in rows if not r.get("descricao_objeto","").strip())
if nulos_id:  fails.append(f"licitacoes: {nulos_id} registros sem id")
if nulos_ano: fails.append(f"licitacoes: {nulos_ano} registros sem ano_publicacao")
if nulos_obj: fails.append(f"licitacoes: {nulos_obj} registros sem descricao_objeto")

moji_lic = sum(1 for r in rows if _moji.search(r.get("descricao_objeto", "")))
if moji_lic: fails.append(f"licitacoes: {moji_lic} registros com mojibake residual")

anos = {r.get("ano_publicacao") for r in rows}

print(f"licitacoes_sorocaba_2020_2021.csv")
print(f"  Registros    : {len(rows)}")
print(f"  Anos         : {sorted(anos)}")
print(f"  Nulos id/ano/obj: {nulos_id}/{nulos_ano}/{nulos_obj}")
print(f"  Mojibake     : {moji_lic}")

# ── Obras ────────────────────────────────────────────────────────────────────
f_obras = BASE / "obras_sorocaba.csv"
rows_o = list(csv.DictReader(f_obras.open(encoding="utf-8")))
cols_o = set(rows_o[0].keys()) if rows_o else set()

if not COLS_OBRAS.issubset(cols_o):
    fails.append(f"obras: colunas ausentes {COLS_OBRAS - cols_o}")

nulos_oid = sum(1 for r in rows_o if not r.get("obra_id"))
nulos_obj_o = sum(1 for r in rows_o if not r.get("objeto","").strip())
if nulos_oid:   fails.append(f"obras: {nulos_oid} registros sem obra_id")
if nulos_obj_o: fails.append(f"obras: {nulos_obj_o} registros sem objeto")

pct_invalido = [r for r in rows_o if r.get("percentual_concluido") and not _pct_ok.match(r.get("percentual_concluido",""))]
if pct_invalido:
    fails.append(f"obras: {len(pct_invalido)} percentual_concluido fora do padrao NN,NN%")
    for r in pct_invalido[:3]:
        print(f"  pct invalido: obra_id={r['obra_id']} valor={repr(r['percentual_concluido'])}")

moji_obras = sum(1 for r in rows_o if _moji.search(r.get("objeto", "")))
if moji_obras: fails.append(f"obras: {moji_obras} registros com mojibake em objeto")

cnpj_invalidos = sum(1 for r in rows_o if r.get("cnpj_valido") == "0" and r.get("cnpj"))

print(f"\nobras_sorocaba.csv")
print(f"  Registros    : {len(rows_o)}")
print(f"  Nulos oid/obj: {nulos_oid}/{nulos_obj_o}")
print(f"  Pct invalidos: {len(pct_invalido)}")
print(f"  Mojibake     : {moji_obras}")
print(f"  CNPJ invalido: {cnpj_invalidos} (informativo)")

# ── Resultado ────────────────────────────────────────────────────────────────
print()
if fails:
    print("Resultado: FAIL")
    for f in fails:
        print(f"  FAIL: {f}")
else:
    print("Resultado: PASS")
    print("  Sem problemas bloqueantes.")
