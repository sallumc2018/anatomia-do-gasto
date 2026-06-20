import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { getAvailableYears } from "@/lib/data"
import { faqPageSchema, municipioDataCatalogSchema, SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Dados públicos de Sorocaba — Prefeitura de Sorocaba/SP",
  description: "Base navegável de dados públicos de Sorocaba: despesas em saúde, educação, segurança e transporte, receitas, fornecedores, execução orçamentária e série histórica. Fonte: Portal de Transparência Municipal.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba" },
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
    fontSize: "20px",
    lineHeight: "28px",
    color: "var(--text-01)",
    fontWeight: 300,
    marginBottom: "8px",
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const AREAS = [
  {
    titulo: "Saúde",
    descricao: "Execução orçamentária em saúde: dotação, empenhada, liquidada e paga por função. ASPS (Ações e Serviços Públicos de Saúde) e SUS. Fonte: Relatórios LRF (Lei de Responsabilidade Fiscal) e RREO Anexo 12.",
    href: "/sorocaba/saude",
    hrefHistorico: "/sorocaba/saude/comparativo",
    cor: "var(--blue-60)",
  },
  {
    titulo: "Educação",
    descricao: "Execução orçamentária em educação: dotação, empenhada, liquidada e paga por trimestre e subfunção. Fonte: Relatórios LRF.",
    href: "/sorocaba/educacao",
    hrefHistorico: "/sorocaba/educacao/comparativo",
    cor: "var(--teal-60)",
  },
  {
    titulo: "Segurança pública",
    descricao: "Execução orçamentária em segurança pública por ano e quadrimestre. Fonte: Relatórios LRF.",
    href: "/sorocaba/seguranca",
    hrefHistorico: "/sorocaba/seguranca/comparativo",
    cor: "var(--purple-60)",
  },
  {
    titulo: "Transporte",
    descricao: "Execução orçamentária em transporte por ano. Fonte: DCA e relatórios publicados pela Prefeitura.",
    href: "/sorocaba/transporte",
    hrefHistorico: "/sorocaba/transporte/comparativo",
    cor: "var(--cyan-60)",
  },
]

const MAIS_AREAS = [
  {
    titulo: "Receitas",
    descricao: "Composição das receitas municipais: impostos, transferências da União e do Estado, taxas e outras fontes.",
    href: "/sorocaba/receita",
  },
  {
    titulo: "Visão geral (Executivo)",
    descricao: "Orçamento total por função: distribuição das despesas entre todas as áreas de atuação do governo municipal.",
    href: "/sorocaba/executivo",
  },
  {
    titulo: "Execução orçamentária",
    descricao: "Despesa orçamentária detalhada: empenhada, liquidada e paga por órgão e função para os anos disponíveis.",
    href: "/sorocaba/execucao",
  },
  {
    titulo: "Saúde fiscal",
    descricao: "Indicadores de responsabilidade fiscal: dívida, resultado primário e cumprimento de limites da LRF.",
    href: "/sorocaba/saude-fiscal",
  },
  {
    titulo: "Câmara Municipal",
    descricao: "Dados orçamentários e de execução da Câmara Municipal de Sorocaba.",
    href: "/sorocaba/camara-municipal",
  },
  {
    titulo: "Vereadores e emendas",
    descricao: "Emendas impositivas por vereador: quanto cada um indicou e quanto foi efetivamente pago.",
    href: "/sorocaba/emendas",
  },
  {
    titulo: "Fornecedores",
    descricao: "Ranking de destinatários de recursos públicos: empresas, entidades e folha de pagamento.",
    href: "/sorocaba/fornecedores",
  },
  {
    titulo: "Pacto federativo",
    descricao: "Transferências federais e estaduais recebidas por Sorocaba.",
    href: "/sorocaba/pacto-federativo",
  },
  {
    titulo: "Auditoria de cobertura",
    descricao: "Inventário de dados disponíveis, lacunas identificadas e status de extração.",
    href: "/sorocaba/auditoria",
  },
]

const SOR_CATALOG = municipioDataCatalogSchema({
  municipioId: "sorocaba",
  name: "Dados fiscais públicos de Sorocaba/SP — Anatomia do Gasto",
  description: "Catálogo de dados fiscais públicos de Sorocaba: saúde, educação, segurança pública, transporte, receitas, fornecedores, execução orçamentária, câmara municipal e transferências. Série 2020–2025. Fonte: Portal de Transparência de Sorocaba, SICONFI, SIOPS.",
  spatialCoverage: "Sorocaba, SP, Brasil (IBGE 3552205)",
  datasets: [
    { name: "Saúde pública — Sorocaba",                    url: "/sorocaba/saude" },
    { name: "Educação — Sorocaba",                         url: "/sorocaba/educacao" },
    { name: "Segurança pública — Sorocaba",                url: "/sorocaba/seguranca" },
    { name: "Transporte — Sorocaba",                       url: "/sorocaba/transporte" },
    { name: "Orçamento total por função — Sorocaba",       url: "/sorocaba/executivo" },
    { name: "Receitas municipais — Sorocaba",              url: "/sorocaba/receita" },
    { name: "Fornecedores — Sorocaba",                     url: "/sorocaba/fornecedores" },
    { name: "Empenhos e execução — Sorocaba",              url: "/sorocaba/execucao" },
    { name: "Câmara Municipal — Sorocaba",                 url: "/sorocaba/camara" },
    { name: "Transferências intergovernamentais",          url: "/sorocaba/transferencias" },
  ],
})

