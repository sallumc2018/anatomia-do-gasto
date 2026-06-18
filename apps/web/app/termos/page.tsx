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

const SECOES = [
  {
    titulo: "Dados que coletamos sobre você",
    corpo: "Não pedimos cadastro, mas medimos eventos agregados de uso do site.",
    detalhe: "O site não exige cadastro, não tem login e não usa cookies de publicidade. Usamos Vercel Web Analytics para registrar eventos agregados de navegação e entender se o usuário encontrou a trilha principal do produto. Se quiser entrar em contato, o canal é direto: contato@anatomiadogasto.ong.br",
  },
  {
    titulo: "Dados exibidos no site",
    corpo: "Os dados orçamentários exibidos no site são baseados em documentos oficiais publicados pelo poder público brasileiro.",
    detalhe: "Sempre que possível, cite a fonte: \"Anatomia do Gasto — https://www.anatomiadogasto.ong.br, com base em dados de [fonte original]\". O reuso deve respeitar a licença do código do projeto e as condições aplicáveis às fontes oficiais de origem.",
  },
  {
    titulo: "Responsabilidade sobre os dados",
    corpo: "Nos datasets orçamentários publicados, o Anatomia do Gasto reproduz os valores extraídos dos documentos oficiais e declara as limitações conhecidas.",
    detalhe: "Se um PDF oficial contiver um erro de digitação, esse erro poderá aparecer no site até que a fonte seja corrigida ou a divergência seja declarada. O site não constitui assessoria jurídica, financeira ou contábil — os dados são fornecidos para fins informativos e de controle social.",
  },
  {
    titulo: "Código-fonte",
    corpo: "O código do projeto é aberto e está disponível no GitHub.",
    detalhe: "Qualquer pessoa pode auditar o pipeline de extração, o frontend e a lógica de verificação. Contribuições são bem-vindas via pull request. github.com/sallumc2018/anatomia-do-gasto",
  },
  {
    titulo: "Alterações nestes termos",
    corpo: "Estes termos podem ser atualizados conforme o projeto evolui.",
    detalhe: "Toda alteração ficará registrada no histórico de commits do GitHub com data e descrição da mudança. A versão vigente é sempre a exibida nesta página.",
  },
  {
    titulo: "Contato",
    corpo: "Para dúvidas, erros, parcerias ou qualquer outro assunto:",
    detalhe: "contato@anatomiadogasto.ong.br",
  },
]

export default function TermosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Termos de Uso e Privacidade</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Sem letra miúda
              </h1>
              <p style={{ ...S.body, maxWidth: "600px" }}>
                O site não exige cadastro. Os dados que exibe são públicos. O código é aberto.
                O que está abaixo é o detalhamento disso — em linguagem direta.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="flex flex-col gap-0" style={S.borderTop}>
              {SECOES.map((s, i) => (
                <div key={i} className="py-10 grid grid-cols-1 md:grid-cols-3 gap-8" style={S.borderBottom}>
                  <div>
                    <h2 style={{ ...S.h2, fontSize: "16px", marginBottom: "4px" }}>{s.titulo}</h2>
                    <p style={{ ...S.body, fontWeight: 600, color: "var(--text-01)", fontSize: "14px" }}>{s.corpo}</p>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <p style={s.titulo === "Contato" || s.titulo === "Código-fonte" ? S.mono : S.body}>{s.detalhe}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
