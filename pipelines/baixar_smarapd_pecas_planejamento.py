"""
Baixa LOA, LDO e PPA de Paulínia do portal SMARAPD.

Fonte: transparencia-paulinia.smarapd.com.br
API:   /paiportalserver/modulovisao/fixo/audiencias_publicas/pecasdeplanejamento
Files: /paifileserver/filemanager/pai/download?nomeArquivo={encoded_path}

Uso:
    .venv/bin/python3 pipelines/baixar_smarapd_pecas_planejamento.py
    .venv/bin/python3 pipelines/baixar_smarapd_pecas_planejamento.py --dry-run
    .venv/bin/python3 pipelines/baixar_smarapd_pecas_planejamento.py --tipo loa
"""
import argparse
import csv
import ssl
import time
import urllib.request
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "paulinia" / "smarapd" / "pecas_planejamento"
CATALOG_PATH = ROOT / "data" / "raw" / "paulinia" / "smarapd" / "catalogo_pecas_planejamento.csv"

BASE = "https://transparencia-paulinia.smarapd.com.br"
API_ENDPOINT = f"{BASE}/paiportalserver/modulovisao/fixo/audiencias_publicas/pecasdeplanejamento"
DOWNLOAD_BASE = f"{BASE}/paifileserver/filemanager/pai/download?nomeArquivo="

HEADERS = {
    "Origin": BASE,
    "Referer": BASE + "/",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
}

SSL_CTX = ssl.create_default_context()


def fetch_catalog() -> list[dict]:
    req = urllib.request.Request(API_ENDPOINT, headers=HEADERS)
    with urllib.request.urlopen(req, context=SSL_CTX) as resp:
        data = json.loads(resp.read())

    def extract_leaves(nodes, path_parts=None):
        if path_parts is None:
            path_parts = []
        results = []
        for node in nodes:
            if not isinstance(node, dict):
                continue
            title = node.get("title", "").strip()
            current_parts = path_parts + [title]
            arquivo = node.get("Arquivo")
            if arquivo and isinstance(arquivo, dict) and arquivo.get("Url"):
                results.append({
                    "path_parts": current_parts,
                    "title": title,
                    "arquivo_url": arquivo.get("Url", ""),
                })
            children = node.get("children", [])
            if children:
                results.extend(extract_leaves(children, current_parts))
        return results

    leaves = extract_leaves(data["VisaoItens"])
    catalog = []
    for leaf in leaves:
        parts = leaf["path_parts"]
        tipo = "outro"
        for p in parts:
            pu = p.upper().strip()
            if pu in ("PPA",) or pu.startswith("PLANO PLURIANUAL"):
                tipo = "ppa"
            elif pu in ("LDO",) or pu.startswith("LDO ") or pu.startswith("LEI DE DIRETRIZES"):
                tipo = "ldo"
            elif pu in ("LOA",) or pu.startswith("LOA ") or pu.startswith("LEI ORÇAMENTÁRIA"):
                tipo = "loa"
        catalog.append({
            "municipio": "paulinia",
            "tipo": tipo,
            "titulo": leaf["title"],
            "caminho": " > ".join(parts),
            "arquivo_url_raw": leaf["arquivo_url"],
            "download_url": DOWNLOAD_BASE + leaf["arquivo_url"],
        })
    return catalog


def save_catalog(catalog: list[dict]) -> None:
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CATALOG_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=catalog[0].keys())
        writer.writeheader()
        writer.writerows(catalog)
    print(f"Catálogo salvo: {CATALOG_PATH} ({len(catalog)} itens)")


def download_file(url: str, dest: Path) -> bool:
    if dest.exists():
        print(f"  [ok] já existe: {dest.name}")
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=60) as resp:
            content = resp.read()
            if not content[:4] == b"%PDF":
                print(f"  [warn] não é PDF: {dest.name} ({content[:50]})")
                return False
            dest.write_bytes(content)
            print(f"  [baixado] {dest.name} ({len(content)//1024}kB)")
            return True
    except Exception as e:
        print(f"  [erro] {dest.name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--tipo", choices=["loa", "ldo", "ppa", "outro"], default=None)
    parser.add_argument("--refresh-catalog", action="store_true", help="Rebusca catálogo mesmo se já existir")
    args = parser.parse_args()

    if CATALOG_PATH.exists() and not args.refresh_catalog:
        with open(CATALOG_PATH, encoding="utf-8") as f:
            catalog = list(csv.DictReader(f))
        print(f"Catálogo carregado: {CATALOG_PATH} ({len(catalog)} itens)")
    else:
        print("Buscando catálogo do portal SMARAPD...")
        catalog = fetch_catalog()
        save_catalog(catalog)

    if args.tipo:
        catalog = [c for c in catalog if c["tipo"] == args.tipo]
        print(f"Filtrado por tipo={args.tipo}: {len(catalog)} itens")

    ok = err = skip = 0
    for item in catalog:
        raw_url = item["arquivo_url_raw"]
        filename = raw_url.split("%2F")[-1]
        dest = RAW_DIR / item["tipo"] / filename

        if args.dry_run:
            print(f"  [dry] [{item['tipo']}] {item['titulo'][:60]}")
            print(f"        → {dest}")
            skip += 1
            continue

        success = download_file(item["download_url"], dest)
        if success:
            ok += 1
        else:
            err += 1
        time.sleep(0.3)

    print(f"\nResultado: {ok} baixados, {err} erros, {skip} dry-run")
    if args.dry_run:
        print("Execute sem --dry-run para baixar os arquivos.")


if __name__ == "__main__":
    main()
