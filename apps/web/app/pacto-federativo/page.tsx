import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Rastro Federativo",
  description:
    "Como o dinheiro flui entre União, estados e municípios — e o que precisamos medir antes de tirar conclusões. Metodologia em construção.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/pacto-federativo" },
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
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
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const ESCOPOS = [
  {
    titulo: "Sorocaba",
    descricao:
      "Ponto de partida. Mapeamos o que entra — FPM, ICMS, IPVA, SUS, Fundeb, emendas, convênios — e o que sai em gastos de saúde, educação, segurança e transporte. Sorocaba não possui subprefeituras nem administrações regionais autônomas: a gestão é centralizada na Prefeitura.",
    status: "Em mapeamento",
    fontes: ["SICONFI/DCA", "SIOPS", "Portal de Transparência de Sorocaba"],
  },
  {
    titulo: "Estado de São Paulo",
    descricao:
      "O Estado de SP arrecada parcela expressiva de ICMS e transfere parte para municípios via cota-parte e Fundeb estadual. A relação entre o que Sorocaba repassa ao Estado e o que recebe de volta ainda não foi medida.",
    status: "Não iniciado",
    fontes: ["SICONFI estadual", "SEF-SP", "ALESP/LOA estadual"],
  },
  {
    titulo: "União Federal",
    descricao:
      "A União retém tributos como IPI, IR e contribuições previdenciárias, devolvendo parcela via FPM, SUS e Fundeb. A proporção entre o que os cidadãos de Sorocaba pagam federalmente e o que recebem de volta é uma pergunta em aberto.",
    status: "Não iniciado",
    fontes: ["Tesouro Nacional", "STN/SICONFI", "DataSUS"],
  },
  {
    titulo: "SP Capital vs. outros municípios",
    descricao:
      "Há hipótese de que São Paulo Capital contribui mais ao pacto federativo do que recebe em transferências. Isso é uma questão metodológica aberta — não uma conclusão. Exige dados comparativos de FPM, ICMS-cota e repasses por habitante.",
    status: "Hipótese aberta",
    fontes: ["STN/SICONFI comparativo", "IBGE populações", "FPM histórico"],
  },
]

const TRANSFERENCIAS_SOROCABA = [
  {
    sigla: "FPM",
    nome: "Fundo de Participação dos Municípios",
    descricao: "Parcela do IR e IPI federal destinada aos municípios. Calculada por faixa populacional.",
    fonte: "STN / Tesouro Nacional",
    status: "A mapear",
  },
  {
    sigla: "ICMS-Cota",
    nome: "Cota-parte do ICMS Estadual",
    descricao: "25% do ICMS arrecadado pelo Estado de SP é distribuído aos municípios por critérios fixados em lei estadual.",
    fonte: "SEF-SP / SICONFI estadual",
    status: "A mapear",
  },
  {
    sigla: "IPVA",
    nome: "Cota-parte do IPVA",
    descricao: "50% do IPVA dos veículos emplacados em Sorocaba fica no município.",
    fonte: "SEF-SP / SICONFI estadual",
    status: "A mapear",
  },
  {
    sigla: "SUS/FNS",
    nome: "Transferências fundo a fundo do SUS",
    descricao: "Blocos de custeio e capital repassados pelo Fundo Nacional de Saúde ao município.",
    fonte: "SIOPS / FNS",
    status: "Parcialmente mapeado",
  },
  {
    sigla: "Fundeb",
    nome: "Fundo de Manutenção da Educação Básica",
    descricao: "Fundo estadual que redistribui recursos entre estado e municípios com base no número de matrículas.",
    fonte: "FNDE / SIOPE",
    status: "A mapear",
  },
  {
    sigla: "Emendas",
    nome: "Emendas parlamentares e convênios",
    descricao: "Transferências voluntárias da União ou Estado via emendas parlamentares, contratos de repasse e convênios.",
    fonte: "SICONV / Transferegov",
    status: "Não iniciado",
  },
]

const PERGUNTAS_METODOLOGICAS = [
  "Por habitante, quanto Sorocaba arrecada em tributos próprios e quanto recebe em transferências?",
  "A soma de ISS + IPTU + outras receitas próprias supera ou é inferior à soma de FPM + ICMS-cota + IPVA recebidos?",
  "Como essa proporção se compara com municípios de tamanho similar no Estado de SP?",
  "Qual é o custo per capita de cada esfera de governo para o cidadão de Sorocaba?",
  "O que muda na qualidade dos serviços locais quando transferências federais ou estaduais aumentam ou diminuem?",
]

