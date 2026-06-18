import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Fontes de dados",
  description: "Fontes oficiais usadas pela Anatomia do Gasto para organizar dados públicos de Sorocaba: Portal de Transparência Municipal, SICONFI, SIOPS e Livro de Conta-Corrente de Fornecedores.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/fontes" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  h2: {
    fontSize: "18px",
    lineHeight: "26px",
    color: "var(--text-01)",
    fontWeight: 400,
    marginBottom: "8px",
  } as React.CSSProperties,
  body: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const FONTES = [
  {
    titulo: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    urlLabel: "fazenda.sorocaba.sp.gov.br/transparencia",
    tipo: "Municipal",
    responsavel: "Secretaria da Fazenda — Prefeitura de Sorocaba/SP",
    dados: [
      "Relatórios de Aplicação da LRF (saúde, educação, segurança, transporte)",
      "Relatórios quadrimestrais de execução orçamentária por função",
      "PDFs publicados conforme Lei de Responsabilidade Fiscal",
    ],
    periodicidade: "Quadrimestral (jan–abr, jan–ago, jan–dez)",
    cobertura: "2020–2025 (cobertura atual do site)",
    nota: "Os PDFs são lidos automaticamente e convertidos em CSVs estruturados pelo pipeline de dados. Erros de digitação nos PDFs originais são reproduzidos nos dados extraídos e declarados na metodologia.",
  },
  {
    titulo: "SICONFI — Sistema de Informações Contábeis e Fiscais",
    url: "https://siconfi.tesouro.gov.br",
    urlLabel: "siconfi.tesouro.gov.br",
    tipo: "Federal",
    responsavel: "Secretaria do Tesouro Nacional — Ministério da Fazenda",
    dados: [
      "RREO Anexo 12 — Gasto total em saúde (ASPS + SUS) por bimestre",
      "DCA — Demonstrativo das Contas Anuais por órgão, função e subfunção",
      "Dados declarados pelos municípios ao Tesouro Nacional",
    ],
    periodicidade: "RREO: bimestral. DCA: anual.",
    cobertura: "Anos disponíveis conforme publicação municipal no SICONFI",
    nota: "Usado para validação cruzada com os dados do portal municipal e para obter o detalhamento ASPS/SUS que não aparece nos relatórios LRF.",
  },
  {
    titulo: "SIOPS — Sistema de Informações sobre Orçamentos Públicos em Saúde",
    url: "https://www.gov.br/saude/pt-br/acesso-a-informacao/siops/siops",
    urlLabel: "gov.br/saude/siops",
    tipo: "Federal",
    responsavel: "Ministério da Saúde",
    dados: [
      "Dados declarados pelos municípios sobre gastos em saúde",
      "Indicadores de cumprimento do mínimo constitucional (15% ASPS)",
      "Série histórica de aplicação em ações e serviços de saúde",
    ],
    periodicidade: "Quadrimestral",
    cobertura: "Série histórica disponível no DATASUS",
    nota: "Usado como referência de validação cruzada. Os valores podem divergir dos relatórios LRF devido a diferenças metodológicas de declaração.",
  },
  {
    titulo: "Livro de Conta-Corrente de Fornecedores",
    url: "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca",
    urlLabel: "apidatalake.tesouro.gov.br/ords/siconfi",
    tipo: "Federal",
    responsavel: "Secretaria do Tesouro Nacional — API SICONFI",
    dados: [
      "Débitos por destinatário (fornecedor, entidade, fundo, folha de pagamento)",
      "Movimentações financeiras por CNPJ/CPF e natureza do destinatário",
      "Dados consolidados de transferências financeiras municipais",
    ],
    periodicidade: "Anual (ano-calendário encerrado)",
    cobertura: "2020, 2024, 2025 (2021–2023 em extração)",
    nota: "Base dos dados de fornecedores publicados no site. Não é nota de empenho individual — é o fluxo financeiro agregado por destinatário. Exclui movimentações internas entre órgãos do mesmo município.",
  },
  {
    titulo: "LOA — Lei Orçamentária Anual",
    url: "https://camarasorocaba.sp.gov.br",
    urlLabel: "camarasorocaba.sp.gov.br",
    tipo: "Municipal",
    responsavel: "Câmara Municipal de Sorocaba / Prefeitura de Sorocaba",
    dados: [
      "Dotações orçamentárias aprovadas por função, subfunção e órgão",
      "Histórico da evolução do orçamento aprovado por ano",
    ],
    periodicidade: "Anual",
    cobertura: "LOAs disponíveis conforme publicação na Câmara Municipal",
    nota: "Usada para contexto e comparação entre dotação aprovada e execução realizada. A LOA é o orçamento autorizado; a execução real pode diferir por suplementações, contingenciamentos e cancelamentos.",
  },
]

