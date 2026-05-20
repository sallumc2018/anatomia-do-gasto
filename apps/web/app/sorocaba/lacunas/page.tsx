import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Lacunas conhecidas — Sorocaba",
  description:
    "Mapa de dados públicos de Sorocaba já publicados, parciais ou ainda pendentes. Cada item tem fonte oficial identificada, prioridade e próximo passo.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/lacunas" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "22px", lineHeight: "30px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

type Prioridade = "crítica" | "alta" | "média" | "baixa"
type Status = "em_coleta" | "lacuna" | "inexistente" | "parcial" | "publicado"

interface Lacuna {
  area: string
  dado: string
  status: Status
  prioridade: Prioridade
  anos: string
  fonte: string
  url: string
  proximo_passo: string
  observacao: string
}

const LACUNAS: Lacuna[] = [
  {
    area: "Fornecedores",
    dado: "Conta-corrente de fornecedores 2022 e 2023",
    status: "publicado",
    prioridade: "crítica",
    anos: "2022, 2023",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Verificar classificação automatica e curar manualmente se necessário.",
    observacao: "PDFs de 1.4 GB (2022) e 1.5 GB (2023) baixados, extraídos e publicados em 2026-05-16. Todos os 6 anos 2020–2025 disponíveis.",
  },
  {
    area: "Fornecedores",
    dado: "Restos a pagar por fornecedor 2020-2025",
    status: "publicado",
    prioridade: "alta",
    anos: "2020-2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Série completa 2020–2025 disponível.",
    observacao: "Série completa 2020-2025 publicada em 2026-05-17. 2020: 644 movimentos, 239 fornecedores. 2021 R$451M (764 rec.), 2022 R$76M (663 rec.), 2023 R$57M (737 rec.), 2024 R$121M (759 rec.), 2025 R$20M+ (817 rec.).",
  },
  {
    area: "Contratos e licitações",
    dado: "Contratos, licitações e atas de registro de preços",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2022–2026",
    fonte: "Portal Nacional de Contratações Públicas (PNCP)",
    url: "https://www.gov.br/pncp/pt-br",
    proximo_passo: "Coletar via API PNCP com codigoMunicipio=3552205 e cruzar com empenhos publicados",
    observacao: "Lei 14.133/2021 tornou PNCP obrigatório a partir de 2022. Contratos anteriores: Portal da Prefeitura.",
  },
  {
    area: "Contratos e licitações",
    dado: "Contratos e licitações anteriores a 2022",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2021",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Inventariar links de contratos por ano no portal e extrair campos relevantes",
    observacao: "Antes da Lei 14.133/2021, contratos publicados apenas no portal municipal.",
  },
  {
    area: "Obras públicas",
    dado: "Inventário de obras: objeto, empresa, valor, prazo e situação",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "PNCP + Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Inventariar obras no PNCP por objeto e cruzar com contratos e empenhos locais",
    observacao: "Fonte secundária: TCE-SP (tce.sp.gov.br). Obras da Urbes têm portal próprio.",
  },
  {
    area: "Receita",
    dado: "Registro analítico da receita orçamentária (mensal)",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Baixar PDFs do Registro Analítico de Receita e extrair por conta e mês",
    observacao: "Detalha receita por classificação contábil, além do agregado RREO já publicado.",
  },
  {
    area: "Despesa",
    dado: "Registro analítico de empenhos (por nota de empenho)",
    status: "publicado",
    prioridade: "crítica",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Série completa 2020–2025 disponível.",
    observacao: "Série completa publicada em 2026-05-17: 2020 (18.490), 2021 (36.947), 2022 (40.104), 2023 (41.649), 2024 (34.597), 2025 (31.444) empenhos. Extrator por coordenadas suporta portrait (2021/2024) e landscape (2022/2023). Enriquecido com nome do fornecedor via conta-corrente.",
  },
  {
    area: "Despesa",
    dado: "Despesa orçamentária detalhada 2022 e 2023",
    status: "publicado",
    prioridade: "crítica",
    anos: "2022, 2023",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Série completa 2020–2025 disponível.",
    observacao: "PDFs baixados e extraídos em 2026-05-17: 63.167 registros (2022) e 71.225 registros (2023). Sanidade: >99,8% válidos em ambos os anos.",
  },
  {
    area: "Orçamento",
    dado: "LOA - Audiência Pública: priorizações cidadãs por área e região",
    status: "publicado",
    prioridade: "alta",
    anos: "2022–2026",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Dados de 2022 contêm ranking de eixos; 2023–2025 por área e região; 2026 por eixo estratégico (schema diferente).",
    observacao: "Extraído por leitura visual (modelo multimodal) dos Relatórios de Audiência Pública em PDF de imagem. 2022: 140 participantes, ranking 4 eixos. 2023: 200 formulários, global + 5 regiões. 2024: 163/414 propostas, 5 regiões. 2025: 100/277 propostas, 5 regiões. 2026: dados globais por eixo estratégico (% eixo × % área no eixo). qualidade_dado distingue exatos de estimados.",
  },
  {
    area: "Orçamento",
    dado: "LOA - Audiência Pública 2020 e 2021: relatórios nunca publicados pela Prefeitura",
    status: "inexistente",
    prioridade: "baixa",
    anos: "2020–2021",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Nenhum. Dado confirmado como inexistente na fonte oficial.",
    observacao: "O portal fazenda.sorocaba.sp.gov.br/transparencia só publica relatórios de audiência pública da LOA a partir de 2022. Verificado em 2026-05-17: página lista apenas LOA_22 a LOA_26; link 'Versão anterior' aponta para portal histórico pré-2015, sem LOA. Não há fonte alternativa conhecida para 2020–2021.",
  },
  {
    area: "Câmara Municipal",
    dado: "Emendas impositivas por vereador (autor, destino, valor, execução)",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2020–2025",
    fonte: "CEPA - Consulta de Emendas Parlamentares",
    url: "https://servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas",
    proximo_passo: "Acessar o CEPA pelo link publico divulgado pela Prefeitura e mapear campos de emenda: autor, entidade, area, valor e execucao",
    observacao: "O subdominio cepa.camarasorocaba.sp.gov.br nao resolveu na checagem de pre-deploy. O link publico divulgado como abre.ai/consultaemendas redireciona para servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas.",
  },
  {
    area: "Câmara Municipal",
    dado: "Despesas de gabinete publicadas e contratos ainda pendentes por vereador",
    status: "parcial",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "Portal de Transparência da Câmara de Sorocaba",
    url: "https://www.camarasorocaba.sp.gov.br",
    proximo_passo: "Manter a série de gabinete publicada e inventariar contratos, licitações e demais despesas da Câmara.",
    observacao: "Despesas mensais de gabinete 2020-2026 já estão publicadas em data/public/sorocaba/camara/gabinete. Contratos, licitações e cruzamento por vereador continuam pendentes.",
  },
  {
    area: "Câmara Municipal",
    dado: "LOA e execução orçamentária detalhada da Câmara",
    status: "parcial",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência da Câmara de Sorocaba",
    url: "https://www.camarasorocaba.sp.gov.br",
    proximo_passo: "Baixar RREO/DCA da Câmara e extrair por função/subfunção",
    observacao: "Valores totais da Câmara já aparecem no orçamento geral (executivo/dados). Falta detalhe próprio.",
  },
  {
    area: "Urbes",
    dado: "Despesas mensais, contratos e remuneração do transporte público",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "Portal de Transparência da Urbes",
    url: "https://www.urbes.com.br/transparencia/index",
    proximo_passo: "Inventariar downloads disponíveis: relação mensal de despesas, contratos e folha",
    observacao: "Urbes é empresa pública municipal. Contratos de concessão: urbes.com.br/transparencia/contratos-transporte",
  },
  {
    area: "SAAE",
    dado: "Receitas, despesas, contratos e obras do saneamento",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "Portal de Transparência do SAAE",
    url: "https://www.saaesorocaba.com.br/transparencia",
    proximo_passo: "Inventariar downloads: demonstrativos financeiros, licitações e obras da autarquia",
    observacao: "SAAE (água e esgoto) tem orçamento e contratos próprios, não consolidados no RREO da Prefeitura.",
  },
  {
    area: "FUNSERV",
    dado: "Balanços, avaliação atuarial e investimentos da previdência",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "Portal de Transparência do FUNSERV",
    url: "https://funservsorocaba.sp.gov.br/transparencia/portal-da-transpar%C3%AAncia",
    proximo_passo: "Baixar avaliação atuarial e demonstrativos do fundo; cruzar passivo com RGF já publicado",
    observacao: "Passivo atuarial do FUNSERV já aparece no RGF publicado (saúde-fiscal), mas o detalhe do fundo não.",
  },
  {
    area: "Transferências federais",
    dado: "Transferências individualizadas da União para Sorocaba",
    status: "em_coleta",
    prioridade: "crítica",
    anos: "2020–2025",
    fonte: "Portal da Transparência Federal",
    url: "https://portaldatransparencia.gov.br/transferencias",
    proximo_passo: "Pipeline baixar_transferencias_federais.py pronto. Aguardando ativação da chave API (até 24h após cadastro). Rodar: python baixar_transferencias_federais.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025",
    observacao: "Pipeline construído em 2026-05-17. Complementa RREO com transferências individualizadas: FPM, SUS, FNDE, FUNDEB, emendas parlamentares federais e convênios. Requer PORTAL_TRANSPARENCIA_KEY no ambiente.",
  },
  {
    area: "Pessoal",
    dado: "Remuneração detalhada de servidores",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Inventariar publicação de remuneração individual — verificar formato (HTML/CSV/PDF) e campos publicáveis",
    observacao: "Folha agregada já aparece no RGF. Publicação individual de servidores requer verificação jurídica de privacidade.",
  },
  {
    area: "Controle externo",
    dado: "Pareceres e alertas do TCE-SP sobre Sorocaba",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "TCE-SP",
    url: "https://www.tce.sp.gov.br",
    proximo_passo: "Pesquisar processos de Sorocaba (IBGE 3552205) no portal de busca de processos do TCE-SP",
    observacao: "Pareceres de contas anuais e alertas fiscais são públicos. Fonte de validação independente para os dados publicados.",
  },
  {
    area: "SICONFI",
    dado: "MSC (Matriz de Saldos Contábeis) mensal",
    status: "lacuna",
    prioridade: "média",
    anos: "2020–2025",
    fonte: "SICONFI / Tesouro Nacional",
    url: "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/msc",
    proximo_passo: "Verificar disponibilidade por ente (IBGE 3552205) e estrutura de campos — pode detalhar muito mais que anexos RREO/RGF",
    observacao: "RREO e RGF já extraídos via SICONFI. MSC daria séries mensais por conta contábil.",
  },
]