export default function PactoFederativoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="mobile-status-row flex items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Rastro Federativo</p>
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "var(--text-04)",
                    border: "1px solid var(--border-02)",
                    padding: "3px 8px",
                  }}
                >
                  Em construção
                </span>
              </div>
              <h1
                className="font-light mb-6"
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  lineHeight: "1.2",
                  color: "var(--text-01)",
                  maxWidth: "760px",
                }}
              >
                Como o dinheiro flui entre esferas de governo
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "20px" }}>
                O Pacto Federativo define como tributos arrecadados no país são distribuídos entre União,
                estados e municípios. Entender o que Sorocaba contribui e o que recebe de volta é o
                objetivo desta frente — mas antes de publicar números, precisamos mapear as fontes e
                metodologia com precisão.
              </p>
              <div
                className="p-4"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}
              >
                <p style={{ ...S.caption, color: "var(--text-03)" }}>
                  <strong style={{ color: "var(--text-02)" }}>Aviso metodológico:</strong>{" "}
                  Esta página apresenta o escopo do que será mapeado e as perguntas que guiam a coleta.
                  Dados ausentes não são tratados como zero. Nenhuma conclusão foi publicada aqui ainda.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Escopos */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Escopos do mapeamento</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {ESCOPOS.map((e, i) => (
                <div
                  key={e.titulo}
                  className="mobile-indexed-cell py-8"
                  style={{
                    paddingRight: i % 2 === 0 ? "48px" : 0,
                    paddingLeft: i % 2 === 1 ? "48px" : 0,
                    borderLeft: i % 2 === 1 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}
                >
                  <div className="mobile-status-row flex items-center gap-3 mb-3">
                    <h2 style={{ ...S.h2, marginBottom: 0 }}>{e.titulo}</h2>
                    <span
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--text-04)",
                        border: "1px solid var(--border-01)",
                        padding: "2px 6px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {e.status}
                    </span>
                  </div>
                  <p style={{ ...S.body, marginBottom: "12px" }}>{e.descricao}</p>
                  <p style={S.caption}>Fontes previstas: {e.fontes.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transferências para Sorocaba */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="mb-10">
              <p className="uppercase font-semibold mb-3" style={S.label}>Transferências a mapear — Sorocaba</p>
              <p style={{ ...S.body, maxWidth: "640px" }}>
                Antes de comparar o que Sorocaba contribui com o que recebe, é preciso documentar cada
                fluxo de entrada. As transferências abaixo representam as principais fontes previstas no
                mapeamento.
              </p>
            </div>
            <div
              className="mobile-bordered-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{
                borderTop: "1px solid var(--border-01)",
                borderLeft: "1px solid var(--border-01)",
              }}
            >
              {TRANSFERENCIAS_SOROCABA.map((t) => (
                <div
                  key={t.sigla}
                  className="p-6 flex flex-col gap-2"
                  style={{
                    borderRight: "1px solid var(--border-01)",
                    borderBottom: "1px solid var(--border-01)",
                    backgroundColor: "var(--bg-base)",
                  }}
                >
                  <div className="mobile-status-row flex items-start justify-between gap-3">
                    <span
                      className="font-mono font-medium"
                      style={{ fontSize: "13px", color: "var(--blue-40)" }}
                    >
                      {t.sigla}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--text-04)",
                        border: "1px solid var(--border-01)",
                        padding: "2px 6px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-01)" }}>
                    {t.nome}
                  </h3>
                  <p style={{ ...S.body, fontSize: "14px", flex: 1 }}>{t.descricao}</p>
                  <p style={S.caption}>Fonte: {t.fonte}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Perguntas metodológicas */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Perguntas metodológicas</p>
                <h2 style={S.h2}>
                  O que queremos medir — sem conclusão antes da medição
                </h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  A hipótese de que São Paulo (capital ou estado) é contribuinte líquido do pacto federativo
                  é uma pergunta em aberto, não uma conclusão. O mesmo vale para Sorocaba.
                  Apresentamos as questões que guiam o mapeamento.
                </p>
                <p style={S.caption}>
                  Dado ausente não é zero. Quando não tivermos a medição, declaramos ausência — não inferimos.
                </p>
              </div>
              <div style={S.borderTop}>
                {PERGUNTAS_METODOLOGICAS.map((p, i) => (
                  <div
                    key={i}
                    className="py-5 flex gap-5 items-start"
                    style={S.borderBottom}
                  >
                    <span
                      className="font-mono flex-shrink-0"
                      style={{ fontSize: "12px", color: "var(--text-04)", width: "20px" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p style={{ ...S.body, fontSize: "14px" }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>Contribuir com o mapeamento</p>
                <p style={{ ...S.body, maxWidth: "560px" }}>
                  Se você tem acesso a dados de transferências federais ou estaduais para Sorocaba,
                  ou conhece fonte primária relevante, entre em contato diretamente.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 flex-shrink-0">
                <Link href="/contato" className="nav-link">Falar diretamente</Link>
                <Link href="/metodologia" className="nav-link">Ver metodologia</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
