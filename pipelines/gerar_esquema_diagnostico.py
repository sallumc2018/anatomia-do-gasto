import csv
import json
import os
import re
from pathlib import Path
from datetime import datetime

DIRETORIO_SCRIPT = Path(__file__).parent
RAIZ = DIRETORIO_SCRIPT.parent
PUBLIC_DIR = RAIZ / "data" / "public"
SCHEMAS_DIR = PUBLIC_DIR / ".schemas"


def inferir_tipo(valores: list[str]) -> str:
    """Infere o tipo de dados com base em uma lista de strings de valores amostrados."""
    # Ignora valores vazios
    valores_limpos = [v.strip() for v in valores if v and v.strip()]
    if not valores_limpos:
        return "empty"

    # Regex para padrões
    is_int = True
    is_float = True
    is_date = True

    date_patterns = [
        re.compile(r"^\d{4}-\d{2}-\d{2}$"),  # YYYY-MM-DD
        re.compile(r"^\d{2}/\d{2}/\d{4}$"),  # DD/MM/YYYY
        re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"),  # ISO Datetime
    ]

    for val in valores_limpos:
        # Check Integer
        if is_int:
            try:
                int(val)
            except ValueError:
                is_int = False

        # Check Float (suporta representações BR com vírgula)
        if is_float:
            val_f = val.replace(",", ".")
            try:
                float(val_f)
            except ValueError:
                is_float = False

        # Check Date
        if is_date:
            if not any(pat.match(val) for pat in date_patterns):
                is_date = False

    if is_int:
        return "integer"
    if is_float:
        return "float/numeric"
    if is_date:
        return "date/datetime"
    return "string"


def analisar_csv(csv_path: Path) -> dict | None:
    """Analisa o arquivo CSV e retorna um dicionário com seu esquema leve."""
    try:
        tamanho_bytes = csv_path.stat().st_size
        
        # Leitura inicial para amostragem e contagem de colunas
        with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            try:
                header = next(reader)
            except StopIteration:
                # Arquivo vazio
                return None
            
            colunas = header
            linhas_amostra = []
            
            # Coleta até 50 linhas para inferência de tipos e 3 linhas para amostra
            amostra_tipagem = []
            for _ in range(50):
                try:
                    row = next(reader)
                    if len(row) < len(colunas):
                        # Pad com valores vazios se a linha for mais curta
                        row = row + [""] * (len(colunas) - len(row))
                    elif len(row) > len(colunas):
                        row = row[:len(colunas)]
                    
                    amostra_tipagem.append(row)
                    if len(linhas_amostra) < 3:
                        linhas_amostra.append(row)
                except StopIteration:
                    break

        # Contagem de linhas eficiente
        total_linhas = 0
        with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
            # wc -l equivalente rápido em python
            for _ in f:
                total_linhas += 1
        
        # Desconta o cabeçalho
        total_linhas = max(0, total_linhas - 1)

        # Transpõe a amostra de tipagem para analisar cada coluna
        tipos_colunas = {}
        for idx, col in enumerate(colunas):
            valores_coluna = [row[idx] for row in amostra_tipagem if idx < len(row)]
            tipos_colunas[col] = inferir_tipo(valores_coluna)

        # Cria a estrutura final de amostra formatada como dicionários
        amostra_formatada = []
        for row in linhas_amostra:
            amostra_formatada.append(dict(zip(colunas, row)))

        return {
            "arquivo": csv_path.name,
            "caminho_relativo": str(csv_path.relative_to(RAIZ)),
            "tamanho_bytes": tamanho_bytes,
            "linhas_dados": total_linhas,
            "colunas": colunas,
            "tipos": tipos_colunas,
            "amostra": amostra_formatada,
            "analisado_em": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Erro ao analisar {csv_path.name}: {e}")
        return None


def main():
    print(f"Varrendo diretório de dados públicos: {PUBLIC_DIR}")
    csv_files = list(PUBLIC_DIR.glob("**/*.csv"))
    
    # Filtra arquivos que estejam na própria pasta de schemas para evitar recursão circular
    csv_files = [f for f in csv_files if ".schemas" not in f.parts]
    
    print(f"Encontrados {len(csv_files)} arquivos CSV para analisar.")
    
    analisados = 0
    for csv_path in csv_files:
        rel_path = csv_path.relative_to(PUBLIC_DIR)
        dest_json = SCHEMAS_DIR / rel_path.with_suffix(".json")
        
        # Garante a criação da pasta destino
        dest_json.parent.mkdir(parents=True, exist_ok=True)
        
        # Analisa o CSV
        schema = analisar_csv(csv_path)
        if schema:
            with open(dest_json, "w", encoding="utf-8") as f:
                json.dump(schema, f, ensure_ascii=False, indent=2)
            analisados += 1

    print(f"Sucesso! {analisados} arquivos de esquema gerados em: {SCHEMAS_DIR}")


if __name__ == "__main__":
    main()
