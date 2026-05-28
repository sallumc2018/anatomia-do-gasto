import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { calcularCobertura, calcularTotalRegistros, calcularDatasetsPublicados } from "@/lib/lacunas"

export const metadata: Metadata = {
  title: "Sobre — Anatomia do Gasto",
  description: "Projeto civico independente que organiza dados fiscais publicos em linguagem cidada, com fonte declarada, limites explicitos e rastreabilidade completa.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sobre" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
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
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const PRINCIPIOS = [
  {
    titulo: "Independência",
    texto: "Sem vínculo com partidos políticos, governos ou empresas. Nenhum patrocinador influencia o que é publicado.",
  },
  {
    titulo: "Fontes declaradas",
    texto: "Cada número tem uma fonte oficial identificada: SICONFI, SIOPS, Portal de Transparência municipal ou TCE. Sem inferências sem base.",
  },
  {
    titulo: "Limites explícitos",
    texto: "O que o site não sabe, ele diz que não sabe. Lacunas de dados são declaradas, não silenciadas.",
  },
  {
    titulo: "Código aberto",
    texto: "Pipeline de extração, transformação e validação publicado no GitHub. Qualquer pessoa pode auditar e reproduzir.",
  },
]

const COMO_FUNCIONA = [
  {
    etapa: "1. Coleta",
    descricao: "Dados extraídos de portais oficiais: SICONFI (Tesouro Nacional), SIOPS (Ministério da Saúde), TCE-SP e portais municipais de transparência.",
  },
  {
    etapa: "2. Transformação",
    descricao: "Scripts abertos convertem arquivos brutos (PDF, CSV, XML) em datasets validados com schema fixo e tipagem consistente.",
  },
  {
    etapa: "3. Validação",
    descricao: "Checks automáticos verificam totais, limites constitucionais e consistência entre fontes antes de qualquer publicação.",
  },
  {
    etapa: "4. Publicação",
    descricao: "Dados publicados em CSV aberto e apresentados em linguagem cidadã, com a fonte exata de cada número visível.",
  },
]

const VOLUNTARIOS = [
  {
    perfil: "Advogado",
    descricao: "Apoiar a formalizacao institucional futura (CNPJ, estatuto) e revisar o que podemos publicar sob a otica da LAI e da LGPD.",
  },
  {
    perfil: "Dev Full Stack",
    descricao: "Escalar a plataforma para novos municípios — a arquitetura já foi projetada para isso.",
  },
  {
    perfil: "Especialista em segurança",
    descricao: "Fortalecer a segurança do sistema e dos dados publicados à medida que o projeto cresce.",
  },
  {
    perfil: "Jornalista de dados",
    descricao: "Traduzir a linguagem técnica para linguagem cidadã, com foco em ciências políticas e impacto social.",
  },
]

export default function SobrePage() {
  const { percent } = calcularCobertura()
  const totalRegistros = Math.floor(calcularTotalRegistros() / 1_000)
  const datasetsPublicados = calcularDatasetsPublicados()

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Missão */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", maxWidth: "720px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>Missão</p>
              <h1 className="font-light mb-8" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                Tornar o gasto público compreensível para qualquer cidadão
              </h1>
              <p style={{ ...S.body, marginBottom: "20px" }}>
                O Anatomia do Gasto é um projeto civico independente que organiza dados fiscais oficiais
                de municípios brasileiros em linguagem acessível — com fonte declarada,
                limites explícitos e rastreabilidade completa.
              </p>
              <p style={S.body}>
                Começamos por Sorocaba/SP e expandimos para todo o Brasil. Cada município
                adicionado segue o mesmo padrão: dados públicos, metodologia aberta, sem
                vínculo com partidos ou governos.
              </p>
            </div>
          </div>
        </section>

        {/* Princípios */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Princípios</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-8" style={S.borderTop}>
              {PRINCIPIOS.map((item, i) => (
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
                  <h2 style={{ ...S.h2, fontSize: "17px", marginBottom: "8px" }}>{item.titulo}</h2>
                  <p style={S.body}>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Como funciona</p>
            <p style={{ ...S.body, marginBottom: "40px", color: "var(--text-03)" }}>
              Do portal oficial ao painel público — quatro etapas auditáveis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0" style={S.borderTop}>
              {COMO_FUNCIONA.map((item, i) => (
                <div
                  key={item.etapa}
                  className="py-8"
                  style={{
                    paddingRight: i < COMO_FUNCIONA.length - 1 ? "32px" : 0,
                    borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: i > 0 ? "32px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <p style={{ ...S.label, marginBottom: "12px", color: "var(--blue-40)" }}>{item.etapa}</p>
                  <p style={{ ...S.body, fontSize: "14px" }}>{item.descricao}</p>
                </div>
              ))}
            </div>
            <p className="mt-6" style={{ ...S.body, fontSize: "13px", color: "var(--text-03)" }}>
              Metodologia completa e código-fonte:{" "}
              <Link href="/metodologia" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>
                ver metodologia
              </Link>
            </p>
          </div>
        </section>

        {/* O projeto hoje — stats */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>O projeto hoje</p>
            <p style={{ ...S.body, marginBottom: "40px", color: "var(--text-03)" }}>
              Sorocaba/SP é o município piloto. A meta é replicar para todo o Brasil.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={S.borderTop}>
              {[
                { valor: `${percent}%`,             rotulo: "Cobertura de dados",    detalhe: "Sorocaba/SP" },
                { valor: `${datasetsPublicados}`,   rotulo: "Datasets publicados",   detalhe: "13 áreas temáticas" },
                { valor: `${totalRegistros} mil+`,  rotulo: "Registros disponíveis", detalhe: "Séries históricas" },
                { valor: "2020–2025",               rotulo: "Anos cobertos",         detalhe: "Série completa" },
              ].map((stat, i) => (
                <div
                  key={stat.rotulo}
                  className="py-8 pr-8"
                  style={{
                    borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: i > 0 ? "32px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <p style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 300, color: "var(--text-01)", lineHeight: 1, marginBottom: "8px" }}>
                    {stat.valor}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-02)", marginBottom: "4px" }}>{stat.rotulo}</p>
                  <p style={S.caption}>{stat.detalhe}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quem faz falta */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Quem faz falta</p>
            <p style={{ ...S.body, marginBottom: "40px", color: "var(--text-03)" }}>
              Estas são as maiores necessidades do projeto — qualquer forma de contribuição é bem-vinda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {VOLUNTARIOS.map((v, i) => (
                <div
                  key={v.perfil}
                  className="py-8"
                  style={{
                    paddingRight: i % 2 === 0 ? "48px" : 0,
                    paddingLeft:  i % 2 === 1 ? "48px" : 0,
                    borderLeft:   i % 2 === 1 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}
                >
                  <h2 style={{ ...S.h2, fontSize: "18px" }}>{v.perfil}</h2>
                  <p style={S.body}>{v.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fundador */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Fundador</p>
            <div className="mt-8" style={S.borderTop}>
              <div className="py-8" style={S.borderBottom}>
                <h2 style={{ ...S.h2, fontSize: "18px" }}>Alexandre Sallum Cunha</h2>
                <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "16px" }}>
                  Cidadão inconformado com a opacidade das contas públicas. Iniciou o projeto em 2026
                  como piloto em Sorocaba/SP com o objetivo de escalar para todos os municípios brasileiros.
                </p>
                <Link href="/sobre/fundador" style={{ fontSize: "14px", color: "var(--blue-40)", textDecoration: "underline" }}>
                  Conheça a história do fundador →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contato */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Contato</p>
            <div className="flex flex-col gap-4" style={{ ...S.borderTop, paddingTop: "32px" }}>
              <p style={S.body}>Uma pessoa real vai ler e responder.</p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:contato@anatomiadogasto.ong.br"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "14px", color: "var(--blue-40)", textDecoration: "underline" }}
                >
                  contato@anatomiadogasto.ong.br
                </a>
              </div>
              <p className="mt-2" style={{ fontSize: "13px", color: "var(--text-03)" }}>
                Ou{" "}
                <Link href="/contato" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>
                  acesse a página de contato
                </Link>
                {" "}para mais canais.
              </p>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
