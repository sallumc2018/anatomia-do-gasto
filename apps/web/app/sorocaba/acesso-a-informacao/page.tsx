import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  PEDIDOS_LAI,
  DIARIO_LAI,
  TOTAL_PEDIDOS,
  PROTOCOLADOS,
  type StatusPedido,
  type PrioridadePedido,
} from "@/lib/lai-pedidos"

export const metadata: Metadata = {
  title: "Acesso à Informação — Sorocaba",
  description:
    "Dados públicos de Sorocaba que precisam de pedido formal para serem entregues. Diário público dos 35 pedidos protocolados pelo Anatomia do Gasto via Lei de Acesso à Informação.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/acesso-a-informacao" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const PRIORIDADE_COLOR: Record<PrioridadePedido, string> = {
  "crítica": "var(--support-error)",
  "alta":    "var(--support-warning)",
  "média":   "var(--blue-40)",
  "baixa":   "var(--text-04)",
}

const STATUS_LABEL: Record<StatusPedido, string> = {
  protocolado: "Protocolado",
  pendente:    "Aguardando protocolo",
  respondido:  "Respondido",
  recurso:     "Em recurso",
  publicado:   "Publicado",
}

const STATUS_COLOR: Record<StatusPedido, string> = {
  protocolado: "var(--support-warning)",
  pendente:    "var(--text-04)",
  respondido:  "var(--blue-40)",
  recurso:     "var(--support-warning)",
  publicado:   "var(--support-success)",
}

const TIPO_DIARIO_LABEL = {
  protocolo:    "Protocolo",
  confirmacao:  "Confirmação",
  resposta:     "Resposta",
  recurso:      "Recurso",
  publicacao:   "Publicação",
}

const TIPO_DIARIO_COLOR = {
  protocolo:    "var(--support-warning)",
  confirmacao:  "var(--blue-40)",
  resposta:     "var(--support-success)",
  recurso:      "var(--support-error)",
  publicacao:   "var(--support-success)",
}

const PASSOS = [
  {
    n: "1",
    titulo: "Acesse o Fala.BR",
    detalhe: "falabr.cgu.gov.br/v2 — a plataforma federal de acesso à informação. Funciona para órgãos federais e para municípios que aderiram ao sistema.",
  },
  {
    n: "2",
    titulo: 'Clique em "Acesso à Informação – LAI"',
    detalhe: 'Na tela inicial, localize a seção dedicada à Lei de Acesso à Informação e selecione "Pedido de Acesso à Informação".',
  },
  {
    n: "3",
    titulo: "Faça login com sua conta gov.br",
    detalhe: "Qualquer nível de autenticação serve. Se não tiver conta, o próprio portal guia o cadastro.",
  },
  {
    n: "4",
    titulo: "Selecione o órgão",
    detalhe: "Esfera Municipal → Estado SP → Prefeitura Municipal de Sorocaba (ou o órgão desejado: Câmara, SAAE, Urbes, FUNSERV).",
  },
  {
    n: "5",
    titulo: "Descreva o dado que você quer",
    detalhe: "Seja objetivo: período, tipo de dado, formato. Não é necessário justificar o pedido — isso é garantido pela Lei nº 12.527/2011.",
  },
]

export default function AcessoInformacaoPage() {
  const criticos = PEDIDOS_LAI.filter((p) => p.prioridade === "crítica")
  const altos    = PEDIDOS_LAI.filter((p) => p.prioridade === "alta")
  const medios   = PEDIDOS_LAI.filter((p) => p.prioridade === "média")
  const baixos   = PEDIDOS_LAI.filter((p) => p.prioridade === "baixa")

  const pedido1 = PEDIDOS_LAI.find((p) => p.id === 1)!

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--support-warning)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Lei de Acesso à Informação · Sorocaba/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  {PROTOCOLADOS} de {TOTAL_PEDIDOS} pedidos protocolados
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Dados públicos, acesso burocrático
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Em Sorocaba, parte dos dados financeiros públicos não está disponível online.
                Para obtê-los, o cidadão precisa protocolar um pedido formal e aguardar até 20 dias
                por resposta legal. É o que estamos fazendo.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)" }}>
                Esta página é um diário público. Cada pedido protocolado, cada resposta recebida
                e cada dado publicado será registrado aqui — abertamente, com datas e números de protocolo.
              </p>
            </div>
          </div>
        </section>

        {/* Pedido em destaque */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Primeiro pedido protocolado</p>
            <div style={{ border: "1px solid var(--support-warning)", padding: "24px 28px", maxWidth: "720px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "3px 8px",
                  color: STATUS_COLOR[pedido1.status],
                  border: `1px solid ${STATUS_COLOR[pedido1.status]}`,
                }}>
                  {STATUS_LABEL[pedido1.status]}
                </span>
                <span style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "3px 8px",
                  color: PRIORIDADE_COLOR[pedido1.prioridade],
                  border: `1px solid ${PRIORIDADE_COLOR[pedido1.prioridade]}`,
                }}>
                  Prioridade {pedido1.prioridade}
                </span>
              </div>
              <h2 className="font-light mb-4" style={{ fontSize: "20px", color: "var(--text-01)", lineHeight: "1.4" }}>
                {pedido1.descricao}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" style={{ ...S.borderTop, paddingTop: "16px" }}>
                <div>
                  <p style={{ ...S.caption, marginBottom: "4px", fontWeight: 600 }}>Órgão</p>
                  <p style={{ ...S.body, fontSize: "13px" }}>{pedido1.orgao}</p>
                </div>
                <div>
                  <p style={{ ...S.caption, marginBottom: "4px", fontWeight: 600 }}>Protocolo nº</p>
                  <p style={{ ...S.body, fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>
                    {pedido1.numero_esic?.replace(/(\d{5})(\d{4})(\d{9})/, "$1.$2.$3") ?? "—"}
                  </p>
                </div>
                <div>
                  <p style={{ ...S.caption, marginBottom: "4px", fontWeight: 600 }}>Prazo legal de resposta</p>
                  <p style={{ ...S.body, fontSize: "13px" }}>{pedido1.prazo_resposta}</p>
                </div>
              </div>
              <p style={{ ...S.caption, marginTop: "16px", fontStyle: "italic" }}>
                Assim que recebermos a resposta, os dados serão publicados neste site.
              </p>
            </div>
          </div>
        </section>

        {/* Diário */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Diário do pedido</p>
            <div className="flex flex-col" style={{ maxWidth: "720px", ...S.borderTop }}>
              {DIARIO_LAI.map((entrada, i) => (
                <div key={i} style={{ ...S.borderBottom, padding: "20px 0" }}>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span style={{
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "3px 8px",
                      color: TIPO_DIARIO_COLOR[entrada.tipo],
                      border: `1px solid ${TIPO_DIARIO_COLOR[entrada.tipo]}`,
                    }}>
                      {TIPO_DIARIO_LABEL[entrada.tipo]}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-04)", fontVariantNumeric: "tabular-nums" }}>
                      {entrada.data}
                    </span>
                  </div>
                  <h3 className="font-light mb-2" style={{ fontSize: "16px", color: "var(--text-01)" }}>
                    {entrada.titulo}
                  </h3>
                  <p style={{ ...S.body, fontSize: "13px" }}>{entrada.texto}</p>
                </div>
              ))}
              <p style={{ ...S.caption, paddingTop: "16px", fontStyle: "italic" }}>
                Novas entradas serão adicionadas conforme o pedido avança.
              </p>
            </div>
          </div>
        </section>

        {/* Como fazer o seu pedido */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div style={{ maxWidth: "720px" }}>
              <p className="uppercase font-semibold mb-2" style={S.label}>Você também pode pedir</p>
              <h2 className="font-light mb-6" style={{ fontSize: "22px", color: "var(--text-01)" }}>
                Como protocolar um pedido de acesso à informação
              </h2>
              <p style={{ ...S.body, marginBottom: "24px" }}>
                A Lei nº 12.527/2011 garante a qualquer cidadão o direito de solicitar dados públicos
                sem precisar justificar o pedido. O órgão tem 20 dias para responder, prorrogáveis
                por mais 10 dias com justificativa.
              </p>
              <div className="flex flex-col" style={S.borderTop}>
                {PASSOS.map((passo) => (
                  <div key={passo.n} style={{ ...S.borderBottom, padding: "20px 0", display: "flex", gap: "20px" }}>
                    <div style={{
                      flexShrink: 0, width: "32px", height: "32px",
                      border: "1px solid var(--border-02)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", fontWeight: 600, color: "var(--text-03)",
                    }}>
                      {passo.n}
                    </div>
                    <div>
                      <p style={{ ...S.body, fontWeight: 600, marginBottom: "4px" }}>{passo.titulo}</p>
                      <p style={{ ...S.body, fontSize: "13px", color: "var(--text-03)" }}>{passo.detalhe}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-6">
                <a
                  href="https://falabr.cgu.gov.br/v2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}
                >
                  Acessar o Fala.BR ↗
                </a>
                <a
                  href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}
                >
                  Lei nº 12.527/2011 ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Todos os pedidos */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Todos os pedidos em aberto</p>
            <h2 className="font-light mb-2" style={{ fontSize: "22px", color: "var(--text-01)" }}>
              {TOTAL_PEDIDOS} pedidos ao todo
            </h2>
            <p style={{ ...S.body, maxWidth: "600px", marginBottom: "32px" }}>
              Abaixo estão todos os dados que precisamos acessar por meio de pedido formal.
              Os itens críticos são aqueles sem os quais não é possível responder a pergunta
              central do projeto: como cada real público foi gasto.
            </p>

            {[
              { grupo: "Prioridade crítica",       items: criticos, color: "var(--support-error)" },
              { grupo: "Prioridade alta",           items: altos,    color: "var(--support-warning)" },
              { grupo: "Prioridade média",          items: medios,   color: "var(--blue-40)" },
              { grupo: "Prioridade baixa",          items: baixos,   color: "var(--text-04)" },
            ].map(({ grupo, items, color }) => items.length === 0 ? null : (
              <div key={grupo} className="mb-14">
                <div className="flex items-center gap-3 mb-5">
                  <p className="uppercase font-semibold" style={{ ...S.label, color }}>{grupo}</p>
                  <span style={{ fontSize: "10px", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "2px 7px", letterSpacing: "0.06em" }}>
                    {items.length} pedido{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col" style={S.borderTop}>
                  {items.map((pedido) => (
                    <div key={pedido.id} style={{ ...S.borderBottom, padding: "16px 0" }}>
                      <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                        <div style={{ flex: "1 1 420px" }}>
                          <p style={{ ...S.body, fontSize: "13px", fontWeight: 500, color: "var(--text-01)", marginBottom: "4px" }}>
                            {pedido.descricao}
                          </p>
                          <p style={{ ...S.caption }}>{pedido.orgao}</p>
                        </div>
                        <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                          {pedido.data_protocolo && (
                            <span style={{ fontSize: "11px", color: "var(--text-04)", fontVariantNumeric: "tabular-nums" }}>
                              {pedido.data_protocolo}
                            </span>
                          )}
                          <span style={{
                            fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em",
                            textTransform: "uppercase", padding: "2px 7px",
                            color: STATUS_COLOR[pedido.status],
                            border: `1px solid ${STATUS_COLOR[pedido.status]}`,
                          }}>
                            {STATUS_LABEL[pedido.status]}
                          </span>
                        </div>
                      </div>
                      {pedido.numero_esic && (
                        <p style={{ ...S.caption, marginTop: "6px" }}>
                          Protocolo nº {pedido.numero_esic.replace(/(\d{5})(\d{4})(\d{9})/, "$1.$2.$3")}
                          {pedido.prazo_resposta ? ` · Prazo: ${pedido.prazo_resposta}` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Nota editorial de rodapé */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderTop }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div style={{ maxWidth: "640px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Nota editorial</p>
              <p style={{ ...S.body, marginBottom: "12px" }}>
                Esta página é um diário público. Cada resposta recebida será registrada aqui e
                os dados serão publicados conforme chegarem — com a mesma metodologia aberta
                usada em todo o restante do projeto.
              </p>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                Os pedidos foram elaborados com base nos dados que faltam para completar a análise
                financeira de Sorocaba. Não há interação pública direta nesta página por enquanto.
                Se você tiver informações sobre esses dados, use o{" "}
                <Link href="/contato" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>
                  formulário de contato
                </Link>
                .
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <Link href="/sorocaba/lacunas" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>
                  Ver mapa de lacunas
                </Link>
                <Link href="/sorocaba/dados" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>
                  Dados já publicados
                </Link>
                <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>
                  Metodologia
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
