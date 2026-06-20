import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { getAvailableYearsReceita } from "@/lib/data"

export const metadata: Metadata = {
  title: "Dados públicos de São Bernardo do Campo — Prefeitura de SBC/SP",
  description: "Base navegável de dados públicos de São Bernardo do Campo: receitas, execução fiscal (LRF), segurança pública e transporte. Série histórica 2020–2025. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-bernardo" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "20px", lineHeight: "28px", color: "var(--text-01)", fontWeight: 300, marginBottom: "8px" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const AREAS = [
  {
    titulo: "Segurança pública",
    descricao: "Execução orçamentária em segurança pública por ano. Dotação, liquidado e percentual do orçamento. Fonte: RREO/SICONFI.",
    href: "/sao-bernardo/seguranca",
    cor: "var(--purple-60)",
  },
  {
    titulo: "Transporte",
    descricao: "Execução orçamentária em transporte por ano. Dotação inicial, atualizada e liquidado. Fonte: RREO/SICONFI.",
    href: "/sao-bernardo/transporte",
    cor: "var(--cyan-60)",
  },
]

const MAIS_AREAS = [
  {
    titulo: "Receitas",
    descricao: "De onde vêm os recursos de São Bernardo: impostos próprios, ICMS/IPVA estaduais e transferências federais.",
    href: "/sao-bernardo/receita",
  },
  {
    titulo: "Saúde fiscal (LRF)",
    descricao: "Indicadores de responsabilidade fiscal: despesa com pessoal e dívida consolidada frente aos limites da LRF.",
    href: "/sao-bernardo/saude-fiscal",
  },
]

const CONSULTAS = [
  { pergunta: "Quanto São Bernardo do Campo gastou em segurança pública?",    href: "/sao-bernardo/seguranca" },
  { pergunta: "Quanto SBC gastou em transporte?",                             href: "/sao-bernardo/transporte" },
  { pergunta: "Quanto entrou de receita em São Bernardo?",                    href: "/sao-bernardo/receita" },
  { pergunta: "Como está a saúde fiscal de SBC (LRF)?",                       href: "/sao-bernardo/saude-fiscal" },
  { pergunta: "O que é empenho, liquidação e pagamento?",                     href: "/glossario" },
  { pergunta: "Como os dados são coletados e validados?",                     href: "/metodologia" },
]

export default function SaoBernardoPage() {
  const anos = getAvailableYearsReceita("sao_bernardo")
  const anoMaisRecente = anos[0] ?? null

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>
              São Bernardo do Campo · São Paulo · Brasil
            </p>
            <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "800px" }}>
              Dados públicos da Prefeitura de São Bernardo do Campo
            </h1>
            <p style={{ ...S.body, maxWidth: "640px", fontSize: "15px", lineHeight: "24px" }}>
              Base navegável com dados públicos de receitas e execução fiscal de São Bernardo do Campo/SP.
              Organizada a partir de fontes oficiais — SICONFI e Tesouro Nacional —
              com metodologia declarada e rastreabilidade até a fonte.
            </p>
            {anoMaisRecente && (
              <p className="mt-4" style={S.caption}>
                Dados disponíveis até {anoMaisRecente} · Fonte: SICONFI/Tesouro Nacional · IBGE 3548708
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
                São Bernardo do Campo está em fase inicial de cobertura. Os dados disponíveis cobrem
                receitas (RREO Anexo 01), saúde fiscal — despesa com pessoal e dívida LRF (RGF),
                segurança pública e transporte. Orçamento total por função e demais áreas estão em coleta.
              </p>
            </div>
          </div>
        </section>

        {/* Áreas de despesa */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Áreas de despesa com dados por ano</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {AREAS.map((area) => (
                <div key={area.titulo} className="py-8" style={{ ...S.borderBottom, paddingRight: "32px" }}>
                  <div style={{ borderLeft: `3px solid ${area.cor}`, paddingLeft: "16px" }}>
                    <h2 style={S.h2}>{area.titulo}</h2>
                    <p style={{ ...S.body, marginBottom: "16px" }}>{area.descricao}</p>
                    <Link href={area.href} style={{ fontSize: "13px", color: area.cor, textDecoration: "underline" }}>
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
                  style={{ display: "block", padding: "20px 24px 20px 0", ...S.borderBottom, textDecoration: "none" }}
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

        {/* Consultas frequentes */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Consultas frequentes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONSULTAS.map((c) => (
                <Link
                  key={c.pergunta}
                  href={c.href}
                  style={{ display: "block", padding: "14px 16px", border: "1px solid var(--border-01)", fontSize: "14px", color: "var(--text-02)", textDecoration: "none", lineHeight: "20px" }}
                >
                  {c.pergunta}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Metodologia */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Transparência e metodologia</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>Metodologia</p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  Como os dados são coletados, extraídos, validados e publicados. Inclui errata e limitações declaradas.
                </p>
                <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver metodologia completa →
                </Link>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>Fontes de dados</p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  SICONFI (Tesouro Nacional): RREO e RGF. Dados coletados via API federal pública — mesma base usada por TCEs e STN.
                </p>
                <Link href="/fontes" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver fontes →
                </Link>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>Licença</p>
                <p style={S.body}>
                  Dados públicos — uso livre com atribuição. Código-fonte e pipelines de coleta em repositório público.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/" className="nav-link">← Início</Link>
            <Link href="/sorocaba" className="nav-link">Sorocaba</Link>
            <Link href="/paulinia" className="nav-link">Paulínia</Link>
            <Link href="/sao-paulo" className="nav-link">São Paulo</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
