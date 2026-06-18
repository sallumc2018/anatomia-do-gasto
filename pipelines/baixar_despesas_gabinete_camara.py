"""
Baixa PDFs mensais de Despesas de Gabinete da Câmara Municipal de Sorocaba.

Fonte: https://www.camarasorocaba.sp.gov.br/arquivos_publicos.html?id=5e3f0dc905d7040f28b44e0e
Arquivos: 12 PDFs/ano (jan–dez), 2020–2026
Destino: data/raw/sorocaba/camara/gabinete/{ano}/gabinete_sorocaba_{ano}_{mes:02d}.pdf
"""

import asyncio
import re
import pathlib
import urllib.request
import urllib.error
import sys

BASE = "https://www.camarasorocaba.sp.gov.br"
FILE_BASE = "https://www.camarasorocaba.sp.gov.br:3115/publicFiles/file"

YEAR_IDS = {
    2020: "5e4e70bff41c8a1e1d8d24e9",
    2021: "6026aa116db332166732e66c",
    2022: "620ce5c4876faaa2f3a325ba",
    2023: "64063df73c1532f31863841d",
    2024: "65ddc487c318f75dad65e6cf",
    2025: "67bf275d2eec7c46f34483f4",
    2026: "699c7cffc403d903bfce2644",
}

MESES = [
    "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

ROOT = pathlib.Path(__file__).parent.parent
RAW_DIR = ROOT / "data" / "raw" / "sorocaba" / "camara" / "gabinete"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


async def get_year_file_ids(page, year: int) -> list[str]:
    """Navega na pasta do ano e retorna lista de IDs de arquivo (ordem jan–dez)."""
    folder_id = YEAR_IDS[year]
    url = f"{BASE}/arquivos_publicos.html?id={folder_id}"
    await page.goto(url, timeout=20000, wait_until="networkidle")
    await page.wait_for_timeout(1500)
    html = await page.content()
    ids = re.findall(rf"{re.escape(FILE_BASE)}/([a-f0-9]+)", html)
    return ids


def download_file(file_id: str, dest: pathlib.Path) -> bool:
    """Baixa um arquivo via HTTP direto na porta 3115."""
    if dest.exists() and dest.stat().st_size > 10_000:
        return True  # já baixado
    url = f"{FILE_BASE}/{file_id}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp, open(dest, "wb") as f:
            f.write(resp.read())
        return True
    except urllib.error.URLError as e:
        print(f"    ERRO: {e}", file=sys.stderr)
        return False


async def main():
    from playwright.async_api import async_playwright

    anos = list(YEAR_IDS.keys())
    print(f"Anos: {anos}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(user_agent=UA)
        page = await ctx.new_page()

        for year in anos:
            year_dir = RAW_DIR / str(year)
            year_dir.mkdir(parents=True, exist_ok=True)

            print(f"\n[{year}] Buscando IDs...")
            file_ids = await get_year_file_ids(page, year)
            print(f"  {len(file_ids)} arquivos encontrados")

            if len(file_ids) == 0:
                print(f"  AVISO: sem arquivos para {year}")
                continue

            for idx, file_id in enumerate(file_ids):
                mes = idx + 1
                nome_mes = MESES[idx] if idx < len(MESES) else f"mes{mes:02d}"
                dest = year_dir / f"gabinete_sorocaba_{year}_{mes:02d}_{nome_mes}.pdf"
                ok = download_file(file_id, dest)
                size = dest.stat().st_size // 1024 if dest.exists() else 0
                status = f"OK ({size} KB)" if ok else "FALHOU"
                print(f"  {mes:02d}/{year} {nome_mes:<12} {file_id[:8]}... -> {status}")

        await browser.close()

    print("\nDownload concluído.")


if __name__ == "__main__":
    asyncio.run(main())
