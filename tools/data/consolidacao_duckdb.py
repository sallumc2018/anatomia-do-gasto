#!/usr/bin/env python3
"""
Consolida os dados de múltiplos municípios de data/public/ em tabelas unificadas.
Gera um banco de dados unificado.

Uso:
    python tools/data/consolidacao_duckdb.py
"""
import os
import sys
import re
import sqlite3
import csv

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


def extrair_ano(nome_arquivo):
    """Extrai um ano de 4 dígitos do nome do arquivo."""
    match = re.search(r"_(\d{4})\.csv$", nome_arquivo, re.IGNORECASE)
    if match:
        return int(match.group(1))
    # Fallback caso não ache no final
    match = re.search(r"\b(20\d{2})\b", nome_arquivo)
    if match:
        return int(match.group(1))
    return None


def deduplicar_colunas(df):
    """Renomeia colunas duplicadas (case-insensitively) para evitar erros no SQLite."""
    cols = []
    seen = set()
    for col in df.columns:
        col_lower = col.lower()
        if col_lower in seen:
            suffix = 1
            new_col = f"{col}_{suffix}"
            while new_col.lower() in seen:
                suffix += 1
                new_col = f"{col}_{suffix}"
            cols.append(new_col)
            seen.add(new_col.lower())
        else:
            cols.append(col)
            seen.add(col_lower)
    df.columns = cols
    return df


def consolidar_duckdb(caminhos_csv, db_path):
    """Realiza a consolidação de dados usando o DuckDB."""
    print(f"[DuckDB] Criando/atualizando banco consolidado em {db_path}")
    con = duckdb.connect(db_path)
    
    # Agrupa CSVs por categoria
    categorias = {}
    for local_path, municipio, categoria, ano in caminhos_csv:
        if categoria not in categorias:
            categorias[categoria] = []
        categorias[categoria].append((local_path, municipio, ano))

    for cat, items in categorias.items():
        table_name = f"consolidado_{cat}"
        print(f"  Consolidando categoria '{cat}' na tabela '{table_name}' ({len(items)} arquivos)...")
        
        con.execute(f"DROP TABLE IF EXISTS {table_name}")
        
        queries = []
        for csv_file, muni, ano in items:
            try:
                rel = con.from_csv_auto(csv_file)
                cols = rel.columns
                
                # Monta a projeção evitando colunas com colisão
                projection = []
                projection.append(f"'{muni}' AS municipio")
                projection.append(f"{ano if ano else 'NULL'} AS ano")
                
                seen_cols = {"municipio", "ano"}
                for col in cols:
                    col_lower = col.lower()
                    if col_lower not in seen_cols:
                        projection.append(f'"{col}"')
                        seen_cols.add(col_lower)
                    else:
                        suffix = 1
                        new_col = f"{col}_{suffix}"
                        while new_col.lower() in seen_cols:
                            suffix += 1
                            new_col = f"{col}_{suffix}"
                        projection.append(f'"{col}" AS "{new_col}"')
                        seen_cols.add(new_col.lower())
                
                proj_str = ", ".join(projection)
                queries.append(f"SELECT {proj_str} FROM read_csv_auto('{csv_file}', all_varchar=True)")
            except Exception as e:
                print(f"    Erro ao processar {csv_file} no DuckDB: {e}", file=sys.stderr)
        
        if queries:
            union_query = "\nUNION ALL\n".join(queries)
            create_query = f"CREATE TABLE {table_name} AS {union_query}"
            try:
                con.execute(create_query)
                count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                print(f"    Tabela '{table_name}' criada com {count} registros.")
            except Exception as e:
                print(f"    Erro ao consolidar tabela {table_name}: {e}", file=sys.stderr)
            
    con.close()


