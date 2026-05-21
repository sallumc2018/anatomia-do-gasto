from __future__ import annotations

import csv
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFESTS_DIR = ROOT / "data" / "manifests"
INVENTARIO = MANIFESTS_DIR / "inventario_fontes_sorocaba.csv"
SAIDA_MANIFEST = MANIFESTS_DIR / "sorocaba_100_auditavel.csv"
SAIDA_LAI = ROOT / "docs" / "lai-sorocaba-100.md"
SAIDA_OPERACAO = ROOT / "docs" / "sorocaba-100-operacao.md"
EXECUCAO_LOG = MANIFESTS_DIR / "sorocaba_100_execucao_2026-05-21.csv"

PERIODO_ALVO = "2020-2026"
DATA_REFERENCIA = date.today().isoformat()


@dataclass(frozen=True)
class Automacao:
    metodo: str
    script: str
    comando: str
    bloqueio: str = ""


AUTOMACOES: dict[tuple[str, str, str], Automacao] = {
    ("Prefeitura", "orcamento", "ppa"): Automacao(
        "portal_pdf_html",
        "a_criar",
        "inventariar links de PPA por ano e criar coletor dedicado",
        "Inventario de links por ano ainda precisa ser confirmado no portal; coletor dedicado nao existe.",
    ),
    ("Prefeitura", "orcamento", "ldo"): Automacao(
        "portal_pdf_html",
        "a_criar",
        "inventariar links de LDO por ano e criar coletor dedicado",
        "Inventario de links por ano ainda precisa ser confirmado no portal; coletor dedicado nao existe.",
    ),
    ("Prefeitura", "orcamento", "loa"): Automacao(
        "portal_pdf_html",
        "a_criar",
        "inventariar links de LOA por ano e criar extrator de programas, acoes e valores",
        "Extracao de programas, acoes e valores ainda nao esta fechada; coletor dedicado nao existe.",
    ),
    ("Prefeitura", "orcamento", "audiencias_publicas"): Automacao(
        "portal_pdf_html",
        "pipelines/gerar_audiencia_loa.py",
        "python pipelines/gerar_audiencia_loa.py",
        "2020-2021 podem estar indisponiveis na fonte oficial.",
    ),
    ("Prefeitura", "receita", "registro_analitico_receita_orcamentaria"): Automacao(
        "portal_pdf",
        "a_criar",
        "inventariar, baixar e criar extrator do registro analitico de receita orcamentaria",
        "O extrator_receita.py cobre RREO agregado; registro analitico municipal ainda nao tem extrator dedicado.",
    ),
    ("Prefeitura", "receita", "registro_analitico_receita_extraorcamentaria"): Automacao(
        "portal_pdf",
        "a_criar",
        "inventariar, baixar e criar extrator de receita extraorcamentaria",
        "Sem extrator dedicado no repo.",
    ),
    ("Prefeitura", "receita", "balancetes_receita"): Automacao(
        "portal_pdf",
        "a_criar",
        "inventariar links mensais e criar extrator de balancetes de receita",
        "Fonte mensal ainda nao mapeada por link.",
    ),
    ("Prefeitura", "despesa", "registro_de_empenhos"): Automacao(
        "portal_pdf",
        "pipelines/extrator_empenho.py",
        "foreach ($ano in 2020..2026) { python pipelines/extrator_empenho.py --ano $ano }",
        "2026 depende de disponibilidade oficial.",
    ),
    ("Prefeitura", "despesa", "registro_analitico_despesa_orcamentaria"): Automacao(
        "portal_pdf",
        "pipelines/extrator_despesa_orcamentaria.py",
        "foreach ($ano in 2020..2026) { python pipelines/extrator_despesa_orcamentaria.py --ano $ano }",
        "Dados publicados ate 2025; 2026 depende de fonte anual.",
    ),
    ("Prefeitura", "despesa", "registro_analitico_despesa_extraorcamentaria"): Automacao(
        "portal_pdf",
        "a_criar",
        "inventariar, baixar e criar extrator de despesa extraorcamentaria",
        "Sem extrator dedicado no repo.",
    ),
    ("Prefeitura", "fornecedores", "conta_corrente_fornecedor"): Automacao(
        "portal_pdf",
        "pipelines/agregar_fornecedores_execucao.py",
        "foreach ($ano in 2020..2026) { python pipelines/agregar_fornecedores_execucao.py --ano $ano }",
        "Dados publicados ate 2025; 2026 depende de fonte anual.",
    ),
    ("Prefeitura", "fornecedores", "conta_corrente_restos_a_pagar_por_fornecedor"): Automacao(
        "portal_pdf",
        "pipelines/agregar_restos_a_pagar.py",
        "foreach ($ano in 2020..2026) { python pipelines/agregar_restos_a_pagar.py --ano $ano }",
        "Dados publicados ate 2025; 2026 depende de fonte anual.",
    ),
    ("Prefeitura", "obras", "obras_publicas"): Automacao(
        "portal_html_pdf_pncp_tce",
        "pipelines/baixar_pncp_sorocaba.py",
        "python pipelines/baixar_pncp_sorocaba.py --dataset contratos --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Obras exigem cruzamento por objeto e TCE-SP; se portal municipal nao publicar lista completa, preparar LAI.",
    ),
    ("Prefeitura", "contratos", "contratos_e_aditivos"): Automacao(
        "portal_html_pdf_pncp",
        "pipelines/baixar_pncp_sorocaba.py",
        "python pipelines/baixar_pncp_sorocaba.py --dataset contratos --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Contratos pre-PNCP precisam do portal municipal ou LAI.",
    ),
    ("Prefeitura", "compras", "licitacoes"): Automacao(
        "portal_html_pdf_pncp",
        "pipelines/baixar_pncp_sorocaba.py",
        "python pipelines/baixar_pncp_sorocaba.py --dataset compras --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Licitacoes pre-PNCP precisam do portal municipal ou LAI.",
    ),
    ("Prefeitura", "atos", "jornal_oficial"): Automacao(
        "portal_pdf",
        "a_criar",
        "criar indice do jornal oficial por data e assunto",
        "Sem coletor dedicado no repo.",
    ),
    ("Prefeitura", "pessoal", "remuneracao_servidores"): Automacao(
        "portal_html_csv_pdf",
        "a_criar",
        "inventariar formato e campos publicaveis de remuneracao",
        "Pode exigir decisao de publicabilidade e minimizacao.",
    ),
    ("SICONFI", "fiscal", "rreo"): Automacao(
        "api_siconfi",
        "pipelines/extrator_rreo.py",
        "python pipelines/extrator_rreo.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "2026 depende de entregas oficiais.",
    ),
    ("SICONFI", "fiscal", "rgf"): Automacao(
        "api_siconfi",
        "pipelines/extrator_rgf_pessoal.py",
        "python pipelines/extrator_rgf_pessoal.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "2026 depende de entregas oficiais.",
    ),
    ("SICONFI", "fiscal", "dca"): Automacao(
        "api_siconfi",
        "pipelines/extrator_executivo.py",
        "python pipelines/extrator_executivo.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "2026 depende de entregas oficiais.",
    ),
    ("SICONFI", "contabilidade", "msc"): Automacao(
        "api_siconfi",
        "a_criar",
        "verificar disponibilidade da MSC para IBGE 3552205 e criar coletor se houver dados publicos",
        "Sem coletor MSC dedicado no repo.",
    ),
    ("SIOPS", "saude", "receitas_despesas_saude"): Automacao(
        "sistema_setorial",
        "pipelines/baixar_rreo_sus.py",
        "python pipelines/baixar_rreo_sus.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Pode exigir download manual conforme formato do SIOPS.",
    ),
    ("FNS", "saude", "repasses_sus"): Automacao(
        "sistema_setorial",
        "pipelines/baixar_fns_repasses.py",
        "python pipelines/baixar_fns_repasses.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Validar se a serie interna ja coletada cobre todo o periodo.",
    ),
    ("Portal_Transparencia_Federal", "transferencias", "transferencias_para_sorocaba"): Automacao(
        "api_com_chave",
        "pipelines/baixar_transferencias_federais.py",
        "python pipelines/baixar_transferencias_federais.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Requer PORTAL_TRANSPARENCIA_KEY ativa.",
    ),
    ("Transferegov", "transferencias", "convenios_e_instrumentos"): Automacao(
        "download_zip",
        "pipelines/baixar_transferegov_sorocaba.py",
        "python pipelines/baixar_transferegov_sorocaba.py --dataset convenio --dataset proposta --dataset empenho --max-mb 200",
        "Requer filtragem local por Sorocaba.",
    ),
    ("PNCP", "compras", "licitacoes_contratos_atas"): Automacao(
        "api_publica",
        "pipelines/baixar_pncp_sorocaba.py",
        "python pipelines/baixar_pncp_sorocaba.py --dataset compras --dataset contratos --dataset atas --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Coletar em janelas pequenas para evitar rate limit.",
    ),
    ("TCE_SP", "controle", "contas_e_pareceres"): Automacao(
        "portal_api_html",
        "pipelines/baixar_tce_sorocaba.py",
        "python pipelines/baixar_tce_sorocaba.py",
        "Processos do portal legado podem exigir browser ou LAI.",
    ),
    ("AUDESP", "controle", "dados_enviados_ao_tce"): Automacao(
        "portal_api_html",
        "pipelines/baixar_tce_sorocaba.py",
        "python pipelines/baixar_tce_sorocaba.py --amostra-transparencia --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Identificar downloads publicos antes de tratar como cobertura integral.",
    ),
    ("Camara", "orcamento", "execucao_orcamentaria_legislativo"): Automacao(
        "playwright",
        "pipelines/baixar_camara_playwright.py",
        "python pipelines/baixar_camara_playwright.py",
        "Portal pode bloquear requests diretos; Playwright necessario.",
    ),
    ("Camara", "contratos", "contratos_despesas_gabinete"): Automacao(
        "playwright",
        "pipelines/baixar_camara_playwright.py",
        "python pipelines/baixar_camara_playwright.py",
        "Contratos e demais despesas ainda precisam ser separados de gabinete.",
    ),
    ("Camara", "emendas", "emendas_impositivas"): Automacao(
        "api_publica",
        "pipelines/baixar_cepa_emendas.py",
        "python pipelines/baixar_cepa_emendas.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Coleta interna existente precisa validacao semantica antes de publicar.",
    ),
    ("Urbes", "transporte", "relacao_mensal_despesas"): Automacao(
        "portal_html_pdf",
        "pipelines/baixar_urbes_transparencia.py",
        "python pipelines/baixar_urbes_transparencia.py",
        "Normalizacao pendente.",
    ),
    ("Urbes", "transporte", "contratos_compras_diretas"): Automacao(
        "portal_html_pdf",
        "pipelines/baixar_urbes_playwright.py",
        "python pipelines/baixar_urbes_playwright.py --categoria contratos_outros",
        "Normalizacao pendente.",
    ),
    ("Urbes", "transporte", "remuneracao_transporte_publico"): Automacao(
        "portal_html_pdf",
        "pipelines/baixar_urbes_playwright.py",
        "python pipelines/baixar_urbes_playwright.py --categoria remuneracao_transporte_publico",
        "Extrair serie mensal antes de publicar.",
    ),
    ("Urbes", "transporte", "contratos_concessao_transporte"): Automacao(
        "portal_html_pdf",
        "pipelines/baixar_urbes_playwright.py",
        "python pipelines/baixar_urbes_playwright.py --categoria contratos_transporte",
        "Baixar contratos e aditivos, depois cruzar com pagamentos.",
    ),
    ("SAAE", "saneamento", "receitas_despesas"): Automacao(
        "playwright_tdaportal",
        "pipelines/baixar_saae_dados_abertos.py",
        "python pipelines/baixar_saae_dados_abertos.py --categorias receitas,despesas --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Requer Playwright e captura do endpoint de dados abertos.",
    ),
    ("SAAE", "saneamento", "licitacoes_contratos_obras"): Automacao(
        "playwright_tdaportal",
        "pipelines/baixar_saae_dados_abertos.py",
        "python pipelines/baixar_saae_dados_abertos.py --categorias contratos,licitacoes,obras --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Requer Playwright e normalizacao semantica.",
    ),
    ("SAAE", "pessoal", "remuneracao_rh"): Automacao(
        "playwright_tdaportal",
        "pipelines/baixar_saae_dados_abertos.py",
        "python pipelines/baixar_saae_dados_abertos.py --categorias rh --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025 --ano 2026",
        "Publicabilidade de remuneracao deve ser avaliada antes de publicar.",
    ),
    ("FUNSERV", "previdencia", "balancos_receitas_despesas"): Automacao(
        "portal_html_pdf",
        "pipelines/baixar_funserv.py",
        "python pipelines/baixar_funserv.py",
        "Normalizacao pendente.",
    ),
    ("FUNSERV", "previdencia", "avaliacao_atuarial"): Automacao(
        "portal_html_pdf",
        "pipelines/baixar_funserv.py",
        "python pipelines/baixar_funserv.py",
        "Extrair serie atuarial antes de publicar.",
    ),
    ("FUNSERV", "previdencia", "investimentos_e_rentabilidade"): Automacao(
        "portal_html_pdf",
        "pipelines/baixar_funserv.py",
        "python pipelines/baixar_funserv.py",
        "Extrair carteira e resultados antes de publicar.",
    ),
}


