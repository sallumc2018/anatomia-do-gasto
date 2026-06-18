import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { getAvailableYearsExecutivo } from "@/lib/data"

export const metadata: Metadata = {
  title: "Dados públicos de São Paulo — Prefeitura de São Paulo/SP",
  description: "Base navegável de dados públicos de São Paulo: despesas por função, receitas, execução fiscal (LRF), segurança pública e transporte. Série histórica 2020–2025. Fonte: SICONFI/Tesouro Nacional e Portal TCE-SP.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo" },
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
    href: "/sao-paulo/seguranca",
    hrefHistorico: "/sao-paulo/seguranca",
    cor: "var(--purple-60)",
  },
  {
    titulo: "Transporte",
    descricao: "Execução orçamentária em transporte por ano. Fontes: RREO e DCA/SICONFI.",
    href: "/sao-paulo/transporte",
    hrefHistorico: "/sao-paulo/transporte",
    cor: "var(--cyan-60)",
  },
]

const MAIS_AREAS = [
  {
    titulo: "Receitas",
    descricao: "De onde vêm os recursos de São Paulo: impostos próprios, ICMS/IPVA estaduais, transferências da União e outras fontes.",
    href: "/sao-paulo/receita",
  },
  {
    titulo: "Visão geral (Executivo)",
    descricao: "Orçamento total por função: distribuição das despesas entre todas as áreas de atuação do governo municipal.",
    href: "/sao-paulo/executivo",
  },
  {
    titulo: "Saúde fiscal",
    descricao: "Indicadores de responsabilidade fiscal: despesa com pessoal, dívida consolidada e RCL (LRF).",
    href: "/sao-paulo/saude-fiscal",
  },
  {
    titulo: "Repasses federais de saúde (FNS)",
    descricao: "Repasses do Fundo Nacional de Saúde ao Município de São Paulo. Série 2020–2025. Custeio e investimento SUS.",
    href: "/sao-paulo/saude",
  },
]

const CONSULTAS = [
  {
    pergunta: "Quanto São Paulo gastou em segurança pública?",
    href: "/sao-paulo/seguranca",
  },
  {
    pergunta: "Quanto São Paulo gastou em transporte?",
    href: "/sao-paulo/transporte",
  },
  {
    pergunta: "Quanto entrou de receita em São Paulo?",
    href: "/sao-paulo/receita",
  },
  {
    pergunta: "Qual é o orçamento total da Prefeitura de São Paulo?",
    href: "/sao-paulo/executivo",
  },
  {
    pergunta: "Como está a saúde fiscal de São Paulo (LRF)?",
    href: "/sao-paulo/saude-fiscal",
  },
  {
    pergunta: "Quanto o governo federal repassa para a saúde de São Paulo?",
    href: "/sao-paulo/saude",
  },
  {
    pergunta: "O que é empenho, liquidação e pagamento?",
    href: "/glossario",
  },
  {
    pergunta: "Como os dados são coletados e validados?",
    href: "/metodologia",
  },
]

export default function SaoPauloPage() {
  const anos = getAvailableYearsExecutivo("sao_paulo")
  const anoMaisRecente = anos[0] ?? null

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>
              São Paulo · São Paulo · Brasil
            </p>
            <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "800px" }}>
              Dados públicos da Prefeitura de São Paulo
            </h1>
            <p style={{ ...S.body, maxWidth: "640px", fontSize: "15px", lineHeight: "24px" }}>
              Base navegável com dados públicos de despesas, receitas e execução fiscal de São Paulo/SP.
              Organizada a partir de fontes oficiais — SICONFI/Tesouro Nacional e Secretaria da Fazenda de SP —
              com metodologia declarada e rastreabilidade até a fonte.
            </p>
            {anoMaisRecente && (
              <p className="mt-4" style={S.caption}>
                Dados disponíveis até {anoMaisRecente} · Fonte: SICONFI/Tesouro Nacional e TCE-SP · IBGE 3550308
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
                As páginas disponíveis cobrem orçamento total (RREO Anexo 02), receitas (RREO Anexo 01),
                saúde fiscal (RGF/LRF), repasses federais de saúde (FNS/FAF), segurança pública e transporte.
                Saúde e educação setoriais (SIOPS/SIOPE) e transferências intergovernamentais detalhadas
                ainda estão em coleta para São Paulo.
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