const PRIORIDADE_COLOR: Record<Prioridade, string> = {
  "crítica": "var(--support-error)",
  "alta":    "var(--support-warning)",
  "média":   "var(--blue-40)",
  "baixa":   "var(--text-04)",
}

const STATUS_LABEL: Record<Status, string> = {
  em_coleta:   "Em coleta",
  lacuna:      "Lacuna",
  inexistente: "Não existe",
  parcial:     "Parcial",
  publicado:   "Publicado",
}

const STATUS_COLOR: Record<Status, string> = {
  em_coleta:   "var(--support-warning)",
  lacuna:      "var(--support-error)",
  inexistente: "var(--text-04)",
  parcial:     "var(--blue-40)",
  publicado:   "var(--support-success)",
}

export default function LacunasPage() {
  const criticas  = LACUNAS.filter((l) => l.prioridade === "crítica")
  const altas     = LACUNAS.filter((l) => l.prioridade === "alta")
  const demais    = LACUNAS.filter((l) => l.prioridade !== "crítica" && l.prioridade !== "alta")
  const pendentes = LACUNAS.filter((l) => l.status !== "publicado" && l.status !== "inexistente")
  const pendenciasCriticas = pendentes.filter((l) => l.prioridade === "crítica")
  const pendenciasAltas = pendentes.filter((l) => l.prioridade === "alta")
  const publicados = LACUNAS.filter((l) => l.status === "publicado")

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--support-error)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Lacunas conhecidas · Sorocaba/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  {LACUNAS.length} itens mapeados
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                O que ainda falta e onde pegar
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Esta página consolida os dados públicos de Sorocaba que já foram publicados, estão parciais
                ou ainda precisam ser coletados, validados e publicados. Cada item tem a fonte exata,
                o próximo passo e a prioridade de publicação.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)" }}>
                Lacuna declarada não é dado escondido — é a ausência de um dado que existe em alguma fonte
                oficial e pode ser coletado. Transparência inclui declarar o que não temos.
              </p>
            </div>
          </div>
        </section>

        {/* Resumo */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Pendências críticas", valor: pendenciasCriticas.length.toString(), nota: "Impacto direto na pergunta do cidadão", color: "var(--support-error)" },
                { label: "Prioridade alta", valor: pendenciasAltas.length.toString(), nota: "Relevantes mas não bloqueantes", color: "var(--support-warning)" },
                { label: "Itens publicados", valor: publicados.length.toString(), nota: "Já aparecem em data/public", color: "var(--blue-40)" },
                { label: "Itens com fonte", valor: LACUNAS.length.toString(), nota: "Publicado, parcial ou lacuna declarada", color: "var(--support-success)" },
              ].map((kpi) => (
                <div key={kpi.label}>
                  <p style={S.label} className="mb-1">{kpi.label}</p>
                  <p className="font-light mt-2" style={{ fontSize: "36px", color: kpi.color, fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                    {kpi.valor}
                  </p>
                  <p className="mt-1" style={S.caption}>{kpi.nota}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lista de lacunas */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>

            {[
              { grupo: "Prioridade crítica", items: criticas },
              { grupo: "Prioridade alta",    items: altas },
              { grupo: "Média e baixa prioridade", items: demais },
            ].map(({ grupo, items }) => items.length === 0 ? null : (
              <div key={grupo} className="mb-16">
                <p className="uppercase font-semibold mb-6" style={S.label}>{grupo}</p>
                <div className="flex flex-col" style={S.borderTop}>
                  {items.map((lacuna) => (
                    <div key={`${lacuna.area}-${lacuna.dado}`} style={{ ...S.borderBottom, padding: "20px 0" }}>
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        <span style={{
                          fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                          textTransform: "uppercase", padding: "3px 8px",
                          color: PRIORIDADE_COLOR[lacuna.prioridade],
                          border: `1px solid ${PRIORIDADE_COLOR[lacuna.prioridade]}`,
                        }}>
                          {lacuna.prioridade}
                        </span>
                        <span style={{
                          fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                          textTransform: "uppercase", padding: "3px 8px",
                          color: STATUS_COLOR[lacuna.status],
                          border: `1px solid ${STATUS_COLOR[lacuna.status]}`,
                        }}>
                          {STATUS_LABEL[lacuna.status]}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-04)", fontWeight: 600 }}>
                          {lacuna.area} · {lacuna.anos}
                        </span>
                      </div>

                      <h3 className="font-light mb-2" style={{ fontSize: "17px", color: "var(--text-01)", lineHeight: "1.4" }}>
                        {lacuna.dado}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <p style={{ ...S.caption, marginBottom: "4px", fontWeight: 600 }}>Próximo passo</p>
                          <p style={{ ...S.body, fontSize: "13px" }}>{lacuna.proximo_passo}</p>
                        </div>
                        <div>
                          <p style={{ ...S.caption, marginBottom: "4px", fontWeight: 600 }}>Observação</p>
                          <p style={{ ...S.body, fontSize: "13px" }}>{lacuna.observacao}</p>
                        </div>
                        <div>
                          <p style={{ ...S.caption, marginBottom: "4px", fontWeight: 600 }}>Fonte oficial</p>
                          <TrackedExternalLink
                            href={lacuna.url}
                            area="lacunas"
                            label={lacuna.fonte}
                            style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}
                          >
                            {lacuna.fonte}
                          </TrackedExternalLink>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderTop }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div style={{ maxWidth: "720px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>O que já está publicado</p>
              <div className="flex flex-col gap-3" style={S.body}>
                <p>
                  Todos os dados atualmente publicados estão disponíveis na{" "}
                  <Link href="/sorocaba/dados" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>página de dados</Link>{" "}
                  com download direto em CSV. Isso inclui saúde, educação, segurança, transporte,
                  orçamento por função, receita, saúde fiscal, fornecedores, restos a pagar, despesa orçamentária,
                  empenhos e Câmara/gabinete — com séries publicadas conforme o período de cada fonte — e priorizações
                  da audiência pública da LOA 2022–2026.
                </p>
                <p>
                  Os dados faltantes existem em fontes oficiais — portais municipais, federais e estaduais —
                  mas ainda precisam ser coletados, extraídos de PDFs, validados e publicados.
                  O processo é manual e pode demorar semanas por conjunto de dados.
                  Esta versão publicada não encerra a cobertura de Sorocaba: contratos, obras, transferências,
                  autarquias, Câmara avançada e controle externo seguem como próximos blocos.
                </p>
                <p>
                  Se você encontrou algum dado oficial não listado aqui, ou se detectou uma inconsistência,
                  use o{" "}
                  <Link href="/contato" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>formulário de contato</Link>.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-6">
                <Link href="/sorocaba/dados" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>Ver dados publicados</Link>
                <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>Como o pipeline funciona</Link>
                <Link href="/sorocaba/fornecedores" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>Fornecedores</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