def consolidar_sqlite(caminhos_csv, db_path):
    """Realiza a consolidação de dados usando SQLite (com Pandas ou Pure Python fallback)."""
    print(f"[SQLite Fallback] Criando/atualizando banco consolidado em {db_path}")
    
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception as e:
            print(f"Erro ao remover banco antigo: {e}", file=sys.stderr)

    conn = sqlite3.connect(db_path)
    
    categorias = {}
    for local_path, municipio, categoria, ano in caminhos_csv:
        if categoria not in categorias:
            categorias[categoria] = []
        categorias[categoria].append((local_path, municipio, ano))

    if PANDAS_AVAILABLE:
        for cat, items in categorias.items():
            table_name = f"consolidado_{cat}"
            print(f"  Consolidando categoria '{cat}' na tabela '{table_name}' ({len(items)} arquivos)...")
            
            dfs_para_unir = []
            for csv_file, muni, ano in items:
                try:
                    df = pd.read_csv(csv_file, dtype=str)
                    
                    rename_dict = {}
                    for col in df.columns:
                        if col.lower() == "ano":
                            rename_dict[col] = "ano"
                        elif col.lower() == "municipio":
                            rename_dict[col] = "municipio"
                    if rename_dict:
                        df = df.rename(columns=rename_dict)

                    if "municipio" not in df.columns:
                        df.insert(0, "municipio", muni)
                    else:
                        df["municipio"] = muni

                    if "ano" not in df.columns:
                        df.insert(1, "ano", str(ano) if ano else "")
                    else:
                        df["ano"] = str(ano) if ano else df["ano"]
                        
                    dfs_para_unir.append(df)
                except Exception as e:
                    print(f"    Erro ao ler {csv_file}: {e}", file=sys.stderr)
            
            if dfs_para_unir:
                try:
                    df_consolidado = pd.concat(dfs_para_unir, ignore_index=True)
                    df_consolidado = deduplicar_colunas(df_consolidado)
                    
                    df_consolidado.to_sql(table_name, conn, index=False, if_exists="replace")
                    print(f"    Tabela '{table_name}' criada com {len(df_consolidado)} registros.")
                except Exception as e:
                    print(f"    Erro ao gravar tabela {table_name} no SQLite: {e}", file=sys.stderr)
    else:
        print("  Pandas não disponível. Usando fallback de consolidação Pure Python/CSV.")
        cursor = conn.cursor()
        for cat, items in categorias.items():
            table_name = f"consolidado_{cat}"
            print(f"  Consolidando categoria '{cat}' na tabela '{table_name}' ({len(items)} arquivos)...")
            
            # Coleta a união de todas as colunas
            colunas = ["municipio", "ano"]
            seen_lower = {"municipio", "ano"}
            for csv_file, muni, ano in items:
                try:
                    with open(csv_file, encoding="utf-8-sig", errors="replace") as f:
                        reader = csv.reader(f)
                        headers = next(reader, [])
                        for h in headers:
                            h_clean = h.strip()
                            if not h_clean:
                                continue
                            h_lower = h_clean.lower()
                            if h_lower == "municipio" or h_lower == "ano":
                                continue
                            if h_lower not in seen_lower:
                                colunas.append(h_clean)
                                seen_lower.add(h_lower)
                            else:
                                suffix = 1
                                new_col = f"{h_clean}_{suffix}"
                                while new_col.lower() in seen_lower:
                                    suffix += 1
                                    new_col = f"{h_clean}_{suffix}"
                                colunas.append(new_col)
                                seen_lower.add(new_col.lower())
                except Exception as e:
                    print(f"    Erro ao ler cabeçalho de {csv_file}: {e}", file=sys.stderr)

            if len(colunas) <= 2:
                continue

            cols_sql = ", ".join(f'"{col}" TEXT' for col in colunas)
            cursor.execute(f'DROP TABLE IF EXISTS "{table_name}"')
            cursor.execute(f'CREATE TABLE "{table_name}" ({cols_sql})')
            
            total_records = 0
            for csv_file, muni, ano in items:
                try:
                    with open(csv_file, encoding="utf-8-sig", errors="replace") as f:
                        reader = csv.DictReader(f)
                        headers = reader.fieldnames or []
                        header_mapping = {}
                        seen_lower_file = {"municipio", "ano"}
                        for h in headers:
                            h_clean = h.strip()
                            if not h_clean:
                                continue
                            h_lower = h_clean.lower()
                            if h_lower == "municipio" or h_lower == "ano":
                                continue
                            if h_lower not in seen_lower_file:
                                header_mapping[h_clean] = h_clean
                                seen_lower_file.add(h_lower)
                            else:
                                suffix = 1
                                new_col = f"{h_clean}_{suffix}"
                                while new_col.lower() in seen_lower_file:
                                    suffix += 1
                                    new_col = f"{h_clean}_{suffix}"
                                header_mapping[h_clean] = new_col
                                seen_lower_file.add(new_col.lower())
                        
                        rows_to_insert = []
                        for row in reader:
                            insert_row = {col: "" for col in colunas}
                            insert_row["municipio"] = muni
                            insert_row["ano"] = str(ano) if ano else ""
                            for k, v in row.items():
                                if k and k.strip():
                                    mapped_k = header_mapping.get(k.strip())
                                    if mapped_k in insert_row:
                                        insert_row[mapped_k] = v.strip() if v else ""
                            rows_to_insert.append(tuple(insert_row[col] for col in colunas))
                        
                        if rows_to_insert:
                            placeholders = ", ".join(["?"] * len(colunas))
                            cols_insert = ", ".join(f'"{col}"' for col in colunas)
                            cursor.executemany(f'INSERT INTO "{table_name}" ({cols_insert}) VALUES ({placeholders})', rows_to_insert)
                            total_records += len(rows_to_insert)
                except Exception as e:
                    print(f"    Erro ao inserir dados de {csv_file}: {e}", file=sys.stderr)
            print(f"    Tabela '{table_name}' criada com {total_records} registros.")
            conn.commit()

    conn.close()
    return True


