import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { AvisoMaturidade } from "@/components/ui/aviso-maturidade"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Metodologia",
  description: "Como os dados de saúde, educação, segurança e transporte de Sorocaba são coletados, extraídos de PDFs oficiais e validados antes de serem publicados.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/metodologia" },
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
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const PIPELINE = [
  {
    num:    "01",
    titulo: "Download dos relatórios",
    texto:  "Os relatórios quadrimestrais de saúde e de educação são baixados automaticamente do portal de transparência da Prefeitura de Sorocaba conforme são publicados.",
    fonte:  "fazenda.sorocaba.sp.gov.br/transparencia",
  },
  {
    num:    "02",
    titulo: "Leitura dos PDFs",
    texto:  "Um programa lê os PDFs e localiza as tabelas de despesas dentro de cada documento. Cada linha extraída registra de qual arquivo ela veio.",
    fonte:  null,
  },
  {
    num:    "03",
    titulo: "Conversão para tabela",
    texto:  "Os dados são organizados em planilhas CSV com colunas padronizadas: função, dotação, empenhado, liquidado, pago, período e arquivo de origem.",
    fonte:  null,
  },
  {
    num:    "04",
    titulo: "Verificação",
    texto:  "Um verificador automático confere se os totais estão consistentes, se todos os períodos estão presentes e se nenhum valor essencial está ausente.",
    fonte:  null,
  },
  {
    num:    "05",
    titulo: "Publicação no site",
    texto:  "As planilhas verificadas são lidas diretamente pelo site. Não há banco de dados intermediário — a planilha CSV é a fonte de verdade, auditável por qualquer pessoa.",
    fonte:  null,
  },
]

const DEFINICOES = [
  {
    termo:   "Dotação atualizada",
    def:     "Orçamento autorizado para o período, já incluindo todas as suplementações e reduções aprovadas ao longo do ano. É o teto legal de gasto.",
  },
  {
    termo:   "Empenhada",
    def:     "Valor comprometido por contrato ou nota de empenho. Significa que a prefeitura se obrigou juridicamente a pagar, mas o serviço ainda pode não ter sido entregue.",
  },
  {
    termo:   "Liquidada",
    def:     "Serviço entregue e verificado pela prefeitura. É o estágio que melhor representa o gasto real: o fornecedor entregou, a administração conferiu.",
  },
  {
    termo:   "Paga",
    def:     "Valor efetivamente transferido ao fornecedor. Pode ser menor que o liquidado no período por conta de prazos de pagamento.",
  },
  {
    termo:   "ASPS",
    def:     "Ações e Serviços Públicos de Saúde — despesas custeadas pelo próprio município que contam para o mínimo constitucional de 15% (LC 141/2012). Incluem atenção básica, hospitalar, vigilância e suporte terapêutico.",
  },
  {
    termo:   "Recursos SUS",
    def:     "Despesas financiadas por transferências federais e estaduais do SUS (PAB, MAC, FAEC e outros blocos). Executadas pela mesma secretaria, mas não contam para o mínimo de 15%.",
  },
  {
    termo:   "RREO Anexo 12",
    def:     "Relatório Resumido da Execução Orçamentária, publicado bimestralmente. O Anexo 12 (LC 141/2012) mostra o gasto total em saúde separado em ASPS e SUS, e demonstra o cumprimento do mínimo constitucional.",
  },
  {
    termo:   "Execução orçamentária",
    def:     "Relação entre o valor liquidado e a dotação atualizada. Indica quanto do orçamento previsto foi efetivamente executado no período.",
  },
]

const ERRATA = [
  {
    data:   "08/05/2026",
    area:   "Transporte 2020–2021",
    resumo: "Valores de empenhado e dotação corrigidos para 2020 e 2021.",
    detalhe:
      "O extrator capturava apenas a subfunção residual \"FU26 - Demais Subfunções\" e ignorava " +
      "a subfunção \"Transportes Coletivos Urbanos\" (782), que em 2020–2021 concentrava a maior " +
      "parte do gasto. A partir de 2022 Sorocaba consolidou tudo em subfunção única e os anos " +
      "seguintes estavam corretos. Valores corrigidos: 2020 de R$ 98M → R$ 245M; 2021 de R$ 2,4M → R$ 307M.",
    commit: "18e070e",
    commitUrl: "https://github.com/sallumc2018/anatomia-do-gasto/commit/18e070e",
  },
]

const LIMITACOES = [
  "Cobertura atual: apenas Sorocaba/SP. A expansão para outros municípios está em planejamento.",
  "Sorocaba não possui subprefeituras nem administrações regionais autônomas — a gestão territorial é centralizada na Prefeitura. Dados territorializados por bairro, região ou zeladoria não estão disponíveis nestas fontes.",
  "Cobertura educação: 2020–2025. Anos 2020–2023 obtidos via URL legada do portal; 2023 T3 não possui dotação atualizada (limitação do formato do PDF original).",
  "O pipeline extrai dados dos PDFs oficiais. Erros de digitação nos PDFs originais são refletidos nos CSVs.",
  "Os valores são acumulados por quadrimestre (Jan–Abr, Jan–Ago, Jan–Dez), não incrementais. O 3º quad representa o total anual.",
  "Outras subfunções de saúde (saúde do trabalhador, saúde mental) são agrupadas como 'Outras subfunções' no RREO, sem detalhamento.",
  "Saúde indireta (benefícios e previdência de servidores da saúde) não é incluída nas despesas ASPS.",
]

