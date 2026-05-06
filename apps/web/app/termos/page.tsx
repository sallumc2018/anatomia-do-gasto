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
    corpo: "Nenhum.",
    detalhe: "O site não exige cadastro, não tem formulário de contato e não instala cookies de rastreamento. Não sabemos quem você é, de onde acessa ou quantas vezes visitou o site. Se quiser entrar em contato, o canal é direto: sallumc@gmail.com",
  },
  {
    titulo: "Dados exibidos no site",
    corpo: "Os dados exibidos são de domínio público, extraídos de documentos oficiais publicados pelo poder público brasileiro.",
    detalhe: "Eles podem ser reproduzidos livremente para fins não comerciais, desde que a fonte seja citada: \"Anatomia do Gasto — anatomia-do-gasto-y1ze.vercel.app, com base em dados de [fonte original]\". Para uso comercial, entre em contato antes: sallumc@gmail.com",
  },
  {
    titulo: "Responsabilidade sobre os dados",
    corpo: "O Anatomia do Gasto reproduz o conteúdo dos documentos oficiais. Não criamos, estimamos nem corrigimos valores.",
    detalhe: "Se um PDF oficial contiver um erro de digitação, esse erro será refletido nos dados do site até que o documento original seja corrigido. Divergências identificadas são registradas publicamente. O site não constitui assessoria jurídica, financeira ou contábil — os dados são fornecidos para fins informativos.",
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
    detalhe: "sallumc@gmail.com",
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
                O site não coleta seus dados. Os dados que exibe são públicos. O código é aberto.
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
