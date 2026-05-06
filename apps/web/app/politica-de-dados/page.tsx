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
    titulo: "Origem dos dados",
    corpo: "Todos os dados exibidos no Anatomia do Gasto são extraídos exclusivamente de documentos oficiais publicados pelo poder público. Nenhum dado é criado, estimado ou editado pela equipe do projeto.",
    itens: [
      "Portal de Transparência da Prefeitura de Sorocaba — relatórios de aplicação da LRF (saúde) e relatórios de execução orçamentária (educação)",
      "SICONFI — Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (Tesouro Nacional) — RREO Anexo 12",
      "SIOPS — Sistema de Informações sobre Orçamentos Públicos em Saúde (Ministério da Saúde) — referência de validação cruzada",
    ],
  },
  {
    titulo: "Como os dados são extraídos",
    corpo: "O processo de extração é automatizado e auditável. Nenhuma etapa envolve edição manual dos valores.",
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
      "Para reportar um erro: sallumc@gmail.com — informe a página, o valor incorreto e a fonte que indica o valor correto",
      "Verificamos a ocorrência em até 7 dias úteis",
      "Erros confirmados são corrigidos e o commit de correção fica registrado publicamente no histórico do GitHub",
      "Se o erro estiver no PDF original: registramos a divergência na página correspondente, mas mantemos o valor do documento oficial até que ele seja corrigido na fonte",
    ],
  },
  {
    titulo: "O que não coletamos sobre você",
    corpo: "O site não coleta nenhum dado pessoal dos visitantes.",
    itens: [
      "Nenhum formulário de cadastro ou login",
      "Nenhum cookie de rastreamento ou publicidade",
      "Nenhum sistema de analytics de terceiros (Google Analytics, Meta Pixel ou similar)",
      "Os únicos cookies presentes são os estritamente necessários para o funcionamento do Next.js em produção",
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
                Esta página explica o processo, a cadência de atualização e como reportar erros.
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
