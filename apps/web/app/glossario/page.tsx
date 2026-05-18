import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Glossário do gasto público",
  description: "Significado de empenho, liquidação, pagamento, dotação orçamentária, fornecedor, contrato e outros termos da contabilidade pública municipal, em linguagem cidadã.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/glossario" },
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
  body: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const TERMOS = [
  {
    categoria: "Ciclo da despesa",
    itens: [
      {
        termo: "Dotação orçamentária",
        definicao: "Valor autorizado pela Câmara Municipal na Lei Orçamentária Anual (LOA) para que a prefeitura gaste em determinada área. É o teto legal: a prefeitura não pode gastar mais do que a dotação aprovada, salvo por meio de créditos adicionais.",
      },
      {
        termo: "Dotação atualizada",
        definicao: "Dotação original mais todas as alterações aprovadas ao longo do ano: suplementações (aumentos) e reduções. Representa o orçamento vigente no momento da consulta.",
      },
      {
        termo: "Empenho",
        definicao: "Ato pelo qual a prefeitura reserva parte da dotação para pagar uma obrigação assumida — um contrato assinado, uma compra autorizada, um serviço contratado. Significa que o dinheiro foi comprometido juridicamente, mas o serviço ainda pode não ter sido entregue.",
      },
      {
        termo: "Valor empenhado",
        definicao: "Total reservado em notas de empenho até a data de referência. Representa obrigações assumidas, não necessariamente serviços já entregues.",
      },
      {
        termo: "Liquidação",
        definicao: "Verificação de que o serviço contratado foi efetivamente entregue e está de acordo com o contrato. É o estágio que melhor representa o gasto real: a administração conferiu a entrega e reconheceu a obrigação de pagar.",
      },
      {
        termo: "Valor liquidado",
        definicao: "Total de despesas cujo fornecimento foi conferido e aceito pela prefeitura. É o indicador mais próximo do gasto efetivo no período.",
      },
      {
        termo: "Pagamento",
        definicao: "Transferência efetiva do recurso financeiro ao fornecedor ou credor. Ocorre após a liquidação. Pode acontecer em período diferente da liquidação, por conta de prazos contratuais ou fluxo de caixa.",
      },
      {
        termo: "Valor pago",
        definicao: "Total efetivamente transferido ao fornecedor ou credor até a data de referência. Pode ser menor que o liquidado no mesmo período, pois alguns pagamentos podem ocorrer em período subsequente.",
      },
      {
        termo: "Restos a pagar",
        definicao: "Despesas empenhadas em um exercício financeiro que não foram pagas até 31 de dezembro. Ficam inscritas em restos a pagar e podem ser liquidadas e pagas no exercício seguinte.",
      },
    ],
  },
  {
    categoria: "Receitas",
    itens: [
      {
        termo: "Receita",
        definicao: "Todo recurso financeiro que entra no caixa do município: impostos (IPTU, ISS, ITBI), transferências da União (FPM, SUS, FNDE) e do Estado (ICMS, IPVA), taxas, multas e outras fontes.",
      },
      {
        termo: "Receita prevista",
        definicao: "Estimativa de arrecadação aprovada na LOA. Serve de base para a fixação das despesas no orçamento.",
      },
      {
        termo: "Receita arrecadada",
        definicao: "Total efetivamente recebido pelo município até a data de referência.",
      },
      {
        termo: "Fonte de recurso",
        definicao: "Identificação da origem do dinheiro: municipal (arrecadação própria), federal (transferências da União) ou estadual (transferências do Estado). Cada fonte tem regras sobre como pode ser gasta.",
      },
    ],
  },
  {
    categoria: "Estrutura orçamentária",
    itens: [
      {
        termo: "Órgão",
        definicao: "Unidade administrativa responsável por executar o orçamento: uma secretaria, uma autarquia ou um fundo especial. Cada órgão tem seu próprio orçamento aprovado na LOA.",
      },
      {
        termo: "Secretaria",
        definicao: "Órgão de governo municipal responsável por uma área de política pública: saúde, educação, segurança, transporte, etc. Executa as despesas dentro do orçamento aprovado para sua área.",
      },
      {
        termo: "Programa",
        definicao: "Conjunto de ações orçamentárias agrupadas por objetivo de política pública. Exemplo: Programa de Atenção Básica à Saúde, Programa de Manutenção do Ensino Fundamental.",
      },
      {
        termo: "Função",
        definicao: "Classificação do gasto por área de atuação do governo. As funções são padronizadas para todos os entes da federação: saúde (função 10), educação (função 12), segurança pública (função 06), transporte (função 26), etc.",
      },
      {
        termo: "Subfunção",
        definicao: "Subdivisão da função. Exemplo: dentro de saúde (função 10), existem subfunções como atenção básica (301), assistência hospitalar e ambulatorial (302), vigilância sanitária (304).",
      },
      {
        termo: "Elemento de despesa",
        definicao: "Classificação do tipo de gasto: pessoal (folha de pagamento), material de consumo, serviços de terceiros, obras e instalações, equipamentos. Permite entender em que tipo de item o dinheiro foi gasto.",
      },
      {
        termo: "Categoria econômica",
        definicao: "Divisão entre despesas correntes (custeio do governo: folha, serviços, materiais) e despesas de capital (investimentos: obras, equipamentos, amortização de dívidas).",
      },
    ],
  },
  {
    categoria: "Fornecedores e contratos",
    itens: [
      {
        termo: "Fornecedor",
        definicao: "Empresa, pessoa física, entidade sem fins lucrativos ou outro governo que recebeu pagamento da prefeitura em troca de bens, serviços ou obras. Os dados de fornecedores derivam do Livro de Conta-Corrente de Fornecedores (Tesouro Nacional).",
      },
      {
        termo: "Contrato",
        definicao: "Acordo formal entre a prefeitura e um fornecedor, com objeto, valor, prazo e condições de entrega definidos. Todo contrato acima de determinado valor deve ser licitado e publicado no Diário Oficial.",
      },
      {
        termo: "Licitação",
        definicao: "Processo administrativo pelo qual a prefeitura seleciona o fornecedor de um bem, serviço ou obra. As modalidades incluem pregão, concorrência, tomada de preços e convite. A licitação é obrigatória acima de determinados limites de valor (Lei 14.133/2021).",
      },
      {
        termo: "Dispensa de licitação",
        definicao: "Situação prevista em lei em que a prefeitura pode contratar sem licitação: emergências, valores abaixo dos limites legais, fornecedor exclusivo. A dispensa não é irregular, mas precisa ser justificada e publicada.",
      },
    ],
  },
  {
    categoria: "Indicadores e limites",
    itens: [
      {
        termo: "Execução orçamentária",
        definicao: "Relação percentual entre o valor liquidado (ou pago) e a dotação atualizada. Indica quanto do orçamento aprovado foi efetivamente executado no período.",
      },
      {
        termo: "ASPS",
        definicao: "Ações e Serviços Públicos de Saúde. Despesas custeadas com recursos próprios do município que contam para o mínimo constitucional de 15% aplicado em saúde (Lei Complementar 141/2012). Incluem atenção básica, assistência hospitalar, vigilância sanitária e epidemiológica.",
      },
      {
        termo: "MDE",
        definicao: "Manutenção e Desenvolvimento do Ensino. Despesas que contam para o mínimo constitucional de 25% aplicado em educação (art. 212 da Constituição Federal).",
      },
      {
        termo: "FUNDEB",
        definicao: "Fundo de Manutenção e Desenvolvimento da Educação Básica. Fundo contábil que redistribui recursos entre os municípios e o estado com base no número de alunos matriculados. Parte das receitas municipais vai para o FUNDEB e parte retorna como repasse proporcional às matrículas.",
      },
    ],
  },
  {
    categoria: "Conceitos de transparência",
    itens: [
      {
        termo: "Portal da Transparência",
        definicao: "Sítio eletrônico onde o poder público é obrigado por lei a publicar dados sobre receitas, despesas, contratos, servidores e outros atos administrativos. A Lei de Acesso à Informação (Lei 12.527/2011) e a Lei de Responsabilidade Fiscal estabelecem os dados mínimos a publicar.",
      },
      {
        termo: "SICONFI",
        definicao: "Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro, do Tesouro Nacional. Consolida os dados declarados por todos os municípios, estados e União, incluindo o RREO (Relatório Resumido da Execução Orçamentária).",
      },
      {
        termo: "RREO",
        definicao: "Relatório Resumido da Execução Orçamentária. Publicado bimestralmente por todos os municípios. Contém receitas, despesas e demonstrações de cumprimento de limites constitucionais. O Anexo 12 detalha os gastos em saúde separando ASPS e recursos SUS.",
      },
      {
        termo: "DCA",
        definicao: "Demonstrativo das Contas Anuais, publicado pelo SICONFI. Contém a execução orçamentária completa do município por órgão, função e subfunção para o exercício encerrado.",
      },
      {
        termo: "LOA",
        definicao: "Lei Orçamentária Anual. Aprovada pela Câmara Municipal, define quanto o governo pode gastar em cada área durante o ano. Não é uma autorização de gasto automática — cada despesa ainda precisa passar pelos estágios de empenho, liquidação e pagamento.",
      },
    ],
  },
]

