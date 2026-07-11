#!/usr/bin/env python3
"""
Sincroniza PDFs locais da pasta data/raw/ com o Cloudflare R2 usando boto3.

Uso:
    python tools/storage/sync_r2.py --dir data/raw/
    python tools/storage/sync_r2.py --dir data/raw/ --dry-run
"""
import os
import sys
import argparse
import hashlib

# Tentativa de importação do boto3 com fallback elegante
try:
    import boto3
    from botocore.client import Config
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


def calcular_md5(caminho_arquivo):
    """Calcula o hash MD5 de um arquivo local em blocos."""
    hash_md5 = hashlib.md5()
    try:
        with open(caminho_arquivo, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception as e:
        print(f"Erro ao calcular MD5 de {caminho_arquivo}: {e}", file=sys.stderr)
        return None


def obter_cliente_r2():
    """Cria e retorna o cliente S3 configurado para Cloudflare R2."""
    if not BOTO3_AVAILABLE:
        return None

    endpoint = os.getenv("CLOUDFLARE_R2_ENDPOINT_URL")
    access_key = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
    secret_key = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")

    if not all([endpoint, access_key, secret_key]):
        print("Erro: Variáveis de ambiente do Cloudflare R2 ausentes.", file=sys.stderr)
        print("Certifique-se de configurar:", file=sys.stderr)
        print("  - CLOUDFLARE_R2_ENDPOINT_URL", file=sys.stderr)
        print("  - CLOUDFLARE_R2_ACCESS_KEY_ID", file=sys.stderr)
        print("  - CLOUDFLARE_R2_SECRET_ACCESS_KEY", file=sys.stderr)
        return None

    try:
        session = boto3.Session()
        s3 = session.client(
            service_name="s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version="s3v4"),
        )
        return s3
    except Exception as e:
        print(f"Erro ao criar cliente R2: {e}", file=sys.stderr)
        return None


def sincronizar(diretorio_origem, dry_run=False, forcar=False):
    bucket_name = os.getenv("CLOUDFLARE_R2_BUCKET_NAME", "anatomia-do-gasto-pdfs")
    
    print("=== Sincronização Cloudflare R2 ===")
    print(f"Diretório local: {diretorio_origem}")
    print(f"Bucket destino:  {bucket_name}")
    if dry_run:
        print("Modo: DRY-RUN (Nenhum upload real será realizado)")
    print("====================================")

    if not BOTO3_AVAILABLE:
        print("\nAVISO: Biblioteca 'boto3' não está instalada.")
        print("Executando em MODO SIMULAÇÃO offline.\n")
        dry_run = True

    s3_client = obter_cliente_r2() if not dry_run else None
    if not dry_run and not s3_client:
        print("Falha ao inicializar o cliente R2. Mudando para modo de simulação.")
        dry_run = True

    # Varre a pasta recursivamente procurando PDFs
    arquivos_encontrados = []
    for root, _, files in os.walk(diretorio_origem):
        for file in files:
            if file.lower().endswith(".pdf"):
                caminho_completo = os.path.join(root, file)
                arquivos_encontrados.append(caminho_completo)

    print(f"Encontrados {len(arquivos_encontrados)} arquivos PDF para sincronizar.")

    uploads_com_sucesso = 0
    uploads_pulados = 0
    erros = 0

    for local_path in sorted(arquivos_encontrados):
        # Gera a chave R2 a partir do caminho relativo
        caminho_relativo = os.path.relpath(local_path, diretorio_origem)
        r2_key = caminho_relativo.replace(os.path.sep, "/")
        
        tamanho = os.path.getsize(local_path)
        tamanho_kb = tamanho // 1024
        
        # Verifica se o arquivo já existe no R2
        ja_existe = False
        if not dry_run and s3_client and not forcar:
            try:
                head = s3_client.head_object(Bucket=bucket_name, Key=r2_key)
                # Compara o tamanho
                if head.get("ContentLength") == tamanho:
                    ja_existe = True
            except ClientError as e:
                # 404 é esperado se o arquivo não existir
                if e.response["Error"]["Code"] != "404":
                    print(f"Erro ao verificar {r2_key} no R2: {e}")
            except Exception as e:
                print(f"Erro de conexão ao verificar {r2_key}: {e}")

        if ja_existe:
            print(f"  [PULADO] {caminho_relativo} (Já existe no bucket e tem o mesmo tamanho)")
            uploads_pulados += 1
            continue

        if dry_run:
            print(f"  [SIMULADO] Upload: {caminho_relativo} -> {r2_key} ({tamanho_kb} KB)")
            uploads_com_sucesso += 1
        else:
            try:
                print(f"  [ENVIANDO] {caminho_relativo} ({tamanho_kb} KB)...", end="", flush=True)
                s3_client.upload_file(
                    Filename=local_path,
                    Bucket=bucket_name,
                    Key=r2_key,
                )
                print(" OK")
                uploads_com_sucesso += 1
            except Exception as e:
                print(f" ERRO: {e}")
                erros += 1

    print("\n=== Resumo da Sincronização ===")
    print(f"  Enviados/Simulados: {uploads_com_sucesso}")
    print(f"  Pulados:            {uploads_pulados}")
    print(f"  Erros:              {erros}")
    print("================================")
    
    return erros == 0


def main():
    parser = argparse.ArgumentParser(description="Sincroniza PDFs locais com o Cloudflare R2")
    parser.add_argument("--dir", default="data/raw", help="Diretório local contendo os PDFs (padrão: data/raw)")
    parser.add_argument("--dry-run", action="store_true", help="Apenas simula o upload sem enviar dados")
    parser.add_argument("--forcar", action="store_true", help="Força o upload mesmo se o arquivo já existir no bucket")
    args = parser.parse_args()

    caminho_absoluto = os.path.abspath(args.dir)
    if not os.path.exists(caminho_absoluto):
        print(f"Erro: O diretório '{args.dir}' não existe.", file=sys.stderr)
        sys.exit(1)

    sucesso = sincronizar(caminho_absoluto, dry_run=args.dry_run, forcar=args.forcar)
    sys.exit(0 if sucesso else 1)


if __name__ == "__main__":
    main()
