import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { getAvailableYearsExecutivo } from "@/lib/data"
import { faqPageSchema, municipioDataCatalogSchema, SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Dados públicos de Paulínia — Prefeitura de Paulínia/SP",
  description: "Base navegável de dados públicos de Paulínia: despesas por função, receitas, execução fiscal (LRF), segurança pública e transporte. Série histórica 2020–2025. Fonte: SICONFI/Tesouro Nacional e Portal TCE-SP.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/paulinia" },
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
    fontSize: "20px",
    lineHeight: "28px",
    color: "var(--text-01)",
    fontWeight: 300,
    marginBottom: "8px",
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const AREAS = [
  {
    titulo: "Segurança pública",
    descricao: "Execução orçamentária em segurança pública por ano. Dotação, liquidado e pago. Fonte: RREO/SICONFI.",
    href: "/paulinia/seguranca",
    hrefHistorico: "/paulinia/seguranca",
    cor: "var(--purple-60)",
  },
  {
    titulo: "Transporte",
    descricao: "Execução orçamentária em transporte por ano. Fontes: RREO e DCA/SICONFI.",
    href: "/paulinia/transporte",
    hrefHistorico: "/paulinia/transporte",
    cor: "var(--cyan-60)",
  },
]

const MAIS_AREAS = [
  {
    titulo: "Receitas",
    descricao: "De onde vêm os recursos de Paulínia: impostos próprios, ICMS/IPVA estaduais, transferências da União e outras fontes.",
    href: "/paulinia/receita",
  },
  {
    titulo: "Visão geral (Executivo)",
    descricao: "Orçamento total por função: distribuição das despesas entre todas as áreas de atuação do governo municipal.",
    href: "/paulinia/executivo",
  },
  {
    titulo: "Saúde fiscal",
    descricao: "Indicadores de responsabilidade fiscal: despesa com pessoal, dívida consolidada e RCL (LRF).",
    href: "/paulinia/saude-fiscal",
  },
  {
    titulo: "Saúde — ASPS e FNS",
    descricao: "Gasto em saúde: cumprimento do mínimo constitucional (SIOPS) e repasses do Fundo Nacional de Saúde.",
    href: "/paulinia/saude",
  },
  {
    titulo: "Câmara Municipal",
    descricao: "Execução orçamentária do Legislativo: empenhos, pagamentos e receitas da Câmara (2023–2026).",
    href: "/paulinia/camara",
  },
  {
    titulo: "Transferências",
    descricao: "Repasses federais (FPM, SUS, educação) e estaduais (ICMS, IPVA) recebidos por Paulínia.",
    href: "/paulinia/transferencias",
  },
]

const PAU_CATALOG = municipioDataCatalogSchema({
  municipioId: "paulinia",
  name: "Dados fiscais públicos de Paulínia/SP — Anatomia do Gasto",
  description: "Catálogo de dados fiscais públicos de Paulínia: segurança pública, transporte, receitas, orçamento (RREO), saúde fiscal (LRF), saúde (ASPS), câmara municipal e transferências estaduais. Série 2020–2025. Fonte: SICONFI e Portal TCE-SP.",
  spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
  datasets: [
    { name: "Segurança pública — Paulínia",                 url: "/paulinia/seguranca" },
    { name: "Transporte — Paulínia",                        url: "/paulinia/transporte" },
    { name: "Receitas municipais — Paulínia",               url: "/paulinia/receita" },
    { name: "Orçamento total por função — Paulínia",        url: "/paulinia/executivo" },
    { name: "Saúde fiscal (LRF/RGF) — Paulínia",           url: "/paulinia/saude-fiscal" },
    { name: "Saúde pública (ASPS) — Paulínia",             url: "/paulinia/saude" },
    { name: "Câmara Municipal — Paulínia",                  url: "/paulinia/camara" },
    { name: "Transferências estaduais — Paulínia",          url: "/paulinia/transferencias" },
  ],
})

