"""
Baixa PDFs da Câmara Municipal de Sorocaba via API direta (porta 3115).

Descoberta 2026-06-10: a API porta 3115 responde JSON quando as requisições
incluem headers Origin e Referer do domínio principal — não precisa de Playwright.

API endpoints:
  Listar pasta: GET https://www.camarasorocaba.sp.gov.br:3115/publicFiles/folder/{id}
  Baixar arquivo: GET https://www.camarasorocaba.sp.gov.br:3115/publicFiles/file/{id}

Uso:
    python3 pipelines/baixar_camara_api.py --listar
    python3 pipelines/baixar_camara_api.py --documento subsidios
    python3 pipelines/baixar_camara_api.py --documento loa --ano 2025 2026
    python3 pipelines/baixar_camara_api.py --documento gabinete --ano 2025
    python3 pipelines/baixar_camara_api.py --documento subsidios --apenas-listar

Documentos suportados:
    loa         - Lei Orçamentária Anual (2025, 2026)
    ldo         - Lei de Diretrizes Orçamentárias (múltiplos anos)
    ppa         - Plano Plurianual
    metas       - Metas Fiscais
    lrf         - Lei de Responsabilidade Fiscal (2001-2026)
    gabinete    - Despesas de Gabinete por mês (2020-2026)
    prestacao   - Prestação de Contas Anual
    subsidios   - Valor de Subsídio e Remuneração (2016-2026)
"""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAMARA_RAW_DIR = ROOT / "data" / "raw" / "sorocaba" / "camara"
API_BASE = "https://www.camarasorocaba.sp.gov.br:3115/publicFiles"

CURL_HEADERS = [
    "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/136.0 Safari/537.36",
    "-H", "Origin: https://www.camarasorocaba.sp.gov.br",
    "-H", "Referer: https://www.camarasorocaba.sp.gov.br/",
    "-H", "Accept: application/json, text/plain, */*",
]

CATEGORIAS = {
    "loa":       ("67f6bfc6f4079ed59efc3030", "planejamento_municipal/loa"),
    "ldo":       ("67f6bf08f4079ed59efbfb83", "planejamento_municipal/ldo"),
    "ppa":       ("67f6bebbf4079ed59efbe59e", "planejamento_municipal/ppa"),
    "metas":     ("67f6c070f4079ed59efc5f51", "planejamento_municipal/metas_fiscais"),
    "lrf":       ("5e3f0d0205d7040f28b4476d", "lrf"),
    "gabinete":  ("5e3f0dc905d7040f28b44e0e", "gabinete"),
    "prestacao": ("5fbe56f8e35da368a5726e0e", "prestacao_contas"),
    "subsidios": ("5e3f0d0305d7040f28b4477b", "subsidios_remuneracao"),
}


def api_get(path: str, retries: int = 3) -> dict:
    url = f"{API_BASE}/{path}"
    for attempt in range(retries):
        r = subprocess.run(
            ["curl", "-s", "-k"] + CURL_HEADERS + [url],
            capture_output=True, text=True, timeout=20,
        )
        if r.returncode != 0:
            time.sleep(2 ** attempt)
            continue
        try:
            return json.loads(r.stdout)
        except json.JSONDecodeError:
            if attempt == retries - 1:
                raise RuntimeError(f"Resposta inválida de {url}: {r.stdout[:200]}")
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Falha após {retries} tentativas: {url}")


def listar_pasta(folder_id: str, depth: int = 0) -> list[dict]:
    data = api_get(f"folder/{folder_id}")
    objects = data.get("objects", [])
    arquivos = []

    for obj in objects:
        indent = "  " * depth
        if obj.get("isFolder"):
            desc = obj.get("description") or obj.get("name", "")
            print(f"{indent}[DIR] {desc} ({obj['_id']})")
            arquivos.extend(listar_pasta(obj["_id"], depth + 1))
        else:
            nome = obj.get("originalName") or obj.get("name", "")
            criacao = obj.get("creationDate", "")[:10]
            print(f"{indent}[FILE] {nome} ({obj['_id']}) {criacao}")
            arquivos.append({
                "id": obj["_id"],
                "name": nome,
                "folder_id": folder_id,
                "date": criacao,
                "size": obj.get("size"),
                "_folder_desc": obj.get("description", ""),
            })

    return arquivos


def _extrair_ano(texto: str) -> int | None:
    m = re.search(r"\b(20\d{2})\b", texto)
    return int(m.group(1)) if m else None