const SOR_FAQ = faqPageSchema([
  {
    question: "Quanto Sorocaba gastou com saúde em 2024?",
    answer: `Em 2024, a Prefeitura de Sorocaba liquidou R$ 2,10 bilhões em saúde pública — incluindo ASPS (ações e serviços de saúde municipais) e repasses SUS. O valor representa cerca de 42% das despesas totais do município e reflete o papel de Sorocaba como polo regional de saúde para o interior paulista, com hospital municipal de referência e rede de UBS. Série histórica 2020–2025 em ${SITE_URL}/sorocaba/saude. Fonte: RREO Anexo 12/SICONFI.`,
  },
  {
    question: "Quanto Sorocaba gastou com educação em 2024?",
    answer: `Em 2024, Sorocaba liquidou R$ 880 milhões em educação — ensino fundamental (R$ 174 mi) e educação infantil (R$ 173 mi) no acumulado do 3º quadrimestre. Os dados incluem verificação do mínimo constitucional de aplicação em MDE. Execução por quadrimestre e subfunção disponível em ${SITE_URL}/sorocaba/educacao. Fonte: Relatórios LRF/SICONFI e FNDE/SIOPE.`,
  },
  {
    question: "Quanto Sorocaba gastou em transporte em 2024?",
    answer: `Em 2024, Sorocaba liquidou R$ 575 milhões em transporte — incluindo ônibus urbano (Urbes), infraestrutura viária e mobilidade. Isso representa 11,5% do orçamento municipal total de R$ 4,99 bilhões. Série 2020–2025 em ${SITE_URL}/sorocaba/transporte. Fonte: RREO Anexo 02 e DCA/SICONFI.`,
  },
  {
    question: "Quanto Sorocaba gastou em segurança pública em 2024?",
    answer: `Em 2024, Sorocaba liquidou R$ 60,4 milhões em segurança pública — 1,23% do orçamento municipal total. Segurança pública municipal financia guarda civil metropolitana e monitoramento; o policiamento ostensivo é responsabilidade do Estado. Dados anuais 2020–2025 em ${SITE_URL}/sorocaba/seguranca. Fonte: RREO Anexo 02/SICONFI.`,
  },
  {
    question: "Quanto entrou de receita em Sorocaba em 2024?",
    answer: `Em 2024, Sorocaba arrecadou R$ 5,17 bilhões (previsão LOA: R$ 5,21 bi). As principais fontes são impostos próprios (ISS, IPTU), ICMS-cota estadual, FPM e transferências federais (SUS, FNDE). Composição detalhada por categoria em ${SITE_URL}/sorocaba/receita. Fonte: RREO Anexo 01/SICONFI.`,
  },
  {
    question: "Qual é o orçamento total da Prefeitura de Sorocaba?",
    answer: `O orçamento (LOA) de Sorocaba para 2024 foi de R$ 5,21 bilhões, com execução total empenhada de R$ 4,99 bilhões. As três maiores funções são saúde (R$ 2,10 bi), transporte (R$ 575 mi) e educação (R$ 880 mi). Série histórica 2020–2025 por função de governo em ${SITE_URL}/sorocaba/executivo. Fonte: RREO Anexo 02/SICONFI.`,
  },
  {
    question: "Quais foram os maiores fornecedores da Prefeitura de Sorocaba?",
    answer: `O ranking de fornecedores da Prefeitura de Sorocaba — empresas, entidades e pessoas físicas que receberam recursos públicos — está disponível em ${SITE_URL}/sorocaba/fornecedores. Dados do Portal de Transparência de Sorocaba com identificação por CNPJ/CPF mascarado.`,
  },
  {
    question: "O que é empenho, liquidação e pagamento?",
    answer: `Empenho é a reserva orçamentária que compromete recursos para uma despesa futura. Liquidação confirma que o bem foi entregue ou o serviço prestado. Pagamento é a transferência efetiva do dinheiro. Um empenho pode existir sem liquidação (entrega pendente) e uma liquidação sem pagamento (débito em aberto). Glossário completo em ${SITE_URL}/glossario.`,
  },
  {
    question: "Como os dados de Sorocaba são coletados e validados?",
    answer: `Dados extraídos de portais oficiais (SICONFI/Tesouro Nacional, Portal de Transparência de Sorocaba, SIOPS, SIOPE/FNDE), transformados por scripts Python de código aberto e validados por testes automatizados antes de qualquer publicação. Metodologia declarada em ${SITE_URL}/metodologia.`,
  },
])

