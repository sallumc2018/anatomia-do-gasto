import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Controle externo (TCE-SP) — Paulínia",
  description:
    "Pareceres prévios do TCE-SP sobre as contas anuais de Paulínia 2008–2017: 6 pareceres desfavoráveis, 4 favoráveis. Alertas AUDESP. Inventário completo de documentos.",
  alternates: { canonical: `${SITE_URL}/paulinia/controle-externo` },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")

interface Parecer {
  ano: number
  rotulo: string
  arquivo: string
  url: string
  status: string
  observacao: string
  favoravel: boolean
}

interface Alerta {
  exercicio: string
  mes: string
  entidade: string
  item: string
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function loadPareceres(): Parecer[] {
  const fp = path.join(DATA_ROOT, "paulinia", "controle_externo", "tce", "saida", "inventario_pdfs_contas_anuais_tce_paulinia.csv")
  if (!fs.existsSync(fp)) return []
  const text = fs.readFileSync(fp, "utf-8").replace(/^﻿/, "")
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim())
  const idx = (name: string) => headers.indexOf(name)
  const iAno = idx("ano_referencia_publicacao")
  const iRot = idx("rotulo")
  const iArq = idx("arquivo")
  const iUrl = idx("url")
  const iSt  = idx("status")
  const iObs = idx("observacao")

  return lines.slice(1).map((line) => {
    const f = line.split(",")
    const rotulo = (f[iRot] ?? "").trim().replace(/^"|"$/g, "")
    return {
      ano: parseInt(f[iAno] ?? "0") || 0,
      rotulo,
      arquivo: (f[iArq] ?? "").trim(),
      url: (f[iUrl] ?? "").trim(),
      status: (f[iSt] ?? "").trim(),
      observacao: (f[iObs] ?? "").trim(),
      favoravel: rotulo.includes("Favorável") && !rotulo.includes("Desfavorável"),
    }
  }).sort((a, b) => b.ano - a.ano)
}

function loadAlertas(): Alerta[] {
  const fp = path.join(DATA_ROOT, "paulinia", "controle_externo", "tce", "saida", "alertas_tce_paulinia.csv")
  if (!fs.existsSync(fp)) return []
  const text = fs.readFileSync(fp, "utf-8").replace(/^﻿/, "")
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim())
  const iEx  = headers.indexOf("Exercício")
  const iMes = headers.indexOf("Mês")
  const iEnt = headers.indexOf("Entidade")
  const iItm = headers.indexOf("Item de Análise")
  return lines.slice(1).map((line) => {
    const f = line.split(",")
    return {
      exercicio: (f[iEx] ?? "").trim(),
      mes: (f[iMes] ?? "").trim(),
      entidade: (f[iEnt] ?? "").trim(),
      item: (f[iItm] ?? "").trim(),
    }
  })
}

const jsonLd = [
  datasetSchema({
    name: "Pareceres prévios TCE-SP — Paulínia 2008–2017",
    description:
      "Inventário dos pareceres prévios do Tribunal de Contas do Estado de São Paulo sobre as contas anuais do Município de Paulínia. 10 documentos, 2008–2017. IBGE 3536505.",
    url: `${SITE_URL}/paulinia/controle-externo`,
    temporalCoverage: "2008/2017",
    spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
    keywords: ["TCE-SP", "controle externo", "pareceres prévios", "contas anuais", "Paulínia"],
    dateModified: "2026-06-01",
    downloadUrls: [
      `${SITE_URL}/api/dados/paulinia/controle_externo/tce/saida/inventario_pdfs_contas_anuais_tce_paulinia.csv`,
      `${SITE_URL}/api/dados/paulinia/controle_externo/tce/saida/alertas_tce_paulinia.csv`,
    ],
  }),
  breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "Paulínia", url: `${SITE_URL}/paulinia` },
    { name: "Controle externo" },
  ]),
]

