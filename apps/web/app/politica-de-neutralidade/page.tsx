import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

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
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const FAZ = [
  "Apresenta dados orçamentários extraídos de fontes oficiais, sem edição do conteúdo",
  "Explica terminologia técnica com linguagem acessível — o que cada termo significa, não o que ele implica",
  "Declara explicitamente todas as limitações conhecidas: cobertura geográfica, período dos dados, possíveis imprecisões na extração",
  "Registra publicamente cada correção aplicada, com rastreabilidade no histórico do GitHub",
  "Identifica as fontes de cada dado para que qualquer pessoa possa verificar independentemente",
]

const NAO_FAZ = [
  "Não emite opinião sobre se um número é bom ou ruim",
  "Não sugere causas para variações nos dados — aumento ou queda de gasto não tem interpretação editorial",
  "Não compara gestões de forma valorativa",
  "Não seleciona dados para reforçar uma narrativa",
  "Não publica conteúdo patrocinado ou parcial",
  "Não aceita contribuição editorial de nenhuma entidade com interesse nos dados que publica",
]

const ACEITA = [
  "Editais públicos de fomento à pesquisa, inovação ou transparência",
  "Acordos de pesquisa e extensão com universidades públicas",
  "Fundações independentes sem conflito de interesse direto com os dados publicados",
  "Apoio voluntário de cidadãos — contribuições individuais sem contrapartida editorial",
]

const RECUSA = [
  "Partidos políticos, candidatos ou organizações de qualquer espectro político",
  "Empresas com contratos ativos com o poder público de qualquer esfera",
  "Organizações com posição pública declarada sobre os dados que o projeto publica",
  "Qualquer financiamento condicionado a resultado editorial, seleção de dados ou omissão de informação",
  "Publicidade de qualquer natureza",
]

export default function PoliticaDeNeutralidadePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Política de Neutralidade</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                O que este projeto faz — e o que não faz
              </h1>
              <p style={{ ...S.body, maxWidth: "600px" }}>
                O Anatomia do Gasto existe para dar acesso à informação, não para influenciar como ela é interpretada.
                Estas regras não são aspiracionais — são operacionais. Definem o que aceitamos e o que recusamos.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <p className="uppercase font-semibold mb-8" style={S.label}>O que fazemos</p>
                <ul className="flex flex-col gap-4" style={S.borderTop}>
                  {FAZ.map((item, i) => (
                    <li key={i} className="flex gap-4 items-start" style={{ paddingTop: "16px", ...S.borderBottom, paddingBottom: "16px" }}>
                      <span style={{ ...S.mono, flexShrink: 0, marginTop: "3px", color: "var(--blue-60)" }}>✓</span>
                      <p style={S.body}>{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase font-semibold mb-8" style={S.label}>O que não fazemos</p>
                <ul className="flex flex-col gap-4" style={S.borderTop}>
                  {NAO_FAZ.map((item, i) => (
                    <li key={i} className="flex gap-4 items-start" style={{ paddingTop: "16px", ...S.borderBottom, paddingBottom: "16px" }}>
                      <span style={{ ...S.mono, flexShrink: 0, marginTop: "3px" }}>—</span>
                      <p style={S.body}>{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Financiamento — aceitamos</p>
                <p style={{ ...S.body, marginBottom: "20px" }}>
                  Qualquer financiamento recebido é declarado publicamente. Sem exceção.
                </p>
                <ul className="flex flex-col gap-3" style={S.borderTop}>
                  {ACEITA.map((item, i) => (
                    <li key={i} className="flex gap-4 items-start" style={{ paddingTop: "16px" }}>
                      <span style={{ ...S.mono, flexShrink: 0, marginTop: "3px", color: "var(--blue-60)" }}>✓</span>
                      <p style={S.body}>{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Financiamento — recusamos</p>
                <p style={{ ...S.body, marginBottom: "20px" }}>
                  A lista abaixo é permanente e não está sujeita a negociação caso a caso.
                </p>
                <ul className="flex flex-col gap-3" style={S.borderTop}>
                  {RECUSA.map((item, i) => (
                    <li key={i} className="flex gap-4 items-start" style={{ paddingTop: "16px" }}>
                      <span style={{ ...S.mono, flexShrink: 0, marginTop: "3px" }}>—</span>
                      <p style={S.body}>{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Conflito de interesse</p>
            <div style={{ maxWidth: "720px" }} className="flex flex-col gap-4">
              <p style={S.body}>
                O fundador do projeto não ocupa cargo público, não tem vínculo com nenhum partido político e não possui contrato com nenhuma esfera do poder público.
              </p>
              <p style={S.body}>
                Qualquer parceria institucional, acordo de pesquisa ou financiamento recebido será declarado publicamente nesta página e no repositório do projeto no GitHub.
              </p>
              <p style={S.body}>
                Se você identificar um conflito de interesse não declarado, reporte: <span style={S.mono}>contato@anatomiadogasto.ong.br</span>
              </p>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