def automacao_para(row: dict[str, str]) -> Automacao:
    chave = (row["orgao"], row["area"], row["tipo_dado"])
    if chave in AUTOMACOES:
        return AUTOMACOES[chave]
    return Automacao(
        "manual_lai",
        "a_criar",
        f"mapear fonte e preparar LAI para {row['orgao']} {row['tipo_dado']}",
        "Sem automacao dedicada no repo.",
    )


def coleta_detectada(row: dict[str, str]) -> str:
    orgao = row["orgao"]
    area = row["area"]
    tipo = row["tipo_dado"]
    if orgao == "Camara" and area == "emendas" and tipo == "emendas_impositivas":
        marker = ROOT / "data" / "extracted" / "sorocaba" / "cepa" / "saida" / "cepa_manifest_coleta.json"
        if marker.exists():
            return marker.relative_to(ROOT).as_posix()
    if orgao in {"TCE_SP", "AUDESP"}:
        marker = ROOT / "data" / "extracted" / "sorocaba" / "tce" / "resumo_coleta_tce_sorocaba.json"
        if marker.exists():
            return marker.relative_to(ROOT).as_posix()
    return ""


def status_auditavel(row: dict[str, str], automacao: Automacao) -> str:
    status = row["status"].strip()
    if status == "publicado":
        return "publicado"
    if coleta_detectada(row):
        return "coletado_pendente_validacao"
    if status == "parcial":
        return "parcial"
    if automacao.script == "a_criar":
        return "lai_necessario"
    if "LAI" in automacao.bloqueio or "indisponivel" in automacao.bloqueio.lower():
        return "lai_necessario"
    return "parcial"