export default function PauliniaControleExternoPage() {
  const pareceres = loadPareceres()
  const alertas   = loadAlertas()

  const favoraveis   = pareceres.filter((p) => p.favoravel).length
  const desfavoraveis = pareceres.filter((p) => !p.favoravel).length

  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--red-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Controle externo · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  TCE-SP
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Controle externo — TCE-SP e contas anuais
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                O Tribunal de Contas do Estado de São Paulo (TCE-SP) emite pareceres prévios sobre
                as contas anuais do Prefeito de Paulínia. Entre 2008 e 2017 —{" "}
                <strong style={{ color: "var(--text-01)" }}>
                  período com julgamento finalizado —
                </strong>{" "}
                {desfavoraveis} de {pareceres.length} pareceres foram desfavoráveis ({favoraveis} favoráveis).
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)" }}>
                Fonte: TCE-SP (AUDESP). Pareceres com trânsito em julgado. Os exercícios 2018 em
                diante ainda estão em tramitação no tribunal.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Pareceres inventariados", valor: String(pareceres.length), nota: "Contas anuais 2008–2017" },
                { label: "Desfavoráveis", valor: String(desfavoraveis), nota: `${((desfavoraveis / pareceres.length) * 100).toFixed(0)}% do total — maioria dos exercícios` },
                { label: "Favoráveis", valor: String(favoraveis), nota: "Exercícios 2008–2011" },
                { label: "Alertas AUDESP", valor: String(alertas.length), nota: "Exercício 2019 (único disponível)" },
              ].map((item) => (
                <div key={item.label}>
                  <p style={S.label} className="mb-1">{item.label}</p>
                  <p className="font-light mt-2" style={{ fontSize: "28px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                    {item.valor}
                  </p>
                  <p className="mt-1" style={S.caption}>{item.nota}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pareceres prévios */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Pareceres prévios — contas anuais do prefeito</p>
            <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "24px", maxWidth: "640px" }}>
              O parecer prévio do TCE-SP é a opinião técnica sobre as contas do Prefeito. O julgamento
              final cabe à Câmara Municipal. Documentos obtidos via AUDESP/TCE-SP.
            </p>
            <div style={S.borderTop}>
              {pareceres.map((p) => (
                <div key={p.ano} className="grid grid-cols-[80px_1fr_auto] gap-4 items-start py-4" style={S.borderBottom}>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-01)" }}>{p.ano}</p>
                    <p style={{ ...S.caption, marginTop: "2px" }}>Exercício</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text-02)", lineHeight: "20px" }}>
                      {p.rotulo.replace(/^Parecer Previo - Exercicio \d+ - /i, "").replace(/\(Favorável\)|\(Desfavorável\)/gi, "").trim()}
                    </p>
                    {p.observacao && (
                      <p style={{ ...S.caption, marginTop: "4px", lineHeight: "18px" }}>{p.observacao}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span style={{
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "3px 8px",
                      backgroundColor: p.favoravel ? "var(--green-90)" : "var(--red-90)",
                      color: p.favoravel ? "var(--green-30)" : "var(--red-30)",
                    }}>
                      {p.favoravel ? "Favorável" : "Desfavorável"}
                    </span>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "11px", color: "var(--blue-40)", textDecoration: "none" }}
                        className="hover:underline">
                        PDF ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: TCE-SP — AUDESP (tce.sp.gov.br). Pareceres obtidos via inventário automatizado.
              Exercícios 2018 em diante sem parecer com trânsito em julgado disponível.
            </p>
          </div>
        </section>

        {/* Alertas AUDESP */}
        {alertas.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-2" style={S.label}>Alertas AUDESP — exercício 2019</p>
              <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "24px", maxWidth: "640px" }}>
                Itens de análise gerados pelo sistema AUDESP do TCE-SP. Esses alertas indicam
                inconsistências ou pontos de atenção identificados na prestação de contas mensal.
                O sistema cobre conformidade de entrega, receitas, RPPS e FUNDEB.
              </p>
              <div style={S.borderTop}>
                {alertas.slice(0, 12).map((a, i) => (
                  <div key={i} className="grid grid-cols-[64px_auto_1fr] gap-4 items-start py-3" style={S.borderBottom}>
                    <span style={{ fontSize: "11px", color: "var(--text-04)" }}>{a.exercicio}/{a.mes}</span>
                    <span style={{ fontSize: "10px", letterSpacing: "0.04em", color: "var(--text-03)", padding: "2px 6px", backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", whiteSpace: "nowrap" }}>
                      {a.entidade.includes("CÂMARA") ? "Câmara" : "Prefeitura"}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-02)", lineHeight: "18px" }}>{a.item}</span>
                  </div>
                ))}
                {alertas.length > 12 && (
                  <p className="pt-3" style={S.caption}>
                    + {alertas.length - 12} alertas adicionais disponíveis no arquivo CSV.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* O que é o TCE-SP */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>O que é o controle externo</p>
                <p style={S.body}>
                  O controle externo é exercido pelo Tribunal de Contas do Estado de São Paulo (TCE-SP)
                  sobre as contas dos municípios paulistas. O TCE-SP analisa a execução orçamentária,
                  licitações, contratos, folha de pagamento e cumprimento de índices constitucionais
                  (saúde, educação, RPPS) e da LRF.
                </p>
                <p style={{ ...S.body, marginTop: "12px" }}>
                  O <strong>parecer prévio</strong> é a conclusão técnica do TCE-SP sobre as contas
                  anuais do Prefeito. Um parecer desfavorável indica que o tribunal identificou
                  irregularidades ou descumprimento de normas — mas o julgamento final é da
                  Câmara Municipal (art. 31 CF/88).
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Padrão histórico de Paulínia</p>
                <p style={S.body}>
                  Paulínia recebeu pareceres favoráveis nos exercícios 2008 a 2011 e desfavoráveis
                  nos exercícios 2012 a 2017. A virada para desfavorável coincide com o período de
                  expansão de gastos com obras e contratos que ficaram sob investigação.
                </p>
                <p style={{ ...S.caption, marginTop: "12px", lineHeight: "18px" }}>
                  Para consultar processos individuais, use o sistema de busca do TCE-SP em{" "}
                  <a href="https://www.tce.sp.gov.br/processos" target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--blue-40)", textDecoration: "none" }}
                    className="hover:underline">
                    tce.sp.gov.br/processos
                  </a>{" "}
                  com o código do município de Paulínia (026).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <div className="flex flex-wrap gap-3">
              <a href="/api/dados/paulinia/controle_externo/tce/saida/inventario_pdfs_contas_anuais_tce_paulinia.csv"
                className="nav-link" download>
                Inventário pareceres (CSV)
              </a>
              <a href="/api/dados/paulinia/controle_externo/tce/saida/alertas_tce_paulinia.csv"
                className="nav-link" download>
                Alertas AUDESP 2019 (CSV)
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/saude-fiscal" className="nav-link">Saúde fiscal (LRF)</Link>
            <Link href="/paulinia/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
