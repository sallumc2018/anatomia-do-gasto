#!/usr/bin/env python3
"""
Gate gramatical: detecta texto em português sem acentuação adequada em arquivos TSX/TS.

Escaneia strings literais exibidas ao usuário e reporta palavras sem acento
que deveriam ter, com base em um glossário de termos do domínio fiscal/público.

Uso:
    python3 tools/gates/check_grammar.py                    # escaneia apps/web inteiro
    python3 tools/gates/check_grammar.py apps/web/app/      # diretório específico
    python3 tools/gates/check_grammar.py apps/web/app/api/dados/page.tsx
    python3 tools/gates/check_grammar.py --strict           # retorna exit 1 se encontrar erros
    python3 tools/gates/check_grammar.py --json             # saída JSON para automação
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

# ---------------------------------------------------------------------------
# Glossário: forma-errada → forma-correta
# Adicione aqui conforme o vocabulário do projeto cresce.
# ---------------------------------------------------------------------------
CORRECTIONS: dict[str, str] = {
    # verbos / substantivos com acento nasal
    "publicacao": "publicação",
    "validacao": "validação",
    "extracao": "extração",
    "normalizacao": "normalização",
    "documentacao": "documentação",
    "visualizacao": "visualização",
    "composicao": "composição",
    "composicoes": "composições",
    "composicao": "composição",
    "funcao": "função",
    "subfuncao": "subfunção",
    "atualizacao": "atualização",
    "priorizacao": "priorização",
    "priorizacoes": "priorizações",
    "execucao": "execução",
    "execucoes": "execuções",
    "informacao": "informação",
    "informacoes": "informações",
    "operacao": "operação",
    "operacoes": "operações",
    "classificacao": "classificação",
    "publicacoes": "publicações",
    "anotacao": "anotação",
    "orcamento": "orçamento",
    "orcamentaria": "orçamentária",
    "orcamentario": "orçamentário",
    "orcamentarios": "orçamentários",
    # palavras com á / ê / é / í / ó / ú
    "catalogo": "catálogo",
    "catalogo": "catálogo",
    "analitico": "analítico",
    "analitica": "analítica",
    "verificaveis": "verificáveis",
    "disponivel": "disponível",
    "disponiveis": "disponíveis",
    "publico": "público",
    "publica": "pública",
    "publicos": "públicos",
    "publicas": "públicas",
    "civico": "cívico",
    "cidada": "cidadã",
    "cidadao": "cidadão",
    "tecnica": "técnica",
    "tecnico": "técnico",
    "tecnicos": "técnicos",
    "periodico": "periódico",
    "repositorio": "repositório",
    "basico": "básico",
    "basica": "básica",
    "historico": "histórico",
    "historica": "histórica",
    "sintetico": "sintético",
    "analitico": "analítico",
    "especifico": "específico",
    "explicita": "explícita",
    "explicito": "explícito",
    "copia": "cópia",
    "copias": "cópias",
    "previdenciario": "previdenciário",
    "previdenciaria": "previdenciária",
    "previdenciarios": "previdenciários",
    # acentos graves / circunflexos
    "orgao": "órgão",
    "estagio": "estágio",
    "propria": "própria",
    "proprio": "próprio",
    "proprios": "próprios",
    # palavras com ã / ão
    "nao ": "não ",
    "estao ": "estão ",
    "pendencias": "pendências",
    "pendencia": "pendência",
    "frequencia": "frequência",
    "audiencia": "audiência",
    "audiencias": "audiências",
    "transparencia": "transparência",
    "diferenca": "diferença",
    "referencia": "referência",
    "referencias": "referências",
    "sequencia": "sequência",
    "sequencias": "sequências",
    # ç
    "seguranca": "segurança",
    "municipio": "município",
    "municipios": "municípios",
    # saúde
    "saude": "saúde",
    # câmara
    "camara": "câmara",
    "camaras": "câmaras",
    # dívida
    "divida": "dívida",
    "dividas": "dívidas",
    # área / temática / região
    "tematica": "temática",
    "tematico": "temático",
    "regiao": "região",
    "regioes": "regiões",
    # página
    "pagina": "página",
    "paginas": "páginas",
    # educação / saúde (atenção)
    "educacao": "educação",
    "atencao": "atenção",
    "atencao basica": "atenção básica",
}

# ---------------------------------------------------------------------------
# Contextos a excluir (linhas que contêm estes padrões são ignoradas)
# ---------------------------------------------------------------------------
SKIP_LINE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^\s*//"),                          # comentário JS
    re.compile(r"^\s*\*"),                          # comentário JSDoc
    re.compile(r"import\s+"),                       # linhas de import
    re.compile(r"from\s+[\"']"),                    # from "..."
    re.compile(r"className\s*="),                   # CSS classes
    re.compile(r"href\s*="),                        # URLs em href
    re.compile(r"data-\w+"),                        # atributos data-*
    re.compile(r"\.(csv|json|ts|tsx|md|py|sh)\b"),  # extensões de arquivo
    re.compile(r"keywords:\s*\["),                  # início de array keywords (Théo)
    re.compile(r"^\s*\"[a-zA-Z_][a-zA-Z_\s]*\"\s*:"),  # chave de objeto (ex: "saude": ..., "atencao basica": ...)
    re.compile(r"\/api\/"),                         # API paths
    re.compile(r"data\/public"),                    # referências a data/public
    re.compile(r"SICONFI|SIOPS|RREO|DCA|RGF|ASPS|FUNDEB|RPPS|LOA"),  # siglas técnicas
    re.compile(r"https?://"),                       # URLs externas (domínios fixos)
    re.compile(r"canonical\s*:"),                   # canonical URL meta
    re.compile(r"alternates\s*:"),                  # Next.js alternates
    re.compile(r"\w+\.\w+\.\w+/"),                  # domínios de terceiros (fazenda.sorocaba.sp.gov.br/...)
    re.compile(r"SITE_URL|BASE_URL"),               # construções de URL em template literals
    re.compile(r"relatorio\/:"),                    # paths de relatório (next.config)
    re.compile(r"r\.funcao\s*==="),                 # comparações com chaves CSV
    re.compile(r"TOTAL_ROW\["),                     # lookup por chave CSV
    re.compile(r"[A-Z_]{4,}"),                      # strings ALL_CAPS (nomes de colunas CSV)
    re.compile(r"key:\s*\""),                       # campo key: "..." (chave de lookup React/dados)
    re.compile(r"gov\.br"),                         # domínios gov.br (URLs governamentais)
    re.compile(r"\.sp\.gov"),                       # domínios .sp.gov.*
    re.compile(r"\w+Map\["),                        # lookup em mapa de dados (funcMap["..."])
    re.compile(r"\w+-relatorio-api\b"),             # API de relatório SIOPS/SICONFI
]

# Palavras ambíguas que também existem como verbos ou partes de nomes — excluir de correção
# quando aparecem em contexto verbal (seguidas de espaço e sujeito de 3ª pessoa)
SKIP_WORD_CONTEXTS: list[re.Pattern[str]] = [
    re.compile(r"\bprojeto publica\b"),
    re.compile(r"\bgoverno (ja )?publica\b"),
    re.compile(r"\bcamara publica\b"),
    re.compile(r"\bja publica\b"),
    re.compile(r"\b(nao|não) publica\b"),
    re.compile(r"\bque publica\b"),
    re.compile(r"\btrata e publica\b"),
    re.compile(r"\bsite[,;.]?\s*publica"),
    re.compile(r"quando .{1,20}publica"),           # "quando o governo publica"
]

# Contexto "keywords array" — ignora linhas dentro de arrays de keywords
KEYWORDS_SECTION_START = re.compile(r"keywords:\s*\[")
KEYWORDS_SECTION_END = re.compile(r"\],")

# ---------------------------------------------------------------------------
# Extrai strings literais de uma linha TSX/TS
# ---------------------------------------------------------------------------
_STRING_RE = re.compile(r'(?:"([^"\\]*(?:\\.[^"\\]*)*)"|\'([^\'\\]*(?:\\.[^\'\\]*)*)\'|`([^`\\]*(?:\\.[^`\\]*)*)`)')


def extract_strings(line: str) -> list[str]:
    return [
        m.group(1) or m.group(2) or m.group(3) or ""
        for m in _STRING_RE.finditer(line)
        if (m.group(1) or m.group(2) or m.group(3) or "").strip()
    ]


def should_skip_line(line: str) -> bool:
    return any(p.search(line) for p in SKIP_LINE_PATTERNS)


# ---------------------------------------------------------------------------
# Verifica uma string contra o glossário
# ---------------------------------------------------------------------------
_TEMPLATE_EXPR_RE = re.compile(r"\$\{[^}]*\}")


def check_string(text: str) -> list[tuple[str, str]]:
    """Retorna lista de (palavra-errada, sugestão) encontradas no texto."""
    # Remove interpolações de template literal (${...}) — são identificadores de código
    cleaned = _TEMPLATE_EXPR_RE.sub(" ", text)
    issues: list[tuple[str, str]] = []
    text_lower = cleaned.lower()
    for wrong, right in CORRECTIONS.items():
        # Usa word-boundary simples (espaço/início/fim ou pontuação)
        pattern = r"(?<![a-záàãâéêíóôõúüç])(" + re.escape(wrong) + r")(?![a-záàãâéêíóôõúüç])"
        for m in re.finditer(pattern, text_lower):
            # Determina o trecho original (preservando capitalização) no texto limpo
            start, end = m.start(1), m.end(1)
            original = cleaned[start:end]
            # Preserva capitalização inicial
            suggestion = right[0].upper() + right[1:] if original[0].isupper() else right
            issues.append((original, suggestion))
    return issues


# ---------------------------------------------------------------------------
# Escaneia um arquivo
# ---------------------------------------------------------------------------
def scan_file(path: Path) -> list[dict]:
    findings: list[dict] = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return findings

    in_keywords = False
    for lineno, line in enumerate(lines, 1):
        # Rastreia entrada/saída de blocos keywords: [...]
        if KEYWORDS_SECTION_START.search(line):
            in_keywords = True
        if in_keywords and KEYWORDS_SECTION_END.search(line):
            in_keywords = False
            continue
        if in_keywords:
            continue

        if should_skip_line(line):
            continue

        for s in extract_strings(line):
            # Ignora strings muito curtas ou que parecem IDs/hashes
            if len(s) < 5 or re.match(r"^[\w\-_/]+$", s):
                continue
            for wrong, suggestion in check_string(s):
                # Filtra contextos verbais / falsos positivos
                s_lower = s.lower()
                if any(p.search(s_lower) for p in SKIP_WORD_CONTEXTS):
                    continue
                findings.append({
                    "file": str(path.relative_to(ROOT)),
                    "line": lineno,
                    "text": s[:120],
                    "wrong": wrong,
                    "suggestion": suggestion,
                })
    return findings


# ---------------------------------------------------------------------------
# Coleta arquivos a escanear
# ---------------------------------------------------------------------------
def collect_files(targets: list[str]) -> list[Path]:
    default_dir = ROOT / "apps" / "web"
    paths: list[Path] = []
    for t in (targets or [str(default_dir)]):
        p = Path(t)
        if not p.is_absolute():
            p = ROOT / p
        if p.is_file():
            paths.append(p)
        elif p.is_dir():
            paths.extend(sorted(p.rglob("*.tsx")) + sorted(p.rglob("*.ts")))
    return [f for f in paths if ".next" not in str(f) and "node_modules" not in str(f)]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(description="Verifica acentuação de texto PT-BR em TSX/TS")
    parser.add_argument("targets", nargs="*", help="Arquivos ou diretórios (padrão: apps/web)")
    parser.add_argument("--strict", action="store_true", help="Retorna exit 1 se houver erros")
    parser.add_argument("--json", action="store_true", help="Saída em JSON")
    args = parser.parse_args()

    files = collect_files(args.targets)
    all_findings: list[dict] = []
    for f in files:
        all_findings.extend(scan_file(f))

    if args.json:
        print(json.dumps(all_findings, ensure_ascii=False, indent=2))
        return 1 if (args.strict and all_findings) else 0

    if not all_findings:
        print("✓ check_grammar: nenhum problema de acentuação encontrado.")
        return 0

    # Agrupa por arquivo
    by_file: dict[str, list[dict]] = {}
    for f in all_findings:
        by_file.setdefault(f["file"], []).append(f)

    print(f"⚠ check_grammar: {len(all_findings)} ocorrência(s) em {len(by_file)} arquivo(s):\n")
    for filepath, items in sorted(by_file.items()):
        print(f"  {filepath}")
        for item in items:
            print(f"    L{item['line']:>4}  {item['wrong']!r:25} → {item['suggestion']!r}")
            print(f"          {item['text'][:100]}")
        print()

    if args.strict:
        print(f"GATE FALHOU: {len(all_findings)} problema(s) de acentuação.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
