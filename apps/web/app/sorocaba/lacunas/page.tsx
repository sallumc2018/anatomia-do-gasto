import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"
import { LACUNAS, type Prioridade, type Status } from "@/lib/lacunas"

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
                  empenhos, emendas de vereadores e Câmara/gabinete — com séries publicadas conforme o período
                  de cada fonte — e priorizações da audiência pública da LOA 2022–2026.
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