def agente_para(row: dict[str, str], automacao: Automacao) -> str:
    if row["status"] == "publicado":
        return "qa"
    if automacao.script == "a_criar":
        return "dados"
    if row["orgao"] in {"PNCP", "Portal_Transparencia_Federal", "Transferegov", "TCE_SP", "AUDESP"}:
        return "dados"
    if row["orgao"] in {"Camara", "Urbes", "SAAE", "FUNSERV", "AGEM"}:
        return "dados"
    return "pipeline"


def granularidade(row: dict[str, str]) -> str:
    periodicidade = row["periodicidade"].strip()
    if periodicidade == "continua":
        return "evento/documento"
    if periodicidade in {"mensal", "mensal_anual"}:
        return "mensal e anual"
    if periodicidade in {"bimestral", "bimestral_anual"}:
        return "bimestral e anual"
    if periodicidade == "quadrimestral":
        return "quadrimestral e anual"
    return periodicidade or "a mapear"


def precisa_lai(status: str, row: dict[str, str], automacao: Automacao) -> str:
    if status == "lai_necessario":
        return "sim"
    if row["prioridade"] == "critica" and row["status"] != "publicado":
        return "sim_preparado"
    if automacao.script == "a_criar":
        return "sim"
    return "nao"


def evidencia(row: dict[str, str]) -> str:
    detectada = coleta_detectada(row)
    if detectada:
        return f"coleta operacional detectada em {detectada}; ainda nao publicada"
    if row["status"] == "publicado":
        return "data/public e data/manifests/datasets.csv"
    if row["status"] == "parcial":
        return "inventario oficial e roadmap Sorocaba 100"
    return "inventario_fontes_sorocaba.csv; fonte oficial ainda pendente de coleta ou prova de indisponibilidade"


