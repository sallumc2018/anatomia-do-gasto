import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Sobre",
  description: "Quem faz o Anatomia do Gasto, por que existe e quais são os princípios que guiam o projeto de rastreamento auditável do dinheiro público em Sorocaba.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sobre" },
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
    fontSize: "22px",
    lineHeight: "30px",
    color: "var(--text-01)",
    fontWeight: 300,
    marginBottom: "12px",
  } as React.CSSProperties,
  body: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const PRINCIPIOS = [
  {
    titulo: "Sem juízo editorial sobre os valores",
    texto:  "Mostramos os valores e limites das fontes oficiais sem adjetivar o gasto como 'excessivo' ou 'má gestão'. Quando há lacuna ou escolha metodológica, o site declara isso.",
  },
  {
    titulo: "Limitações declaradas explicitamente",
    texto:  "Cada página informa o que os dados cobrem e o que fica de fora. Transparência sobre a própria metodologia é parte do projeto.",
  },
  {
    titulo: "Sem afiliação política",
    texto:  "O projeto não apoia nem critica partidos, candidatos ou gestões. Os dados são apresentados igualmente para qualquer período.",
  },
  {
    titulo: "Código aberto",
    texto:  "O pipeline de extração e o código do site são públicos. Qualquer pessoa pode auditar, reproduzir ou adaptar para outros municípios.",
  },
]

const ETAPAS = [
  { num: "01", titulo: "Piloto em Sorocaba/SP",  texto: "Sorocaba foi escolhida por ter relatórios públicos bem estruturados e tamanho suficiente para ser representativa de municípios médios brasileiros." },
  { num: "02", titulo: "Aproximação acadêmica em construção", texto: "O projeto pretende dialogar com pesquisadores e instituições acadêmicas para revisão metodológica e validação externa. Parcerias formais só serão anunciadas quando estiverem documentadas." },
  { num: "03", titulo: "ONG em formação",         texto: "O Anatomia do Gasto está se constituindo como organização sem fins lucrativos. Sem publicidade, sem fins comerciais, sem financiamento partidário." },
  { num: "04", titulo: "Expansão nacional",       texto: "O objetivo é replicar o modelo para outros municípios brasileiros. A arquitetura do pipeline foi projetada para isso desde o início." },
]

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Sobre o projeto</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Orçamento público em linguagem acessível
              </h1>
              <p style={{ ...S.body, maxWidth: "600px" }}>
                O Anatomia do Gasto transforma relatórios fiscais oficiais em informação compreensível para qualquer cidadão.
                Sem jargão desnecessário e sem juízo editorial sobre os valores — com metodologia, limites e fontes declarados.
              </p>
            </div>
          </div>
        </section>

        {/* Princípios */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Princípios</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {PRINCIPIOS.map((p, i) => (
                <div
                  key={p.titulo}
                  className="py-8"
                  style={{
                    paddingRight: i % 2 === 0 ? "48px" : 0,
                    paddingLeft:  i % 2 === 1 ? "48px" : 0,
                    borderLeft:   i % 2 === 1 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}
                >
                  <h2 style={S.h2}>{p.titulo}</h2>
                  <p style={S.body}>{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Etapas / história */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Como surgiu</p>
            <div className="flex flex-col gap-0" style={S.borderTop}>
              {ETAPAS.map((e) => (
                <div key={e.num} className="py-8 flex gap-8 items-start" style={S.borderBottom}>
                  <span className="font-mono font-medium flex-shrink-0" style={{ fontSize: "13px", color: "var(--text-04)", width: "28px" }}>
                    {e.num}
                  </span>
                  <div>
                    <h2 style={{ ...S.h2, marginBottom: "8px" }}>{e.titulo}</h2>
                    <p style={S.body}>{e.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contato */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Contato e código</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 style={S.h2}>Código-fonte</h2>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  O pipeline de extração de dados e o código do site são públicos.
                  Qualquer pessoa pode auditar, reportar erros ou contribuir.
                </p>
                <a
                  href="https://github.com/sallumc2018/anatomia-do-gasto"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...S.caption, color: "var(--text-03)", textDecoration: "underline" }}
                >
                  github.com/sallumc2018/anatomia-do-gasto
                </a>
              </div>
              <div>
                <h2 style={S.h2}>Erros nos dados</h2>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  Se você encontrar um número incorreto ou uma discrepância com a fonte oficial,
                  abra uma issue no repositório ou envie um e-mail com o link da fonte original.
                </p>
                <p style={S.caption}>
                  Conferimos os dados contra os PDFs originais do portal de transparência de Sorocaba.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