def main():
    diretorio_dados = "data/public"
    if not os.path.exists(diretorio_dados):
        print(f"Erro: Diretório '{diretorio_dados}' não existe.", file=sys.stderr)
        sys.exit(1)

    caminhos_csv = []
    
    for municipio in sorted(os.listdir(diretorio_dados)):
        muni_dir = os.path.join(diretorio_dados, municipio)
        if not os.path.isdir(muni_dir) or municipio in ["agentes", "auditoria", "linked"]:
            continue
            
        for categoria in sorted(os.listdir(muni_dir)):
            cat_dir = os.path.join(muni_dir, categoria)
            if not os.path.isdir(cat_dir):
                continue
                
            saida_dir = os.path.join(cat_dir, "saida")
            if not os.path.exists(saida_dir):
                saida_dir = cat_dir
                
            for arquivo in sorted(os.listdir(saida_dir)):
                if arquivo.lower().endswith(".csv"):
                    csv_path = os.path.join(saida_dir, arquivo)
                    ano = extrair_ano(arquivo)
                    caminhos_csv.append((csv_path, municipio, categoria, ano))

    print(f"Encontrados {len(caminhos_csv)} arquivos CSV para consolidação.")
    if not caminhos_csv:
        print("Nenhum arquivo encontrado para processar.")
        sys.exit(0)

    if DUCKDB_AVAILABLE:
        db_path = "data/consolidado.db"
        consolidar_duckdb(caminhos_csv, db_path)
    else:
        print("[Aviso] DuckDB não instalado no ambiente. Usando SQLite/Pandas.")
        db_path = "data/consolidado.sqlite"
        sucesso = consolidar_sqlite(caminhos_csv, db_path)
        if not sucesso:
            sys.exit(1)

    print("Consolidação concluída com sucesso!")
    sys.exit(0)


if __name__ == "__main__":
    main()