def camada_destino(row: dict[str, str]) -> str:
    if row["status"] == "publicado":
        return "data/public ja existente"
    return "raw externo via ANATOMIA_RAW_ROOT; saidas mecanicas em data/extracted quando houver extrator"


def carregar_inventario() -> list[dict[str, str]]:
    with INVENTARIO.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def gerar_manifest(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    saida: list[dict[str, str]] = []
    for row in rows:
        automacao = automacao_para(row)
        status = status_auditavel(row, automacao)
        saida.append(
            {
                "data_referencia": DATA_REFERENCIA,
                "municipio": "Sorocaba",
                "periodo_alvo": PERIODO_ALVO,
                "orgao": row["orgao"],
                "area": row["area"],
                "tipo_dado": row["tipo_dado"],
                "prioridade": row["prioridade"],
                "status_fonte_original": row["status"],
                "status_auditavel": status,
                "url": row["url"],
                "periodicidade": row["periodicidade"],
                "anos_disponiveis_declarados": row["anos_disponiveis"],
                "granularidade_alvo": granularidade(row),
                "formato": row["formato"],
                "metodo_acesso": automacao.metodo,
                "script_existente": automacao.script,
                "comando_coleta_bruta": automacao.comando,
                "camada_destino": camada_destino(row),
                "publicacao_autorizada": "nao",
                "evidencia_local": evidencia(row),
                "bloqueio_atual": automacao.bloqueio,
                "pedido_lai": precisa_lai(status, row, automacao),
                "agente_responsavel": agente_para(row, automacao),
                "proximo_passo": row["proximo_passo"],
                "observacao": row["observacao"],
            }
        )
    return saida


def escrever_csv(rows: list[dict[str, str]]) -> None:
    SAIDA_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    campos = list(rows[0].keys()) if rows else []
    with SAIDA_MANIFEST.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=campos)
        writer.writeheader()
        writer.writerows(rows)


