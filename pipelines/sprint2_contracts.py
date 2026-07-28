"""Contratos de integridade e promoção de arquivos do Sprint 2."""

from __future__ import annotations

import csv
import hashlib
import os
import re
import shutil
import tempfile
import unicodedata
from dataclasses import dataclass
from pathlib import Path


# Áreas SICONFI provam o município pela URL de origem, não por coluna própria.
_SICONFI_MUNICIPIO = ("fonte_url",)

AREA_CONTRACTS: dict[str, dict[str, tuple[str, ...]]] = {
    "transferencias_federais": {
        "municipio": (
            "ibge",
            "codigo_ibge",
            "codigo_municipio",
            "codigo_municipio_ibge",
            "municipio_ibge",
        ),
        "valor": (
            "valor",
            "valor_repasse",
            "valor_transferido",
            "vl_bruto",
            "vl_repasse",
            "vl_total",
        ),
    },
    "emendas_federais": {
        "municipio": (
            "ibge",
            "codigo_ibge",
            "codigo_municipio",
            "codigo_municipio_ibge",
            "municipio_ibge",
        ),
        "valor": (
            "valor",
            "valor_empenhado",
            "valor_pago",
            "vl_empenhado",
        ),
    },
    "fns": {
        "municipio": (
            "ibge",
            "cod_ibge",
            "co_municipio_ibge",
            "codigo_ibge",
            "codigo_municipio",
        ),
        "valor": (
            "valor",
            "vl_bruto",
            "vl_liquido",
            "vl_repasse",
        ),
    },
    # --- Áreas SICONFI (Tesouro Nacional) ---
    #
    # Estes CSVs NÃO têm coluna de município: o extrator grava uma linha por
    # função/conta/ano, sem repetir o ente. A prova de pertencimento é a própria
    # coluna `Fonte_URL`, que carrega `id_ente=<código IBGE>` da chamada feita à
    # API do Tesouro — proveniência verificável, melhor que uma coluna solta,
    # porque aponta para a requisição exata que originou cada linha.
    # `_extract_ibge` lê esse código; o resto do gate segue idêntico às demais áreas.
    "receita": {
        "municipio": _SICONFI_MUNICIPIO,
        "valor": (
            "arrecadado_acumulado",
            "arrecadado_bimestre",
            "previsto_atualizado",
            "previsto_inicial",
        ),
    },
    "executivo": {
        "municipio": _SICONFI_MUNICIPIO,
        "valor": (
            "liquidado",
            "empenhado",
            "dotacao_atualizada",
            "dotacao_inicial",
        ),
    },
    # `fiscal` guarda 6 demonstrativos diferentes no mesmo diretório (rcl,
    # rcl_capital, divida, divida_detalhada, pessoal, natureza_despesa). Eles só
    # compartilham `Ano` e `Fonte_URL`, então o grupo `valor` lista a coluna
    # característica de cada um — o validador aceita a primeira que existir.
    "fiscal": {
        "municipio": _SICONFI_MUNICIPIO,
        "valor": (
            "receitas_correntes",  # rcl
            "total_capital",       # rcl_capital
            "dcl",                 # divida, divida_detalhada
            "dtp",                 # pessoal
            "total_despesas",      # natureza_despesa
            "rcl",                 # comum a vários, fallback
        ),
    },
}


@dataclass(frozen=True)
class ValidationResult:
    valid: bool
    reason: str = ""
    data_rows: int = 0


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _normalize_header(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "_", ascii_value.strip().lower()).strip("_")


def _decode_csv(raw: bytes) -> str:
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise UnicodeError("CSV não pôde ser decodificado como UTF-8 ou Latin-1")


def _csv_reader(text: str) -> csv.DictReader:
    sample = text[:8192]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;")
    except csv.Error:
        dialect = csv.excel
    return csv.DictReader(text.splitlines(), dialect=dialect)


_ID_ENTE_RE = re.compile(r"[?&]id_ente=(\d+)", re.IGNORECASE)


