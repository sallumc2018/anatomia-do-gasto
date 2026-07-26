import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Apoie",
  description:
    "Como apoiar a Anatomia do Gasto: usar e citar os dados, divulgar um achado, contribuir com código ou dados, e propor parceria institucional. Projeto em estágio pré-CNPJ.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/apoie" },
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
  body: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

/**
 * Formas de apoio ordenadas pelo impacto real no projeto, não pela facilidade.
 * Um achado citado numa reportagem move mais do que um commit.
 */
const FORMAS = [
  {
    ordem: "01",
    titulo: "Use os dados e cite a fonte",
    texto:
      "É o apoio mais valioso e o mais barato. Cada reportagem, monografia, relatório de conselho municipal ou verificação que cita o projeto amplia o alcance dele sem custo nenhum. A página de citação traz o formato pronto para ABNT, APA e link direto ao arquivo.",
    href: "/como-citar",
    cta: "Ver como citar",
  },
  {
    ordem: "02",
    titulo: "Divulgue um achado, não o site",
    texto:
      "Divulgar “um projeto que organiza dados fiscais” não desperta interesse. Divulgar “o município X recebeu R$ Y do Fundo Nacional de Saúde e Z% foi para um único fornecedor” desperta. Se você encontrar um número que te fez parar, publique o número e aponte para a trilha que o sustenta.",
    href: "/sorocaba",
    cta: "Explorar as trilhas",
  },
  {
    ordem: "03",
    titulo: "Contribua com código ou dados",
    texto:
      "Há frentes abertas em engenharia frontend, engenharia de dados em Python e escrita cívica. Também ajuda muito reportar um dado errado: fonte oficial que mudou de formato, série truncada, valor que não fecha com o portal de origem.",
    href: "/voluntarios",
    cta: "Frentes de contribuição",
  },
  {
    ordem: "04",
    titulo: "Proponha parceria institucional",
    texto:
      "Câmaras municipais, tribunais de contas, redações, universidades e conselhos de controle social usam esse tipo de dado no dia a dia. Se você trabalha em alguma dessas frentes e quer cobertura de um município específico, o pedido pauta a fila de coleta.",
    href: "/contato",
    cta: "Falar com o projeto",
  },
]

export default function ApoiePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Apoie a Anatomia do Gasto",
            url: "https://www.anatomiadogasto.ong.br/apoie",
            inLanguage: "pt-BR",
            about: { "@id": "https://www.anatomiadogasto.ong.br/#organization" },
          }}
        />

        <section
          style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}
        >
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p style={S.label}>Apoie</p>
            <h1
              className="mt-4"
              style={{
                fontSize: "42px",
                lineHeight: "50px",
                fontWeight: 300,
                color: "var(--text-01)",
                maxWidth: "820px",
              }}
            >
              O dinheiro público federal chega em 585 municípios brasileiros. Nós
              seguimos o caminho dele.
            </h1>
            <p className="mt-6" style={{ ...S.body, maxWidth: "760px" }}>
              A Anatomia do Gasto rastreia repasses do Fundo Nacional de Saúde em{" "}
              <strong style={{ color: "var(--text-01)" }}>585 municípios</strong>,
              transferências federais em <strong style={{ color: "var(--text-01)" }}>193</strong>{" "}
              e emendas federais em <strong style={{ color: "var(--text-01)" }}>177</strong> — com
              trilha aprofundada em Sorocaba, Paulínia e São Paulo, cobrindo despesa,
              contratos, câmara, educação, saúde e controle externo.
            </p>
            <p className="mt-4" style={{ ...S.body, maxWidth: "760px" }}>
              Tudo com fonte oficial declarada, limites metodológicos explícitos e o
              arquivo original preservado. O projeto é mantido por uma pessoa.
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p style={S.label}>Como apoiar</p>
            <p className="mt-4" style={{ ...S.body, maxWidth: "760px" }}>
              Em ordem de impacto real no projeto — não de facilidade.
            </p>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {FORMAS.map((f) => (
                <div
                  key={f.ordem}
                  className="p-6"
                  style={{
                    border: "1px solid var(--border-01)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  <p style={S.mono}>{f.ordem}</p>
                  <h2
                    className="mt-3"
                    style={{
                      fontSize: "20px",
                      lineHeight: "26px",
                      fontWeight: 400,
                      color: "var(--text-01)",
                    }}
                  >
                    {f.titulo}
                  </h2>
                  <p className="mt-3" style={S.body}>
                    {f.texto}
                  </p>
                  <Link
                    href={f.href}
                    className="mt-4 inline-block"
                    style={{
                      fontSize: "14px",
                      color: "var(--theme-accent)",
                      textDecoration: "underline",
                    }}
                  >
                    {f.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/*
          Transparência sobre dinheiro: o projeto NÃO tem CNPJ nem entidade
          formalizada, então não solicita doação. Prometer destinação de recurso
          sem pessoa jurídica que responda por ela seria deturpação — e o resto
          do site declara os próprios limites, esta página não vai ser a exceção.
        */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p style={S.label}>Sobre apoio financeiro</p>
            <h2
              className="mt-4"
              style={{
                fontSize: "28px",
                lineHeight: "36px",
                fontWeight: 300,
                color: "var(--text-01)",
                maxWidth: "760px",
              }}
            >
              O projeto ainda não recebe doações, e isso é deliberado.
            </h2>
            <p className="mt-6" style={{ ...S.body, maxWidth: "760px" }}>
              A Anatomia do Gasto está em estágio{" "}
              <strong style={{ color: "var(--text-01)" }}>pré-CNPJ</strong>: não há
              pessoa jurídica constituída, estatuto registrado nem conta institucional.
              Enquanto isso for verdade, não há como prestar contas de recurso recebido
              — e um projeto que cobra transparência de prefeituras não pode ser opaco
              sobre o próprio dinheiro.
            </p>
            <p className="mt-4" style={{ ...S.body, maxWidth: "760px" }}>
              Quando a formalização acontecer, esta página passa a trazer a entidade, o
              CNPJ, o estatuto e a destinação dos recursos. Até lá, as quatro formas de
              apoio acima são as que existem, e a primeira delas vale mais que dinheiro.
            </p>
            <Link
              href="/institucional"
              className="mt-6 inline-block"
              style={{
                fontSize: "14px",
                color: "var(--theme-accent)",
                textDecoration: "underline",
              }}
            >
              Ver o status institucional completo
            </Link>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
