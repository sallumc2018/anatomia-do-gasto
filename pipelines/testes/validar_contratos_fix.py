"""Script de validação pós-fix de mojibake e percentual em contratos."""
import csv
import re
from collections import Counter
from pathlib import Path

BASE = Path(r"C:\Omega\02_Repos\anatomia-do-gasto\data\extracted\sorocaba\contratos")

# --- Licitações: verifica mojibake residual ---
f_lic = BASE / "licitacoes_sorocaba_2020_2021.csv"
rows_lic = list(csv.DictReader(f_lic.open(encoding="utf-8")))

_moji = re.compile(r"[\xC2-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\x80-\x9F]")
problemas = [r for r in rows_lic if _moji.search(r.get("descricao_objeto", ""))]

print(f"Licitações — total registros : {len(rows_lic)}")
print(f"Licitações — mojibake residual: {len(problemas)}")
if problemas:
    for r in problemas[:5]:
        print(f"  {repr(r['descricao_objeto'][:80])}")

# Spot-check: mostrar amostras com acentos corrigidos
ok = [r for r in rows_lic if re.search(r"[ção çã áéíóú ÁÉÍÓÚ]", r.get("descricao_objeto", ""), re.IGNORECASE)]
print(f"Licitações — com acentos PT-BR : {len(ok)}")
for r in ok[:3]:
    print(f"  {r['descricao_objeto'][:80]}")

# --- Obras: verifica percentual ---
f_obras = BASE / "obras_sorocaba.csv"
rows_obras = list(csv.DictReader(f_obras.open(encoding="utf-8")))

pcts = Counter(r["percentual_concluido"] for r in rows_obras)
print(f"\nObras — percentual_concluido distribuição:")
for v, n in sorted(pcts.items()):
    print(f"  {repr(v):<20} -> {n}")

sem_virgula = [r for r in rows_obras if re.match(r"^\d+%$", r.get("percentual_concluido", ""))]
print(f"Obras — sem vírgula (deve ser 0): {len(sem_virgula)}")
