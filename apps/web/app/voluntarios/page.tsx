import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Colaboração e Voluntariado — Anatomia do Gasto",
  description: "Faça parte do Anatomia do Gasto. Ajude a decifrar as contas públicas e tornar os gastos municipais compreensíveis para qualquer cidadão.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/voluntarios" },
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase" as const,
  },
  h2: {
    fontSize: "20px",
    lineHeight: "28px",
    color: "var(--text-01)",
    fontWeight: 300,
    marginBottom: "8px",
  } as React.CSSProperties,
  body: {
    fontSize: "15px",
    lineHeight: "26px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const PERFIS = [
  {
    titulo: "Engenharia Frontend (React / Next.js)",
    texto: "Ajudar a refinar e expandir a interface do site, otimizar a experiência do usuário, garantir a responsividade e tornar as visualizações de dados rápidas e acessíveis para o cidadão comum.",
  },
  {
    titulo: "Ciência e Engenharia de Dados (Python)",
    texto: "Atuar nos pipelines de dados. Escrever e manter scrapers (crawlers) para buscar dados públicos e estruturar os processos de transformação e validação de despesas municipais.",
  },
  {
    titulo: "Jornalismo de Dados e Escrita Cívica",
    texto: "Traduzir relatórios fiscais complexos e planilhas áridas em explicações simples, artigos explicativos e glossários voltados ao cidadão sem formação contábil.",
  },
  {
    titulo: "Auditoria Cívica e Validação",
    texto: "Cruzamento independente de dados publicados no portal com os portais de transparência locais para validar a metodologia de extração e apontar desvios e lacunas de dados.",
  },
]

const PASSOS = [
  {
    passo: "1. Leia o Guia",
    titulo: "Entenda o Fluxo de Contribuição",
    descricao: "Leia o arquivo de diretrizes para entender os critérios de aceitação e estilo de código.",
    linkText: "Ver CONTRIBUTING.md",
    href: "https://github.com/sallumc2018/anatomia-do-gasto/blob/main/CONTRIBUTING.md",
  },
  {
    passo: "2. Escolha sua tarefa",
    titulo: "Trabalhe em Issues Abertas",
    descricao: "Navegue pelo repositório oficial e busque por tarefas marcadas com etiquetas amigáveis.",
    linkText: "Ver Issues no GitHub",
    href: "https://github.com/sallumc2018/anatomia-do-gasto/issues",
  },
  {
    passo: "3. Entre em contato",
    titulo: "Escreva uma mensagem",
    descricao: "Envie uma mensagem contando a sua área de interesse ou abra uma Issue de apresentação no GitHub.",
    linkText: "Enviar e-mail para o projeto",
    href: "mailto:contato@anatomiadogasto.ong.br",
  },
]

export default function VoluntariosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero Section */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", maxWidth: "720px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>Código Aberto e Controle Social</p>
              <h1 className="font-light mb-8" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                Construído de forma transparente e colaborativa
              </h1>
              <p style={{ ...S.body, marginBottom: "20px" }}>
                O Anatomia do Gasto é um projeto de código aberto e auditoria fiscal independente.
                Toda a plataforma é mantida de forma independente para que o controle social
                do orçamento municipal seja acessível e de fácil compreensão para qualquer pessoa.
              </p>
              <p style={S.body}>
                Para colaborar, não é necessária burocracia ou formalizações contratuais.
                O projeto adota o modelo de código aberto (Open Source) para garantir que qualquer desenvolvedor,
                designer, jornalista ou cidadão possa fazer uma contribuição real e auditável imediatamente.
              </p>
            </div>
          </div>
        </section>

        {/* Como colaborar (Perfis) */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Áreas de Contribuição</p>
            <p style={{ ...S.body, marginBottom: "40px", color: "var(--text-03)" }}>
              Escolha a área em que deseja atuar. Toda contribuição cívica é valiosa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-8" style={S.borderTop}>
              {PERFIS.map((item, i) => (
                <div
                  key={item.titulo}
                  className="py-8"
                  style={{
                    paddingRight: i % 2 === 0 ? "48px" : 0,
                    paddingLeft:  i % 2 === 1 ? "48px" : 0,
                    borderLeft:   i % 2 === 1 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}
                >
                  <h2 style={{ ...S.h2, fontSize: "17px", marginBottom: "8px", fontWeight: 500 }}>{item.titulo}</h2>
                  <p style={S.body}>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Passo a Passo de Integração */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Como Começar</p>
            <p style={{ ...S.body, marginBottom: "40px", color: "var(--text-03)" }}>
              Siga estas etapas simples para se integrar ao desenvolvimento da plataforma.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {PASSOS.map((item, i) => (
                <div
                  key={item.passo}
                  className="py-8"
                  style={{
                    paddingRight: i < PASSOS.length - 1 ? "32px" : 0,
                    borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: i > 0 ? "32px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <p style={{ ...S.label, marginBottom: "12px", color: "var(--blue-40)" }}>{item.passo}</p>
                  <h3 style={{ fontSize: "16px", color: "var(--text-01)", fontWeight: 600, marginBottom: "8px" }}>
                    {item.titulo}
                  </h3>
                  <p style={{ ...S.body, fontSize: "14px", marginBottom: "16px" }}>{item.descricao}</p>
                  <a
                    href={item.href}
                    {...(item.href.startsWith("mailto:")
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}
                  >
                    {item.linkText}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contato Final */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Dúvidas e Sugestões</p>
            <div className="flex flex-col gap-4" style={{ ...S.borderTop, paddingTop: "32px" }}>
              <p style={S.body}>
                Caso tenha alguma ideia que não se encaixe nas categorias acima ou queira propor uma nova funcionalidade,
                entre em contato pelo e-mail oficial:
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:contato@anatomiadogasto.ong.br"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "14px", color: "var(--blue-40)", textDecoration: "underline" }}
                >
                  contato@anatomiadogasto.ong.br
                </a>
              </div>
              <p style={S.body}>
                Também é possível conferir mais detalhes sobre a organização na página{" "}
                <Link href="/sobre" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>
                  Sobre a ONG
                </Link>.
              </p>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