export default function GlossarioPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Glossário</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Termos do gasto público em linguagem cidadã
              </h1>
              <p style={{ ...S.body, maxWidth: "600px" }}>
                Definições neutras e didáticas dos termos usados na contabilidade pública municipal.
                Sem julgamento político — apenas o significado técnico de cada conceito.
              </p>
            </div>
          </div>
        </section>

        {/* Índice rápido */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-8" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Categorias</p>
            <div className="flex flex-wrap gap-3">
              {TERMOS.map((cat) => (
                <a
                  key={cat.categoria}
                  href={`#${cat.categoria.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{
                    fontSize: "13px",
                    color: "var(--text-02)",
                    border: "1px solid var(--border-01)",
                    padding: "4px 12px",
                    textDecoration: "none",
                  }}
                >
                  {cat.categoria}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Termos por categoria */}
        {TERMOS.map((cat, ci) => (
          <section
            key={cat.categoria}
            id={cat.categoria.toLowerCase().replace(/\s+/g, "-")}
            style={{ backgroundColor: ci % 2 === 0 ? "var(--bg-base)" : "var(--bg-elevated)", ...S.borderBottom }}
          >
            <div className="mx-auto px-6 py-16" style={S.container}>
              <p className="uppercase font-semibold mb-10" style={S.label}>{cat.categoria}</p>
              <div className="flex flex-col gap-0" style={S.borderTop}>
                {cat.itens.map((item) => (
                  <div
                    key={item.termo}
                    id={item.termo.toLowerCase().replace(/\s+/g, "-")}
                    className="py-6 grid grid-cols-1 md:grid-cols-4 gap-4"
                    style={S.borderBottom}
                  >
                    <p className="font-semibold" style={{ fontSize: "14px", color: "var(--text-01)" }}>
                      {item.termo}
                    </p>
                    <p style={{ ...S.body, gridColumn: "span 3" }}>{item.definicao}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Nota metodológica */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p style={{ ...S.caption, maxWidth: "720px" }}>
              Este glossário apresenta definições técnicas neutras, sem julgamento, acusação, defesa ou interpretação política.
              Os termos refletem a legislação e os manuais do Tesouro Nacional (MCASP) e do SICONFI.{" "}
              <Link href="/metodologia" style={{ color: "inherit", textDecoration: "underline" }}>
                Ver metodologia completa
              </Link>
              {" "}·{" "}
              <Link href="/sorocaba" style={{ color: "inherit", textDecoration: "underline" }}>
                Consultar dados de Sorocaba
              </Link>
            </p>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
