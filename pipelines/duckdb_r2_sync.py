"""Sincroniza arquivos DuckDB consolidados com o bucket Cloudflare R2."""
import os
import sys
import argparse
import glob
from pathlib import Path

try:
    import duckdb
except ImportError:
    print("Erro: A biblioteca 'duckdb' é necessária. Execute com 'uv run --with duckdb'.")
    sys.exit(1)


def load_env_file():
    """Carrega variáveis do arquivo .env local se ele existir."""
    env_path = Path(".env")
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")


def get_r2_config():
    """Obtém as configurações de credenciais do R2."""
    load_env_file()
    
    config = {
        "access_key_id": os.getenv("R2_ACCESS_KEY_ID"),
        "secret_access_key": os.getenv("R2_SECRET_ACCESS_KEY"),
        "endpoint": os.getenv("R2_ENDPOINT"),
        "bucket": os.getenv("R2_BUCKET_NAME", "observatorio-omega-data")
    }
    
    # Validação mínima
    if not config["access_key_id"] or not config["secret_access_key"]:
        print("\n⚠️  Atenção: Credenciais do R2 não encontradas no ambiente ou no arquivo .env.")
        print("Crie um arquivo '.env' na raiz do projeto com as seguintes variáveis:")
        print("   R2_ENDPOINT=https://<seu-account-id>.r2.cloudflarestorage.com")
        print("   R2_ACCESS_KEY_ID=<sua-chave-de-acesso>")
        print("   R2_SECRET_ACCESS_KEY=<sua-chave-secreta>")
        print("   R2_BUCKET_NAME=<nome-do-bucket>\n")
        return None
        
    return config


def configure_duckdb_r2(con, config):
    """Instala extensões do DuckDB e configura o acesso ao Cloudflare R2 / S3."""
    print("🔌 Conectando o DuckDB ao Cloudflare R2...")
    con.execute("INSTALL httpfs;")
    con.execute("LOAD httpfs;")
    
    # Configurações do endpoint S3 / Cloudflare R2
    con.execute(f"SET s3_access_key_id='{config['access_key_id']}';")
    con.execute(f"SET s3_secret_access_key='{config['secret_access_key']}';")
    con.execute("SET s3_use_ssl=true;")
    
    # Remove protocolos se estiverem inclusos no endpoint do R2 (ex: https://)
    endpoint = config["endpoint"].replace("https://", "").replace("http://", "")
    con.execute(f"SET s3_endpoint='{endpoint}';")
    con.execute("SET s3_url_style='path';")


def compile_and_upload(config, municipio_filtro=None):
    """Consolida os arquivos CSV públicos em formato Parquet e faz upload para o Cloudflare R2."""
    con = duckdb.connect()
    configure_duckdb_r2(con, config)
    
    public_dir = Path("data/public")
    if not public_dir.exists():
        print(f"Erro: Diretório de dados públicos não encontrado: {public_dir}")
        return
        
    # Varre todos os arquivos CSV públicos do projeto, ignorando pastas ocultas (.schemas, etc)
    csv_files = [
        f for f in public_dir.glob("**/*.csv")
        if not any(part.startswith(".") for part in f.parts)
    ]
    
    if municipio_filtro:
        municipio_clean = municipio_filtro.strip().lower()
        csv_files = [f for f in csv_files if municipio_clean in f.parts]
        print(f"📌 Filtro por município ativo: {municipio_clean}")

    if not csv_files:
        print("Nenhum arquivo CSV encontrado em data/public/ para processar.")
        return
        
    print(f"\n📦 Iniciando compilação e upload de {len(csv_files)} arquivos para o R2...")
    print("-" * 60)
    
    for csv_path in csv_files:
        # Define um caminho de destino mantendo a estrutura sob o bucket R2
        relative_path = csv_path.relative_to(public_dir)
        parquet_filename = relative_path.with_suffix(".parquet")
        r2_dest_url = f"s3://{config['bucket']}/{parquet_filename}"
        
        print(f"📤 Convertendo {csv_path.name} -> {parquet_filename}...")
        try:
            # O DuckDB faz a conversão direta de CSV para Parquet escrevendo na nuvem de forma streaming (com compressão ZSTD)
            con.execute(f"""
                COPY (SELECT * FROM read_csv_auto('{csv_path}'))
                TO '{r2_dest_url}' (FORMAT PARQUET, COMPRESSION ZSTD);
            """)
            print(f"   ✅ Enviado com sucesso para: {r2_dest_url}")
        except Exception as e:
            print(f"   ❌ Erro ao converter/enviar {csv_path.name}: {e}")
            
    print("-" * 60)
    print("✨ Sincronização com Cloudflare R2 finalizada!")


def execute_remote_query(config, sql_query):
    """Executa uma query SQL diretamente nos arquivos Parquet hospedados na nuvem R2 (totalmente serverless)."""
    con = duckdb.connect()
    configure_duckdb_r2(con, config)
    
    import re
    
    # Mapeia dinamicamente tabelas virtuais para read_parquet do R2
    # r2_data -> s3://bucket/**/*.parquet
    # r2_sorocaba -> s3://bucket/sorocaba/**/*.parquet
    # r2_sorocaba_transporte -> s3://bucket/sorocaba/transporte/**/*.parquet
    def replacer(match):
        target = match.group(1).lower()
        if target == "data":
            return f"read_parquet('s3://{config['bucket']}/**/*.parquet')"
        
        parts = target.split("_")
        municipio = parts[0]
        if len(parts) > 1:
            area = "/".join(parts[1:])
            return f"read_parquet('s3://{config['bucket']}/{municipio}/{area}/**/*.parquet')"
        else:
            return f"read_parquet('s3://{config['bucket']}/{municipio}/**/*.parquet')"
            
    processed_sql = re.sub(r'\br2_([a-zA-Z0-9_]+)\b', replacer, sql_query)
    
    print(f"\n🔍 Traduzindo query remota para: s3://{config['bucket']}")
    print(f"💬 SQL Original:  {sql_query}")
    print(f"⚡ SQL Traduzido: {processed_sql}")
    print("-" * 80)
    
    try:
        res = con.execute(processed_sql).df()
        print(res.to_string())
    except Exception as e:
        # Tenta executar o SQL cru caso não use tabelas virtuais
        try:
            res = con.execute(sql_query).df()
            print(res.to_string())
        except Exception as err:
            print(f"❌ Erro ao executar query SQL: {err}")
            print(f"Detalhes do erro original: {e}")
            
    print("-" * 80)


def main():
    parser = argparse.ArgumentParser(description="DuckDB Cloudflare R2 Sync and Query Engine")
    parser.add_argument("--upload", action="store_true", help="Compila os CSVs públicos locais e envia ao R2 em formato Parquet")
    parser.add_argument("--municipio", type=str, help="Filtra o upload para um município específico (ex: sorocaba ou paulinia)")
    parser.add_argument("--query", type=str, help="Executa uma consulta SQL remota nos arquivos Parquet no R2")
    args = parser.parse_args()
    
    config = get_r2_config()
    if not config:
        sys.exit(1)
        
    if args.upload:
        compile_and_upload(config, args.municipio)
    elif args.query:
        execute_remote_query(config, args.query)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
