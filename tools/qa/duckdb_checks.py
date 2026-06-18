#!/usr/bin/env python3
"""
Utilitário de validação estrutural de CSVs usando DuckDB (SQL rápido).
Se o duckdb não estiver instalado, utiliza um fallback baseado em Pandas/CSV.

Uso programático:
    from duckdb_checks import check_totals, check_duplicates, check_nulls, check_range
"""
import os
import sys
import argparse
import csv

# Tentativa de importação do DuckDB com fallback
try:
    import duckdb
    DUCKDB_AVAILABLE = True
except ImportError:
    DUCKDB_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


def _limpar_valor_monetario_pandas(val):
    """Limpa formato de moeda BR ou padrão numérico para float em Pandas."""
    if pd.isna(val) or val is None:
        return 0.0
    val_str = str(val).strip()
    if not val_str:
        return 0.0
    # Se tem ponto e vírgula/vírgula no padrão BR (ex: 1.250,50)
    if "," in val_str:
        val_str = val_str.replace(".", "").replace(",", ".")
    try:
        return float(val_str)
    except ValueError:
        return 0.0


def check_totals(file_path, column, expected_sum, tolerance=0.01):
    """
    Verifica se a soma dos valores da coluna especificada é igual ao valor esperado.
    Retorna (sucesso_bool, soma_calculada, mensagem_str).
    """
    if not os.path.exists(file_path):
        return False, 0.0, f"Arquivo não encontrado: {file_path}"

    if DUCKDB_AVAILABLE:
        try:
            # DuckDB SQL para limpar e somar
            # Remove pontos de milhares, substitui vírgula decimal por ponto e faz cast para DOUBLE
            query = f"""
                SELECT SUM(
                    TRY_CAST(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(
                                REGEXP_REPLACE(CAST("{column}" AS VARCHAR), '\\.', '', 'g'), 
                                ',', '.', 'g'
                            ),
                            '[^0-9\\.-]', '', 'g'
                        ) AS DOUBLE
                    )
                ) as total
                FROM read_csv_auto('{file_path}', all_varchar=True)
            """
            res = duckdb.query(query).fetchone()
            total_sum = res[0] if res and res[0] is not None else 0.0
            
            diff = abs(total_sum - expected_sum)
            if diff <= tolerance:
                return True, total_sum, f"Soma bateu: {total_sum:.2f} (Esperado: {expected_sum:.2f})"
            else:
                return False, total_sum, f"Divergência na soma: calculada={total_sum:.2f}, esperada={expected_sum:.2f}, diff={diff:.2f}"
        except Exception as e:
            return False, 0.0, f"Erro na query DuckDB: {e}"

    elif PANDAS_AVAILABLE:
        try:
            df = pd.read_csv(file_path)
            if column not in df.columns:
                return False, 0.0, f"Coluna '{column}' não encontrada no arquivo."
            
            soma_limpa = df[column].apply(_limpar_valor_monetario_pandas).sum()
            diff = abs(soma_limpa - expected_sum)
            if diff <= tolerance:
                return True, soma_limpa, f"Soma bateu (Pandas): {soma_limpa:.2f} (Esperado: {expected_sum:.2f})"
            else:
                return False, soma_limpa, f"Divergência na soma (Pandas): calculada={soma_limpa:.2f}, esperada={expected_sum:.2f}, diff={diff:.2f}"
        except Exception as e:
            return False, 0.0, f"Erro no fallback Pandas: {e}"
    else:
        try:
            total_sum = 0.0
            with open(file_path, newline="", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    val = row.get(column)
                    if val is not None:
                        val_str = str(val).strip()
                        if val_str:
                            if "," in val_str:
                                val_str = val_str.replace(".", "").replace(",", ".")
                            try:
                                total_sum += float(val_str)
                            except ValueError:
                                pass
            diff = abs(total_sum - expected_sum)
            if diff <= tolerance:
                return True, total_sum, f"Soma bateu (Pure Python): {total_sum:.2f} (Esperado: {expected_sum:.2f})"
            else:
                return False, total_sum, f"Divergência na soma (Pure Python): calculada={total_sum:.2f}, esperada={expected_sum:.2f}, diff={diff:.2f}"
        except Exception as e:
            return False, 0.0, f"Erro no fallback Pure Python: {e}"


def check_duplicates(file_path, key_columns):
    """
    Verifica se há chaves duplicadas no arquivo com base nas colunas chave.
    Retorna (sucesso_bool, lista_de_duplicatas, mensagem_str).
    """
    if not os.path.exists(file_path):
        return False, [], f"Arquivo não encontrado: {file_path}"
    
    if isinstance(key_columns, str):
        key_columns = [key_columns]

    key_cols_str = ", ".join(f'"{col}"' for col in key_columns)

    if DUCKDB_AVAILABLE:
        try:
            query = f"""
                SELECT {key_cols_str}, COUNT(*) as qtde
                FROM read_csv_auto('{file_path}', all_varchar=True)
                GROUP BY {key_cols_str}
                HAVING COUNT(*) > 1
                LIMIT 10
            """
            res = duckdb.query(query).fetchall()
            if not res:
                return True, [], "Sem chaves duplicadas."
            else:
                return False, res, f"Encontradas {len(res)} chaves duplicadas. Amostra: {res}"
        except Exception as e:
            return False, [], f"Erro na query DuckDB: {e}"

    elif PANDAS_AVAILABLE:
        try:
            df = pd.read_csv(file_path)
            missing = [c for c in key_columns if c not in df.columns]
            if missing:
                return False, [], f"Colunas chave ausentes no CSV: {missing}"
            
            duplicados = df[df.duplicated(subset=key_columns, keep=False)]
            if duplicados.empty:
                return True, [], "Sem chaves duplicadas (Pandas)."
            else:
                amostra = duplicados[key_columns].drop_duplicates().head(10).values.tolist()
                return False, amostra, f"Encontradas duplicatas (Pandas). Amostra: {amostra}"
        except Exception as e:
            return False, [], f"Erro no fallback Pandas: {e}"
    else:
        try:
            vistos_chaves = set()
            duplicados = []
            with open(file_path, newline="", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    chave = tuple(row.get(col, "").strip() if row.get(col) is not None else "" for col in key_columns)
                    if chave in vistos_chaves:
                        duplicados.append(chave)
                    else:
                        vistos_chaves.add(chave)
            if not duplicados:
                return True, [], "Sem chaves duplicadas (Pure Python)."
            else:
                amostra = list(set(duplicados))[:10]
                return False, amostra, f"Encontradas duplicatas (Pure Python). Amostra: {amostra}"
        except Exception as e:
            return False, [], f"Erro no fallback Pure Python: {e}"


def check_nulls(file_path, mandatory_columns):
    """
    Verifica se há valores nulos ou vazios em colunas obrigatórias.
    Retorna (sucesso_bool, dicionario_contagem_nulos, mensagem_str).
    """
    if not os.path.exists(file_path):
        return False, {}, f"Arquivo não encontrado: {file_path}"

    if isinstance(mandatory_columns, str):
        mandatory_columns = [mandatory_columns]

    resultado_nulos = {}

    if DUCKDB_AVAILABLE:
        try:
            for col in mandatory_columns:
                query = f"""
                    SELECT COUNT(*)
                    FROM read_csv_auto('{file_path}', all_varchar=True)
                    WHERE "{col}" IS NULL OR TRIM(CAST("{col}" AS VARCHAR)) = ''
                """
                count = duckdb.query(query).fetchone()[0]
                if count > 0:
                    resultado_nulos[col] = count
            
            if not resultado_nulos:
                return True, {}, "Todas as colunas mandatórias preenchidas."
            else:
                return False, resultado_nulos, f"Colunas com valores nulos/vazios: {resultado_nulos}"
        except Exception as e:
            return False, {}, f"Erro na query DuckDB: {e}"

    elif PANDAS_AVAILABLE:
        try:
            df = pd.read_csv(file_path)
            for col in mandatory_columns:
                if col not in df.columns:
                    resultado_nulos[col] = len(df)
                    continue
                vazios = df[col].isna() | (df[col].astype(str).str.strip() == "")
                count = vazios.sum()
                if count > 0:
                    resultado_nulos[col] = int(count)
            
            if not resultado_nulos:
                return True, {}, "Todas as colunas mandatórias preenchidas (Pandas)."
            else:
                return False, resultado_nulos, f"Colunas com nulos (Pandas): {resultado_nulos}"
        except Exception as e:
            return False, {}, f"Erro no fallback Pandas: {e}"
    else:
        try:
            resultado_nulos = {col: 0 for col in mandatory_columns}
            has_nulls = False
            with open(file_path, newline="", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    for col in mandatory_columns:
                        val = row.get(col)
                        if val is None or str(val).strip() == "":
                            resultado_nulos[col] += 1
                            has_nulls = True
            resultado_nulos = {k: v for k, v in resultado_nulos.items() if v > 0}
            if not has_nulls:
                return True, {}, "Todas as colunas mandatórias preenchidas (Pure Python)."
            else:
                return False, resultado_nulos, f"Colunas com nulos (Pure Python): {resultado_nulos}"
        except Exception as e:
            return False, {}, f"Erro no fallback Pure Python: {e}"


def check_range(file_path, column, min_val, max_val):
    """
    Garante que os valores numéricos de uma coluna estejam dentro do range [min_val, max_val].
    Retorna (sucesso_bool, registros_fora_do_range, mensagem_str).
    """
    if not os.path.exists(file_path):
        return False, 0, f"Arquivo não encontrado: {file_path}"

    if DUCKDB_AVAILABLE:
        try:
            query = f"""
                SELECT COUNT(*)
                FROM read_csv_auto('{file_path}', all_varchar=True)
                WHERE TRY_CAST(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(CAST("{column}" AS VARCHAR), '\\.', '', 'g'), 
                            ',', '.', 'g'
                        ),
                        '[^0-9\\.-]', '', 'g'
                    ) AS DOUBLE
                ) < {min_val} 
                OR TRY_CAST(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(CAST("{column}" AS VARCHAR), '\\.', '', 'g'), 
                            ',', '.', 'g'
                        ),
                        '[^0-9\\.-]', '', 'g'
                    ) AS DOUBLE
                ) > {max_val}
            """
            count = duckdb.query(query).fetchone()[0]
            if count == 0:
                return True, 0, f"Todos os registros da coluna '{column}' estão no range [{min_val}, {max_val}]."
            else:
                return False, count, f"Encontrados {count} registros fora do range [{min_val}, {max_val}]."
        except Exception as e:
            return False, 0, f"Erro na query DuckDB: {e}"

    elif PANDAS_AVAILABLE:
        try:
            df = pd.read_csv(file_path)
            if column not in df.columns:
                return False, 0, f"Coluna '{column}' não encontrada no arquivo."
            
            valores = df[column].apply(_limpar_valor_monetario_pandas)
            fora = (valores < min_val) | (valores > max_val)
            count = fora.sum()
            if count == 0:
                return True, 0, f"Todos no range (Pandas): [{min_val}, {max_val}]."
            else:
                return False, int(count), f"Encontrados {count} registros fora do range (Pandas): [{min_val}, {max_val}]."
        except Exception as e:
            return False, 0, f"Erro no fallback Pandas: {e}"
    else:
        try:
            count = 0
            with open(file_path, newline="", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    val = row.get(column)
                    if val is not None:
                        val_str = str(val).strip()
                        if val_str:
                            if "," in val_str:
                                val_str = val_str.replace(".", "").replace(",", ".")
                            try:
                                float_val = float(val_str)
                                if float_val < min_val or float_val > max_val:
                                    count += 1
                            except ValueError:
                                count += 1
            if count == 0:
                return True, 0, f"Todos no range (Pure Python): [{min_val}, {max_val}]."
            else:
                return False, count, f"Encontrados {count} registros fora do range (Pure Python): [{min_val}, {max_val}]."
        except Exception as e:
            return False, 0, f"Erro no fallback Pure Python: {e}"


def main():
    parser = argparse.ArgumentParser(description="Utilitário de validação estrutural DuckDB")
    parser.add_argument("arquivo", help="Caminho do arquivo CSV")
    parser.add_argument("--check", choices=["totals", "duplicates", "nulls", "range"], required=True)
    parser.add_argument("--col", help="Coluna(s) para validação (separe por vírgula para chaves duplicadas)")
    parser.add_argument("--sum", type=float, help="Soma esperada (para check=totals)")
    parser.add_argument("--min", type=float, help="Valor mínimo (para check=range)")
    parser.add_argument("--max", type=float, help="Valor máximo (para check=range)")
    args = parser.parse_args()

    # Informa o status da biblioteca
    if DUCKDB_AVAILABLE:
        print("[QA] Executando com DuckDB.")
    else:
        print("[QA] DuckDB indisponível. Usando fallback offline.")

    if args.check == "totals":
        if not args.col or args.sum is None:
            print("Erro: --col e --sum são obrigatórios para check=totals")
            sys.exit(1)
        ok, valor, msg = check_totals(args.arquivo, args.col, args.sum)
        print(msg)
        sys.exit(0 if ok else 1)

    elif args.check == "duplicates":
        if not args.col:
            print("Erro: --col é obrigatório para check=duplicates")
            sys.exit(1)
        cols = [c.strip() for c in args.col.split(",")]
        ok, duplicadas, msg = check_duplicates(args.arquivo, cols)
        print(msg)
        sys.exit(0 if ok else 1)

    elif args.check == "nulls":
        if not args.col:
            print("Erro: --col é obrigatório para check=nulls")
            sys.exit(1)
        cols = [c.strip() for c in args.col.split(",")]
        ok, nulos, msg = check_nulls(args.arquivo, cols)
        print(msg)
        sys.exit(0 if ok else 1)

    elif args.check == "range":
        if not args.col or args.min is None or args.max is None:
            print("Erro: --col, --min e --max são obrigatórios para check=range")
            sys.exit(1)
        ok, contagem, msg = check_range(args.arquivo, args.col, args.min, args.max)
        print(msg)
        sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