const PAU_FAQ = faqPageSchema([
  {
    question: "Quanto Paulínia gastou em segurança pública?",
    answer: `Consulte a execução orçamentária em segurança pública de Paulínia (dotação, liquidado, pago por ano) em ${SITE_URL}/paulinia/seguranca. Série 2020–2025. Fonte: RREO/SICONFI.`,
  },
  {
    question: "Quanto Paulínia gastou em transporte?",
    answer: `Veja as despesas em transporte de Paulínia em ${SITE_URL}/paulinia/transporte. Série histórica 2020–2025. Fonte: RREO/SICONFI.`,
  },
  {
    question: "Quanto entrou de receita em Paulínia?",
    answer: `As receitas de Paulínia — impostos próprios, ICMS, FPM, royalties de petróleo e transferências da União — estão em ${SITE_URL}/paulinia/receita. Paulínia recebe alto volume de royalties por ter a maior refinaria da Petrobras (REPLAN). Série 2020–2025. Fonte: RREO Anexo 01/SICONFI.`,
  },
  {
    question: "Qual é o orçamento total da Prefeitura de Paulínia?",
    answer: `O orçamento total de Paulínia por função de governo está em ${SITE_URL}/paulinia/executivo. Série 2020–2025. Fonte: RREO Anexo 02/SICONFI.`,
  },
  {
    question: "Como está a saúde fiscal de Paulínia (LRF)?",
    answer: `Os indicadores de LRF de Paulínia — despesa com pessoal, dívida consolidada e RCL — estão em ${SITE_URL}/paulinia/saude-fiscal. Fonte: RGF/SICONFI.`,
  },
  {
    question: "Paulínia cumpre o mínimo constitucional de 15% em saúde?",
    answer: `Consulte os dados de aplicação em ASPS (Ações e Serviços Públicos de Saúde) de Paulínia e a verificação do mínimo constitucional em ${SITE_URL}/paulinia/saude. Fonte: RREO Anexo 12/SICONFI.`,
  },
  {
    question: "Quanto a Câmara Municipal de Paulínia gasta por ano?",
    answer: `Veja as despesas anuais da Câmara Municipal de Paulínia por natureza de despesa em ${SITE_URL}/paulinia/camara. Fonte: Portal de Transparência da Câmara de Paulínia.`,
  },
  {
    question: "O que são transferências estaduais para municípios?",
    answer: `Transferências estaduais são repasses do Governo do Estado ao município: ICMS (cota-parte), IPVA, FUNDEB estadual, entre outros. Dados de Paulínia em ${SITE_URL}/paulinia/transferencias. Fonte: SICONFI.`,
  },
])

const CONSULTAS = [
  {
    pergunta: "Quanto Paulínia gastou em segurança pública?",
    href: "/paulinia/seguranca",
  },
  {
    pergunta: "Quanto Paulínia gastou em transporte?",
    href: "/paulinia/transporte",
  },
  {
    pergunta: "Quanto entrou de receita em Paulínia?",
    href: "/paulinia/receita",
  },
  {
    pergunta: "Qual é o orçamento total da Prefeitura de Paulínia?",
    href: "/paulinia/executivo",
  },
  {
    pergunta: "Como está a saúde fiscal de Paulínia (LRF)?",
    href: "/paulinia/saude-fiscal",
  },
  {
    pergunta: "Paulínia cumpre o mínimo constitucional de 15% em saúde?",
    href: "/paulinia/saude",
  },
  {
    pergunta: "Quanto a Câmara Municipal de Paulínia gasta por ano?",
    href: "/paulinia/camara",
  },
  {
    pergunta: "O que é empenho, liquidação e pagamento?",
    href: "/glossario",
  },
  {
    pergunta: "Como os dados são coletados e validados?",
    href: "/metodologia",
  },
  {
    pergunta: "O que são transferências estaduais para municípios?",
    href: "/paulinia/transferencias",
  },
]