def escrever_lai(rows: list[dict[str, str]]) -> None:
    candidatos = [row for row in rows if row["pedido_lai"] in {"sim", "sim_preparado"}]
    linhas = [
        "# Pedidos LAI - Sorocaba 100",
        "",
        f"Data de referencia: {DATA_REFERENCIA}.",
        "",
        "Este arquivo prepara pedidos de acesso a informacao para fontes que ainda nao",
        "possuem prova completa de disponibilidade publica no projeto. Ele nao registra",
        "protocolo real; apos envio, registrar numero, data e resposta no manifesto.",
        "",
        "Modelo base:",
        "",
        "```text",
        "Solicito, com fundamento na Lei 12.527/2011, acesso em formato aberto",
        "CSV, XLSX ou JSON, ou alternativamente PDF pesquisavel, aos dados abaixo",
        "referentes ao municipio de Sorocaba/SP no periodo de 2020 a 2026.",
        "Solicito tambem dicionario de campos, data de atualizacao e fonte primaria.",
        "```",
        "",
    ]
    for row in candidatos:
        linhas.extend(
            [
                f"## {row['orgao']} - {row['area']} - {row['tipo_dado']}",
                "",
                f"- Prioridade: {row['prioridade']}",
                f"- Periodo: {row['periodo_alvo']}",
                f"- Fonte inicial: {row['url']}",
                f"- Dado solicitado: {row['tipo_dado']} ({row['area']})",
                f"- Formato desejado: {row['formato']} em formato aberto quando disponivel",
                f"- Evidencia local: {row['evidencia_local']}",
                f"- Bloqueio atual: {row['bloqueio_atual'] or 'a confirmar'}",
                f"- Proximo passo apos resposta: {row['proximo_passo']}",
                "",
                "Texto especifico:",
                "",
                "```text",
                f"Solicito os dados de {row['tipo_dado']} relativos a {row['area']} de Sorocaba/SP,",
                "com cobertura de 2020 a 2026, contendo no minimo identificador do registro,",
                "data ou competencia, valor, orgao/unidade responsavel, classificacao aplicavel,",
                "fonte original e eventuais documentos vinculados. Caso a informacao nao exista",
                "ou nao seja mantida por este orgao, solicito indicacao expressa do motivo e",
                "do orgao responsavel pela guarda do dado.",
                "```",
                "",
            ]
        )
    SAIDA_LAI.write_text("\n".join(linhas).rstrip() + "\n", encoding="utf-8")


