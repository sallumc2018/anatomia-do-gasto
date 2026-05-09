import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Política de Dados",
  description: "Como o Anatomia do Gasto coleta, trata e publica dados de gastos públicos de Sorocaba, incluindo fontes, limitações e contato para correções.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/politica-de-dados" },
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
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const SECOES = [
  {
    titulo: "Origem dos dados",
    corpo: "Os dados orçamentários de saúde e educação exibidos no Anatomia do Gasto são extraídos de documentos oficiais publicados pelo poder público. Conteúdos ilustrativos ou de curadoria editorial devem ser sinalizados explicitamente.",
    itens: [
      "Portal de Transparência da Prefeitura de Sorocaba — relatórios de aplicação da LRF (saúde) e relatórios de execução orçamentária (educação)",
      "SICONFI — Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (Tesouro Nacional) — RREO Anexo 12",
      "SIOPS — Sistema de Informações sobre Orçamentos Públicos em Saúde (Ministério da Saúde) — referência de validação cruzada",
    ],
  },
  {
    titulo: "Como os dados são extraídos",
    corpo: "O processo de extração dos datasets orçamentários é automatizado e auditável. A equipe não altera manualmente os valores publicados nessas bases.",
    itens: [
      "Download automático dos PDFs a partir das URLs oficiais",
      "Leitura do texto dos PDFs com pdfplumber; fallback para PyMuPDF em PDFs baseados em imagem",
      "Normalização: remoção de acentos, conversão do formato numérico brasileiro (1.234,56 → 1234.56)",
      "Verificação de integridade: script que confere se os totais batem e se todos os períodos estão presentes",
      "O código-fonte completo está disponível em github.com/sallumc2018/anatomia-do-gasto",
    ],
  },
  {
    titulo: "Atualização dos dados",
    corpo: "Os dados são atualizados manualmente quando novos relatórios são publicados pelos órgãos oficiais. Não há atualização em tempo real.",
    itens: [
      "Saúde: três vezes por ano, ao término de cada quadrimestre (abril, agosto e dezembro)",
      "Educação: quatro vezes por ano, ao término de cada trimestre",
      "A data de referência de cada conjunto de dados é indicada na própria página",
    ],
  },
  {
    titulo: "Erros e correções",
    corpo: "Erros podem ocorrer por falhas no processo de extração ou por inconsistências nos próprios PDFs oficiais. Em ambos os casos, o procedimento é o mesmo.",
    itens: [
      "Para reportar um erro: contato@anatomiadogasto.ong.br — informe a página, o valor incorreto e a fonte que indica o valor correto",
      "Buscamos verificar a ocorrência com prioridade e registrar a resposta publicamente no histórico do projeto",
      "Erros confirmados são corrigidos e o commit de correção fica registrado publicamente no histórico do GitHub",
      "Se o erro estiver no PDF original: registramos a divergência na página correspondente, mas mantemos o valor do documento oficial até que ele seja corrigido na fonte",
    ],
  },
  {
    titulo: "Como medimos uso do produto",
    corpo: "O site não exige cadastro e não usa cookies de publicidade, mas registra eventos agregados de navegação para entender se as trilhas principais estão funcionando.",
    itens: [
      "Nenhum formulário de cadastro ou login",
      "Nenhum cookie de publicidade ou retargeting",
      "Uso de Vercel Web Analytics para medir eventos agregados, como navegação entre páginas e cliques em trilhas principais do site",
      "Não usamos Google Analytics, Meta Pixel ou plataformas de publicidade comportamental",
      "A medição existe para avaliar se o produto ajuda o usuário a encontrar dados, chegar à fonte oficial e voltar ao site",
    ],
  },
]

export default function PoliticaDeDadosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Política de Dados</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                De onde vêm os dados e o que fazemos com eles
              </h1>
              <p style={{ ...S.body, maxWidth: "600px" }}>
                O Anatomia do Gasto apresenta dados públicos, extraídos de fontes oficiais, sem edição editorial.
                Esta página explica o processo, a cadência de atualização, como reportar erros e como medimos uso do produto.
              </p>
            </div>
          </div>
        </section>

        {SECOES.map((s, i) => (
          <section
            key={s.titulo}
            style={{ backgroundColor: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-elevated)", ...S.borderBottom }}
          >
            <div className="mx-auto px-6 py-16" style={S.container}>
              <h2 style={S.h2}>{s.titulo}</h2>
              <p style={{ ...S.body, marginBottom: "20px" }}>{s.corpo}</p>
              <ul className="flex flex-col gap-3" style={{ ...S.borderTop, paddingTop: "20px" }}>
                {s.itens.map((item, j) => (
                  <li key={j} className="flex gap-4 items-start">
                    <span style={{ ...S.mono, flexShrink: 0, marginTop: "3px" }}>—</span>
                    <p style={S.body}>{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

      </main>
      <PageFooter />
    </div>
  )
}