export default function MetodologiaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Como os dados chegam até você — Metodologia",
            "description": "Metodologia de coleta, extração e validação de dados públicos de Sorocaba: pipeline automatizado, fontes oficiais, limitações declaradas e errata.",
            "url": "https://www.anatomiadogasto.ong.br/metodologia",
            "author": { "@type": "Organization", "name": "Anatomia do Gasto" },
            "publisher": {
              "@type": "Organization",
              "name": "Anatomia do Gasto",
              "url": "https://www.anatomiadogasto.ong.br",
            },
          }),
        }}
      />
      <AvisoMaturidade />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Metodologia</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Como os dados chegam até você
              </h1>
              <p style={{ ...S.body, maxWidth: "600px" }}>
                Do PDF publicado pela prefeitura até o número na tela: cada etapa é automatizada, verificada e auditável.
                Nos datasets orçamentários publicados, os valores não são editados manualmente.
              </p>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Pipeline de dados</p>
            <div className="flex flex-col gap-0" style={S.borderTop}>
              {PIPELINE.map((e) => (
                <div key={e.num} className="py-8 flex gap-8 items-start" style={S.borderBottom}>
                  <span className="font-mono font-medium flex-shrink-0" style={{ fontSize: "13px", color: "var(--text-04)", width: "28px" }}>
                    {e.num}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ ...S.h2, marginBottom: "8px" }}>{e.titulo}</h2>
                    <p style={{ ...S.body, marginBottom: e.fonte ? "10px" : 0 }}>{e.texto}</p>
                    {e.fonte && <p style={S.mono}>{e.fonte}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Definições */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Definições dos termos</p>
            <div className="flex flex-col gap-0" style={S.borderTop}>
              {DEFINICOES.map((d) => (
                <div key={d.termo} className="py-6 grid grid-cols-1 md:grid-cols-4 gap-4" style={S.borderBottom}>
                  <p className="font-semibold" style={{ fontSize: "14px", color: "var(--text-01)", gridColumn: "span 1" }}>
                    {d.termo}
                  </p>
                  <p style={{ ...S.body, gridColumn: "span 3" }}>{d.def}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fontes */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Fontes oficiais</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {([
                {
                  titulo: "Relatórios de Aplicação da LRF",
                  texto:  "Publicados quadrimestralmente pela Prefeitura de Sorocaba. Contêm as despesas por função de saúde (ASPS) e a demonstração do cumprimento do mínimo constitucional.",
                  url:    "fazenda.sorocaba.sp.gov.br/transparencia",
                  href:   "https://fazenda.sorocaba.sp.gov.br/transparencia",
                },
                {
                  titulo: "RREO — Relatório Resumido da Execução Orçamentária",
                  texto:  "Publicado bimestralmente. O Anexo 12 discrimina os gastos em saúde entre ASPS e recursos SUS, com previsão e arrecadação das transferências.",
                  url:    "siconfi.tesouro.gov.br",
                  href:   "https://siconfi.tesouro.gov.br",
                },
                {
                  titulo: "SIOPS — Sistema de Informações sobre Orçamentos Públicos em Saúde",
                  texto:  "Sistema federal do Ministério da Saúde que consolida os dados declarados pelos municípios. Usado como referência de validação cruzada.",
                  url:    "gov.br/saude/siops",
                  href:   "https://www.gov.br/saude/pt-br/acesso-a-informacao/siops/siops",
                },
              ] as const).map((f, i) => (
                <div key={f.titulo} className="py-8" style={{
                  paddingRight: i < 2 ? "48px" : 0,
                  paddingLeft:  i > 0 ? "48px" : 0,
                  borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <h2 style={{ ...S.h2, fontSize: "16px" }}>{f.titulo}</h2>
                  <p style={{ ...S.body, marginBottom: "12px" }}>{f.texto}</p>
                  <TrackedExternalLink href={f.href} area="metodologia" label={f.url} style={{ ...S.mono, textDecoration: "underline" }}>{f.url}</TrackedExternalLink>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Errata */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Errata</p>
            <p className="mb-10" style={{ ...S.caption, maxWidth: "640px" }}>
              Correções materiais nos dados publicados. Cada entrada inclui data, impacto e link para o commit com a correção.
            </p>
            <div className="flex flex-col gap-0" style={S.borderTop}>
              {ERRATA.map((e) => (
                <div key={e.commit} className="py-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-start" style={S.borderBottom}>
                  <div>
                    <p style={{ ...S.mono, marginBottom: "4px" }}>{e.data}</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-01)" }}>{e.area}</p>
                  </div>
                  <div style={{ gridColumn: "span 3" }}>
                    <p style={{ ...S.body, marginBottom: "8px" }}>{e.resumo}</p>
                    <p style={{ fontSize: "13px", lineHeight: "21px", color: "var(--text-03)", marginBottom: "12px" }}>{e.detalhe}</p>
                    <TrackedExternalLink
                      href={e.commitUrl}
                      area="metodologia"
                      label={`commit ${e.commit}`}
                      style={{ ...S.mono, textDecoration: "underline" }}
                    >
                      commit {e.commit}
                    </TrackedExternalLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Limitações */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Limitações declaradas</p>
            <div className="flex flex-col gap-4" style={{ maxWidth: "720px" }}>
              {LIMITACOES.map((l, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="font-mono flex-shrink-0" style={{ fontSize: "12px", color: "var(--text-04)", marginTop: "3px" }}>—</span>
                  <p style={S.body}>{l}</p>
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