def baixar_arquivo(file_id: str, destino: Path) -> bool:
    if destino.exists() and destino.stat().st_size > 0:
        print(f"  [SKIP] {destino.name}")
        return True

    destino.parent.mkdir(parents=True, exist_ok=True)
    url = f"{API_BASE}/file/{file_id}"
    r = subprocess.run(
        ["curl", "-s", "-k", "-o", str(destino), "-w", "%{http_code}", "--max-filesize", "100M"]
        + CURL_HEADERS + [url],
        capture_output=True, text=True, timeout=60,
    )
    code = r.stdout.strip()
    size = destino.stat().st_size if destino.exists() else 0
    status = "OK" if code == "200" and size > 0 else f"ERRO {code}"
    print(f"  [{status}] {destino.name} ({size:,} bytes)")
    return code == "200" and size > 0


def coletar_por_categoria(
    categoria: str,
    anos: list[int] | None = None,
    apenas_listar: bool = False,
) -> list[Path]:
    if categoria not in CATEGORIAS:
        print(f"Categoria desconhecida: {categoria}. Opções: {', '.join(CATEGORIAS)}")
        sys.exit(1)

    folder_id, subdir = CATEGORIAS[categoria]
    out_dir = CAMARA_RAW_DIR / subdir

    print(f"\n=== {categoria.upper()} (id:{folder_id}) ===")
    data = api_get(f"folder/{folder_id}")
    objects = data.get("objects", [])

    baixados = []

    def processar_pasta(pasta_id: str, pasta_desc: str, profundidade: int = 0):
        indent = "  " * profundidade
        data = api_get(f"folder/{pasta_id}")
        objs = data.get("objects", [])

        for obj in objs:
            desc = obj.get("description") or obj.get("name", "")
            if obj.get("isFolder"):
                ano = _extrair_ano(desc) or _extrair_ano(pasta_desc)
                if anos and ano and ano not in anos:
                    print(f"{indent}  [SKIP-ANO] {desc}")
                    continue
                print(f"{indent}[DIR] {desc}")
                processar_pasta(obj["_id"], desc, profundidade + 1)
            else:
                nome_orig = obj.get("originalName") or obj.get("name", "")
                ext = Path(nome_orig).suffix.lower() if nome_orig else ".pdf"
                ano = _extrair_ano(pasta_desc) or _extrair_ano(nome_orig)
                if anos and ano and ano not in anos:
                    continue

                label = f"{categoria}_{pasta_desc.lower().replace(' ','-')}_{obj['_id'][:8]}{ext}"
                destino = out_dir / str(ano or "sem_ano") / label

                print(f"{indent}[FILE] {nome_orig or desc} → {destino.relative_to(ROOT)}")
                if not apenas_listar:
                    ok = baixar_arquivo(obj["_id"], destino)
                    if ok:
                        baixados.append(destino)

    for obj in objects:
        desc = obj.get("description") or obj.get("name", "")
        if obj.get("isFolder"):
            ano = _extrair_ano(desc)
            if anos and ano and ano not in anos:
                print(f"  [SKIP-ANO] {desc}")
                continue
            print(f"[DIR] {desc}")
            processar_pasta(obj["_id"], desc)
        else:
            nome_orig = obj.get("originalName") or obj.get("name", "")
            ext = Path(nome_orig).suffix.lower() if nome_orig else ".pdf"
            label = f"{categoria}_{obj['_id'][:8]}{ext}"
            destino = out_dir / label
            print(f"[FILE] {nome_orig} → {destino.relative_to(ROOT)}")
            if not apenas_listar:
                ok = baixar_arquivo(obj["_id"], destino)
                if ok:
                    baixados.append(destino)

    return baixados


def main():
    parser = argparse.ArgumentParser(description="Baixa PDFs da Câmara de Sorocaba via API")
    parser.add_argument("--documento", choices=list(CATEGORIAS), help="Categoria a baixar")
    parser.add_argument("--ano", type=int, nargs="+", help="Filtrar por ano(s)")
    parser.add_argument("--listar", action="store_true", help="Listar todas as categorias raiz")
    parser.add_argument("--apenas-listar", action="store_true", help="Listar arquivos sem baixar")
    args = parser.parse_args()

    if args.listar:
        print("Categorias raiz disponíveis na API:\n")
        data = api_get("folder")
        for obj in data.get("objects", []):
            print(f"  {obj.get('description',''):60s} -> {obj['_id']}")
        return

    if not args.documento:
        parser.print_help()
        sys.exit(1)

    baixados = coletar_por_categoria(
        args.documento,
        anos=args.ano,
        apenas_listar=args.apenas_listar,
    )

    if not args.apenas_listar:
        print(f"\n✓ {len(baixados)} arquivo(s) baixado(s)")


if __name__ == "__main__":
    main()