export default function FontesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Fontes de dados</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                De onde vêm os dados publicados
              </h1>
              <p style={{ ...S.body, maxWidth: "600px" }}>
                Todos os dados exibidos no site têm origem em fontes oficiais públicas.
                Esta página lista cada fonte, o que ela contém, sua periodicidade e como é usada.
              </p>
            </div>
          </div>
        </section>

        {/* Lista de fontes */}
        {FONTES.map((fonte, i) => (
          <section
            key={fonte.titulo}
            style={{ backgroundColor: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-elevated)", ...S.borderBottom }}
          >
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Identificação */}
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      marginBottom: "12px",
                      backgroundColor: fonte.tipo === "Municipal" ? "var(--blue-10)" : "var(--teal-10)",
                      color: fonte.tipo === "Municipal" ? "var(--blue-60)" : "var(--teal-60)",
                    }}
                  >
                    {fonte.tipo}
                  </span>
                  <h2 style={S.h2}>{fonte.titulo}</h2>
                  <p style={S.mono}>{fonte.responsavel}</p>
                  <div className="mt-4">
                    <TrackedExternalLink
                      href={fonte.url}
                      area="fontes"
                      label={fonte.urlLabel}
                      style={{ ...S.mono, textDecoration: "underline", fontSize: "11px" }}
                    >
                      {fonte.urlLabel}
                    </TrackedExternalLink>
                  </div>
                </div>

                {/* Detalhes */}
                <div style={{ gridColumn: "span 3" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="uppercase font-semibold mb-2" style={S.label}>Dados disponíveis</p>
                      <ul className="flex flex-col gap-1">
                        {fonte.dados.map((d) => (
                          <li key={d} style={{ ...S.body, fontSize: "14px", display: "flex", gap: "8px" }}>
                            <span style={{ color: "var(--text-04)", flexShrink: 0 }}>—</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="uppercase font-semibold mb-1" style={S.label}>Periodicidade</p>
                        <p style={{ ...S.body, fontSize: "14px" }}>{fonte.periodicidade}</p>
                      </div>
                      <div>
                        <p className="uppercase font-semibold mb-1" style={S.label}>Cobertura atual</p>
                        <p style={{ ...S.body, fontSize: "14px" }}>{fonte.cobertura}</p>
                      </div>
                    </div>
                  </div>
                  <p style={{ ...S.caption, borderTop: "1px solid var(--border-01)", paddingTop: "12px" }}>
                    {fonte.nota}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Nota de transparência */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p style={{ ...S.body, maxWidth: "720px", fontSize: "14px" }}>
              A Anatomia do Gasto organiza dados públicos com fonte, método e rastreabilidade.
              O objetivo não é acusar, defender ou interpretar politicamente: é permitir que qualquer
              pessoa consulte a trilha do dinheiro público.{" "}
              <Link href="/metodologia" style={{ color: "inherit", textDecoration: "underline" }}>
                Ver metodologia completa
              </Link>
              {" "}·{" "}
              <Link href="/glossario" style={{ color: "inherit", textDecoration: "underline" }}>
                Glossário de termos
              </Link>
            </p>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