def _extract_ibge(value: str) -> str:
    """Devolve o código do município contido no valor da célula.

    Nas áreas SICONFI o município não vive numa coluna própria: vem embutido na
    URL de proveniência (`Fonte_URL`) como `id_ente=<código IBGE>`. Quando o
    padrão não aparece, devolve o valor original — assim as áreas que têm coluna
    de IBGE de verdade seguem pelo mesmo caminho, sem ramificação por área.
    """
    match = _ID_ENTE_RE.search(value)
    return match.group(1) if match else value


def _ibge_matches(actual: str, expected: str) -> bool:
    actual_digits = re.sub(r"\D", "", actual)
    expected_digits = re.sub(r"\D", "", expected)
    if not actual_digits or not expected_digits:
        return False
    if len(actual_digits) == 6 and len(expected_digits) == 7:
        return actual_digits == expected_digits[:6]
    return actual_digits == expected_digits


def validate_csv(path: Path, area: str, expected_ibge: str = "") -> ValidationResult:
    if area not in AREA_CONTRACTS:
        return ValidationResult(False, f"área Sprint 2 desconhecida: {area}")
    if not path.exists():
        return ValidationResult(False, "arquivo não encontrado")
    if path.stat().st_size == 0:
        return ValidationResult(False, "arquivo vazio (0 bytes)")

    try:
        raw = path.read_bytes()
    except OSError as exc:
        return ValidationResult(False, f"erro de leitura: {exc}")

    head = raw[:512].decode("ascii", errors="ignore").lstrip().lower()
    if head.startswith(("<!doctype", "<html", "<?xml")):
        return ValidationResult(
            False,
            "conteúdo HTML/XML (resposta de erro da fonte salva como CSV)",
        )

    try:
        reader = _csv_reader(_decode_csv(raw))
        original_headers = reader.fieldnames or []
        rows = list(reader)
    except (csv.Error, UnicodeError) as exc:
        return ValidationResult(False, f"CSV inválido: {exc}")

    if not original_headers:
        return ValidationResult(False, "CSV sem header")
    if not rows:
        return ValidationResult(False, "CSV sem linhas de dados")

    normalized_headers = {
        _normalize_header(header): header for header in original_headers if header
    }
    resolved: dict[str, str] = {}
    for group, options in AREA_CONTRACTS[area].items():
        selected = next(
            (normalized_headers[option] for option in options if option in normalized_headers),
            None,
        )
        if selected is None:
            return ValidationResult(
                False,
                f"coluna de '{group}' ausente no header "
                f"(esperado: {', '.join(options[:3])}…)",
                len(rows),
            )
        resolved[group] = selected

    if expected_ibge:
        ibge_column = resolved["municipio"]
        populated = 0
        mismatches: set[str] = set()
        for row in rows:
            value = str(row.get(ibge_column, "") or "").strip()
            if not value:
                continue
            codigo = _extract_ibge(value)
            populated += 1
            if not _ibge_matches(codigo, expected_ibge):
                mismatches.add(codigo)
        if populated == 0:
            return ValidationResult(
                False,
                f"coluna IBGE '{ibge_column}' sem valores",
                len(rows),
            )
        if mismatches:
            examples = ", ".join(sorted(mismatches)[:3])
            return ValidationResult(
                False,
                f"IBGE divergente: esperado {expected_ibge}, encontrado {examples}",
                len(rows),
            )

    return ValidationResult(True, data_rows=len(rows))


def atomic_copy_verified(src: Path, dst: Path) -> str:
    """Copia, sincroniza, verifica o hash e só então substitui o destino."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    source_hash = sha256_file(src)
    temp_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            prefix=f".{dst.name}.",
            suffix=".tmp",
            dir=dst.parent,
            delete=False,
        ) as temp_handle:
            temp_path = Path(temp_handle.name)
            with src.open("rb") as source_handle:
                shutil.copyfileobj(source_handle, temp_handle)
            temp_handle.flush()
            os.fsync(temp_handle.fileno())

        copied_hash = sha256_file(temp_path)
        if copied_hash != source_hash:
            raise OSError(
                f"hash divergente após cópia: origem={source_hash}, temporário={copied_hash}"
            )

        os.replace(temp_path, dst)
        temp_path = None

        directory_fd = os.open(dst.parent, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
        return source_hash
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