def escrever_operacao(rows: list[dict[str, str]]) -> None:
    status_counter = Counter(row["status_auditavel"] for row in rows)
    prioridade_counter = Counter(row["prioridade"] for row in rows)
    criticas = [row for row in rows if row["prioridade"] == "critica" and row["status_auditavel"] != "publicado"]
    linhas = [
        "# Operacao Sorocaba 100",
        "",
        f"Data de referencia: {DATA_REFERENCIA}.",
        "",
        "Objetivo: fechar Sorocaba primeiro como 100% auditavel, depois preservar",
        "brutos disponiveis e so entao preparar publicacao mediante validacao e",
        "autorizacao explicita.",
        "",
        "## Artefatos gerados",
        "",
        f"- Manifesto auditavel: `data/manifests/{SAIDA_MANIFEST.name}`",
        f"- Pedidos LAI preparados: `docs/{SAIDA_LAI.name}`",
        "- Fonte base: `data/manifests/inventario_fontes_sorocaba.csv`",
    ]
    if EXECUCAO_LOG.exists():
        linhas.append(f"- Log de execucao inicial: `data/manifests/{EXECUCAO_LOG.name}`")
    linhas.extend([
        "",
        "## Resumo",
        "",
        f"- Fontes inventariadas: {len(rows)}",
        f"- Status auditavel: {dict(sorted(status_counter.items()))}",
        f"- Prioridades: {dict(sorted(prioridade_counter.items()))}",
        f"- Frentes criticas nao publicadas: {len(criticas)}",
        "",
        "## Gates",
        "",
        "- Nao gravar em `data/public` sem autorizacao explicita.",
        "- Usar `ANATOMIA_RAW_ROOT` para brutos grandes.",
        "- Registrar bloqueio quando API, Playwright ou fonte oficial falhar.",
        "- Dados ausentes permanecem ausentes; nao converter ausencia em zero.",
        "",
        "## Ordem operacional",
        "",
        "1. Rodar coleta bruta apenas das fontes com `script_existente` diferente de `a_criar`.",
        "2. Atualizar manifests de coleta com tamanho, data, origem, metodo e bloqueio.",
        "3. Validar semanticamente cada serie antes de qualquer promocao.",
        "4. Preparar publicacao por lote, com `verificar_publicacao.py --strict` e `check-scope-gates.py`.",
        "",
        "## Frentes criticas nao publicadas",
        "",
    ])
    for row in criticas:
        linhas.append(
            f"- {row['orgao']} / {row['area']} / {row['tipo_dado']}: "
            f"{row['status_auditavel']}; {row['script_existente']}; {row['proximo_passo']}"
        )
    SAIDA_OPERACAO.write_text("\n".join(linhas).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    rows = gerar_manifest(carregar_inventario())
    escrever_csv(rows)
    escrever_lai(rows)
    escrever_operacao(rows)

    status_counter = Counter(row["status_auditavel"] for row in rows)
    print(f"Fontes processadas: {len(rows)}")
    print("Status auditavel:")
    for key, value in sorted(status_counter.items()):
        print(f"- {key}: {value}")
    print(f"Saida: {SAIDA_MANIFEST}")
    print(f"LAI: {SAIDA_LAI}")
    print(f"Operacao: {SAIDA_OPERACAO}")


if __name__ == "__main__":
    main()
