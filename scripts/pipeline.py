"""
Executa o pipeline completo de saúde e educação para um ou mais anos:
  1. Baixar PDFs do portal (saúde + educação)
  2. Extrair dados para CSV
  3. Verificar integridade dos dados de saúde
  4. Gerar HTML

Uso:
    python pipeline.py --ano 2024
    python pipeline.py --ano 2024 --ano 2025
    python pipeline.py --ano 2024 --pular-download   # PDFs ja existem localmente
    python pipeline.py --ano 2024 --forcar           # re-baixa e re-processa tudo
"""
import argparse
import os
import subprocess
import sys

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON      = sys.executable

ETAPAS = [
    ('Download',          'baixar_pdfs.py'),
    ('Extracao',          'extrator_saude.py'),
    ('RREO',              'extrator_rreo.py'),
    ('BaixarRREO',        'baixar_rreo_sus.py'),
    ('ExtracaoRREO',      'extrator_rreo_sus.py'),
    ('DownloadEducacao',  'baixar_pdfs_educacao.py'),
    ('ExtracaoEducacao',  'extrator_educacao.py'),
    ('Verificacao',       os.path.join('testes', 'verificar_dados.py')),
    ('HTML',              'gerar_html.py'),
    ('Index',             'gerar_index.py'),
]

ETAPAS_DOWNLOAD = {'Download', 'BaixarRREO', 'DownloadEducacao'}
ETAPAS_SEM_ANO  = {'Index'}


def rodar(script, args_extras):
    caminho = os.path.join(SCRIPTS_DIR, script)
    cmd = [PYTHON, caminho] + args_extras
    resultado = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    return resultado


def processar_ano(ano, pular_download, forcar):
    print(f"\n{'='*50}")
    print(f"  Pipeline — Ano {ano}")
    print(f"{'='*50}")

    for nome_etapa, script in ETAPAS:
        if nome_etapa in ETAPAS_DOWNLOAD and pular_download:
            print(f"\n[{nome_etapa}] Pulado (--pular-download)")
            continue

        args = [] if nome_etapa in ETAPAS_SEM_ANO else ['--ano', str(ano)]
        if nome_etapa in ETAPAS_DOWNLOAD and forcar:
            args.append('--forcar')

        print(f"\n[{nome_etapa}]")
        resultado = rodar(script, args)

        if resultado.stdout:
            for linha in resultado.stdout.strip().splitlines():
                print(f"  {linha}")

        if resultado.returncode != 0:
            print(f"\n  FALHA na etapa '{nome_etapa}'.")
            if resultado.stderr:
                print("  Erro:")
                for linha in resultado.stderr.strip().splitlines():
                    print(f"    {linha}")
            return False

    print(f"\nPipeline {ano} concluido com sucesso.")
    return True


def main():
    parser = argparse.ArgumentParser(description='Pipeline completo de dados de saude e educacao de Sorocaba')
    parser.add_argument('--ano', type=int, action='append', required=True,
                        help='Ano a processar (pode repetir para multiplos anos)')
    parser.add_argument('--pular-download', action='store_true',
                        help='Nao baixa os PDFs (usa os que ja existem na pasta entrada)')
    parser.add_argument('--forcar', action='store_true',
                        help='Re-baixa e re-processa mesmo que os arquivos ja existam')
    args = parser.parse_args()

    anos = sorted(set(args.ano))
    sucessos = []
    falhas   = []

    for ano in anos:
        ok = processar_ano(ano, args.pular_download, args.forcar)
        (sucessos if ok else falhas).append(ano)

    print(f"\n{'='*50}")
    print(f"Resumo: {len(sucessos)} ok, {len(falhas)} com falha")
    if sucessos:
        print(f"  OK:    {sucessos}")
    if falhas:
        print(f"  Falha: {falhas}")

    sys.exit(1 if falhas else 0)


if __name__ == '__main__':
    main()
