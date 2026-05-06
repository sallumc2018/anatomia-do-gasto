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
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const PIPELINE = [
  {
    num: "01",
    titulo: "Download dos PDFs",
    texto:  "Os relatórios quadrimestrais de saúde (LRF) e bimestrais do RREO são baixados automaticamente do portal de transparência da Prefeitura de Sorocaba.",
    fonte:  "fazenda.sorocaba.sp.gov.br/transparencia",
  },
  {
    num: "02",
    titulo: "Extração de texto",
    texto:  "Um script Python com pdfplumber lê os PDFs e localiza as tabelas de despesas. Para PDFs em formato de imagem (sem texto selecionável), há fallback automático para PyMuPDF.",
    fonte:  "pipelines/extrator_saude.py · extrator_rreo_sus.py · extrator_educacao.py",
  },
  {
    num: "03",
    titulo: "Conversão para CSV",
    texto:  "Os dados extraídos são normalizados (acentos removidos, valores numéricos convertidos do formato BR) e salvos em arquivos CSV estruturados por área e ano.",
    fonte:  "data/extracted → data/validated → data/public",
  },
  {
    num: "04",
    titulo: "Verificação de integridade",
    texto:  "Um script de testes confere se os totais batem, se todos os quadrimestres estão presentes e se nenhum valor essencial está zerado.",
    fonte:  "pipelines/testes/verificar_dados.py",
  },
  {
    num: "05",
    titulo: "Exibição no site",
    texto:  "O Next.js lê os CSVs diretamente no servidor e renderiza as páginas. Nenhum banco de dados intermediário — os arquivos CSV são a fonte de verdade.",
    fonte:  "apps/web/lib/data.ts",
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

const LIMITACOES = [
  "Cobertura atual: apenas Sorocaba/SP. A expansão para outros municípios está em planejamento.",
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
                Nenhum dado é editado manualmente.
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
                    <p style={{ ...S.body, marginBottom: "10px" }}>{e.texto}</p>
                    <p style={S.mono}>{e.fonte}</p>
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
                  url:    "siops.datasus.gov.br",
                  href:   "https://siops.datasus.gov.br",
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
                  <a href={f.href} target="_blank" rel="noopener noreferrer" style={{ ...S.mono, textDecoration: "underline" }}>{f.url}</a>
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