const CONSULTAS = [
  {
    pergunta: "Quanto Sorocaba gastou com saúde?",
    href: "/sorocaba/saude",
  },
  {
    pergunta: "Quanto Sorocaba gastou com educação?",
    href: "/sorocaba/educacao",
  },
  {
    pergunta: "Quais foram os maiores fornecedores da Prefeitura de Sorocaba?",
    href: "/sorocaba/fornecedores",
  },
  {
    pergunta: "Como consultar empenhos da Prefeitura de Sorocaba?",
    href: "/sorocaba/execucao",
  },
  {
    pergunta: "Quanto entrou de receita em Sorocaba?",
    href: "/sorocaba/receita",
  },
  {
    pergunta: "Qual é o orçamento total da Prefeitura de Sorocaba?",
    href: "/sorocaba/executivo",
  },
  {
    pergunta: "O que é empenho, liquidação e pagamento?",
    href: "/glossario",
  },
  {
    pergunta: "Como os dados são coletados e validados?",
    href: "/metodologia",
  },
]

export default function SorocabaPage() {
  const saudeAnos  = getAvailableYears("saude")
  const edAnos     = getAvailableYears("educacao")
  const anoMaisRecente = Math.max(...saudeAnos, ...edAnos, 0) || null

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SOR_CATALOG) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SOR_FAQ) }} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>
              Sorocaba · São Paulo · Brasil
            </p>
            <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "800px" }}>
              Dados públicos da Prefeitura de Sorocaba
            </h1>
            <p style={{ ...S.body, maxWidth: "640px", fontSize: "15px", lineHeight: "24px" }}>
              Base navegável com dados públicos de despesas, receitas, fornecedores e execução orçamentária
              de Sorocaba/SP. Organizada a partir de fontes oficiais, com metodologia declarada e rastreabilidade até a fonte.
            </p>
            {anoMaisRecente && (
              <p className="mt-4" style={S.caption}>
                Dados disponíveis até {anoMaisRecente} · Fonte: Portal de Transparência de Sorocaba, SICONFI e Tesouro Nacional
              </p>
            )}
          </div>
        </section>

        {/* Áreas principais */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Áreas de despesa com dados por ano</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {AREAS.map((area) => (
                <div
                  key={area.titulo}
                  className="py-8"
                  style={{
                    ...S.borderBottom,
                    borderRight: "none",
                    paddingRight: "32px",
                  }}
                >
                  <div style={{ borderLeft: `3px solid ${area.cor}`, paddingLeft: "16px" }}>
                    <h2 style={S.h2}>{area.titulo}</h2>
                    <p style={{ ...S.body, marginBottom: "16px" }}>{area.descricao}</p>
                    <div className="flex gap-4">
                      <Link
                        href={area.href}
                        style={{ fontSize: "13px", color: area.cor, textDecoration: "underline" }}
                      >
                        Ver dados →
                      </Link>
                      <Link
                        href={area.hrefHistorico}
                        style={{ fontSize: "13px", color: "var(--text-03)", textDecoration: "underline" }}
                      >
                        Série histórica
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mais áreas */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Outras consultas disponíveis</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={S.borderTop}>
              {MAIS_AREAS.map((area) => (
                <Link
                  key={area.titulo}
                  href={area.href}
                  style={{
                    display: "block",
                    padding: "20px 24px 20px 0",
                    ...S.borderBottom,
                    textDecoration: "none",
                  }}
                >
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "6px" }}>
                    {area.titulo}
                  </p>
                  <p style={S.body}>{area.descricao}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Perguntas frequentes */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Consultas frequentes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONSULTAS.map((c) => (
                <Link
                  key={c.pergunta}
                  href={c.href}
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    border: "1px solid var(--border-01)",
                    fontSize: "14px",
                    color: "var(--text-02)",
                    textDecoration: "none",
                    lineHeight: "20px",
                  }}
                >
                  {c.pergunta}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Metodologia e fontes */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Transparência e metodologia</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>
                  Metodologia
                </p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  Como os dados são coletados, extraídos de PDFs, validados e publicados. Inclui errata e limitações declaradas.
                </p>
                <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver metodologia completa →
                </Link>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>
                  Fontes de dados
                </p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  Portal de Transparência de Sorocaba, SICONFI, SIOPS, Livro de Conta-Corrente de Fornecedores e LOA.
                </p>
                <Link href="/fontes" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver todas as fontes →
                </Link>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>
                  Glossário
                </p>
                <p style={{ ...S.body, marginBottom: "10px" }}>
                  Significado de empenho, liquidação, pagamento, dotação, fornecedor, contrato e outros termos em linguagem cidadã.
                </p>
                <Link href="/glossario" style={{ fontSize: "13px", color: "var(--text-02)", textDecoration: "underline" }}>
                  Ver glossário →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Aviso de neutralidade */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <p style={{ ...S.caption, maxWidth: "720px" }}>
              A Anatomia do Gasto organiza dados públicos em linguagem cidadã, com fonte, método e rastreabilidade.
              O objetivo não é acusar, defender ou interpretar politicamente: é permitir que qualquer pessoa consulte
              a trilha do dinheiro público. Campo vazio, nulo ou indisponível é declarado como dado ausente —
              nunca tratado como zero.{" "}
              <Link href="/politica-de-neutralidade" style={{ color: "inherit", textDecoration: "underline" }}>
                Política de neutralidade
              </Link>
            </p>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