export default function PauliniaPage() {
  const anos = getAvailableYearsExecutivo("paulinia")
  const anoMaisRecente = anos[0] ?? null

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAU_CATALOG) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAU_FAQ) }} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>
              Paulínia · São Paulo · Brasil
            </p>
            <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "800px" }}>
              Dados públicos da Prefeitura de Paulínia
            </h1>
            <p style={{ ...S.body, maxWidth: "640px", fontSize: "15px", lineHeight: "24px" }}>
              Base navegável com dados públicos de despesas, receitas e execução fiscal de Paulínia/SP.
              Organizada a partir de fontes oficiais — SICONFI e Portal de Transparência TCE-SP —
              com metodologia declarada e rastreabilidade até a fonte.
            </p>
            {anoMaisRecente && (
              <p className="mt-4" style={S.caption}>
                Dados disponíveis até {anoMaisRecente} · Fonte: SICONFI/Tesouro Nacional e TCE-SP · IBGE 3536505
              </p>
            )}
          </div>
        </section>

        {/* Nota cobertura */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-6" style={S.container}>
            <div className="p-4" style={{ border: "1px solid var(--border-02)", backgroundColor: "var(--bg-elevated)" }}>
              <p style={{ ...S.caption, lineHeight: "18px" }}>
                <strong style={{ color: "var(--text-02)" }}>Cobertura atual:</strong>{" "}
                Saúde e educação ainda não estão publicados para Paulínia — os dados de LRF setorial estão em coleta.
                As páginas disponíveis cobrem orçamento total (RREO Anexo 02), receitas (RREO Anexo 01),
                saúde fiscal (RGF), segurança pública, transporte e transferências intergovernamentais.
              </p>
            </div>
          </div>
        </section>

        {/* Áreas com dados por ano */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Áreas de despesa com dados por ano</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {AREAS.map((area) => (
                <div
                  key={area.titulo}
                  className="py-8"
                  style={{ ...S.borderBottom, paddingRight: "32px" }}
                >
                  <div style={{ borderLeft: `3px solid ${area.cor}`, paddingLeft: "16px" }}>
                    <h2 style={S.h2}>{area.titulo}</h2>
                    <p style={{ ...S.body, marginBottom: "16px" }}>{area.descricao}</p>
                    <Link
                      href={area.href}
                      style={{ fontSize: "13px", color: area.cor, textDecoration: "underline" }}
                    >
                      Ver dados →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mais áreas */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Outras consultas disponíveis</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={S.borderTop}>
              {MAIS_AREAS.map((area) => (
                <Link
                  key={area.titulo}
                  href={area.href}
                  style={{
                    display: "block",
                    padding: "20px 24px 20px 0",
                    ...S.borderBottom,
                    textDecoration: "none",
                  }}
                >
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "6px" }}>
                    {area.titulo}
                  </p>
                  <p style={S.body}>{area.descricao}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Perguntas frequentes */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Consultas frequentes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONSULTAS.map((c) => (
                <Link
                  key={c.pergunta}
                  href={c.href}
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    border: "1px solid var(--border-01)",
                    fontSize: "14px",
                    color: "var(--text-02)",
                    textDecoration: "none",
                    lineHeight: "20px",
                  }}
                >
                  {c.pergunta}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Metodologia e fontes */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Transparência e metodologia</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>
                  Metodologia
                </p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  Como os dados são coletados, extraídos, validados e publicados. Inclui errata e limitações declaradas.
                </p>
                <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver metodologia completa →
                </Link>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>
                  Fontes de dados
                </p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  SICONFI/Tesouro Nacional (RREO, RGF), Portal de Transparência TCE-SP e Fazenda/SP (transferências estaduais).
                </p>
                <Link href="/fontes" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver todas as fontes →
                </Link>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>
                  Glossário
                </p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  Significado de empenho, liquidação, pagamento, dotação, RCL, LRF e outros termos em linguagem cidadã.
                </p>
                <Link href="/glossario" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver glossário →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Aviso de neutralidade */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <p style={{ ...S.caption, maxWidth: "720px" }}>
              A Anatomia do Gasto organiza dados públicos em linguagem cidadã, com fonte, método e rastreabilidade.
              O objetivo não é acusar, defender ou interpretar politicamente: é permitir que qualquer pessoa consulte
              a trilha do dinheiro público. Campo vazio, nulo ou indisponível é declarado como dado ausente —
              nunca tratado como zero.{" "}
              <Link href="/politica-de-neutralidade" style={{ color: "inherit", textDecoration: "underline" }}>
                Política de neutralidade
              </Link>
            </p>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
