"use client"

import React, { useState, useRef } from "react"

// Dicionário de termos orçamentários simplificados para exibição em Tooltips
const GLOSSARY_DB: Record<string, { title: string; desc: string; href: string }> = {
  empenho: {
    title: "Empenho (Valor Empenhado)",
    desc: "A prefeitura reserva parte do orçamento para pagar um contrato ou compra autorizada. O dinheiro foi juridicamente comprometido, mas o serviço ainda pode não ter sido entregue.",
    href: "/glossario#empenho",
  },
  empenhada: {
    title: "Empenhada",
    desc: "A prefeitura reserva parte do orçamento para pagar um contrato ou compra autorizada. O dinheiro foi juridicamente comprometido, mas o serviço ainda pode não ter sido entregue.",
    href: "/glossario#empenho",
  },
  liquidacao: {
    title: "Liquidação (Valor Liquidado)",
    desc: "Confirmação de que o serviço ou produto foi de fato entregue pelo fornecedor. É a fase que melhor representa o gasto real do município.",
    href: "/glossario#liquidação",
  },
  liquidada: {
    title: "Liquidada",
    desc: "Confirmação de que o serviço ou produto foi de fato entregue pelo fornecedor. É a fase que melhor representa o gasto real do município.",
    href: "/glossario#liquidação",
  },
  pagamento: {
    title: "Pagamento (Valor Pago)",
    desc: "A transferência física do dinheiro público da prefeitura para a conta bancária do fornecedor, que ocorre sempre após a liquidação.",
    href: "/glossario#pagamento",
  },
  paga: {
    title: "Paga",
    desc: "A transferência física do dinheiro público da prefeitura para a conta bancária do fornecedor, que ocorre sempre após a liquidação.",
    href: "/glossario#pagamento",
  },
  dotacao: {
    title: "Dotação Orçamentária",
    desc: "O limite máximo autorizado por lei (aprovado pelos vereadores) que a prefeitura pode gastar em cada área durante o ano.",
    href: "/glossario#dotação-orçamentária",
  },
  "dotacao atualizada": {
    title: "Dotação Atualizada",
    desc: "O limite orçamentário original acrescido de suplementações (aumentos) ou reduções feitas por decretos ou leis ao longo do ano.",
    href: "/glossario#dotação-atualizada",
  },
  asps: {
    title: "ASPS (Mínimo Constitucional)",
    desc: "Ações e Serviços Públicos de Saúde custeados com receitas próprias da prefeitura. Sorocaba é obrigada por lei a aplicar no mínimo 15% de seus recursos nesta área.",
    href: "/glossario#asps",
  },
  mde: {
    title: "MDE (Manutenção do Ensino)",
    desc: "Manutenção e Desenvolvimento do Ensino. Gastos obrigatórios em educação que contam para cumprir a meta mínima de 25% de recursos próprios exigidos pela Constituição.",
    href: "/glossario#mde",
  },
  fundeb: {
    title: "FUNDEB",
    desc: "Fundo de Manutenção e Desenvolvimento da Educação Básica. Fundo estadual/federal de redistribuição de recursos da educação conforme o número de alunos matriculados.",
    href: "/glossario#fundeb",
  },
  "restos a pagar": {
    title: "Restos a Pagar",
    desc: "Gastos reservados (empenhados) em anos anteriores que não foram pagos até 31 de dezembro, ficando acumulados para quitação no ano seguinte.",
    href: "/glossario#restos-a-pagar",
  },
  receita: {
    title: "Receita Arrecadada",
    desc: "Todo recurso financeiro que efetivamente entra nos cofres do município: impostos locais (IPTU, ISS) e repasses estaduais/federais (IPVA, ICMS, FPM).",
    href: "/glossario#receita",
  },
  loa: {
    title: "LOA (Lei Orçamentária)",
    desc: "Lei Orçamentária Anual. Planejamento aprovado pelos vereadores detalhando a previsão de receitas e fixando os limites de despesas do ano seguinte.",
    href: "/glossario#loa",
  },
  fornecedor: {
    title: "Fornecedor",
    desc: "Empresa, pessoa física ou entidade que prestou serviços ou forneceu materiais para a prefeitura e recebeu pagamento correspondente.",
    href: "/glossario#fornecedor",
  },
}

interface GlossaryTooltipProps {
  term: string
  children: React.ReactNode
}

function normalizeTerm(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .trim()
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const normalized = normalizeTerm(term)
  const item = GLOSSARY_DB[normalized]

  // Se o termo não estiver mapeado no glossário, renderiza normalmente sem o tooltip
  if (!item) {
    return <>{children}</>
  }

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const w = 260
    const rawLeft = r.left + r.width / 2
    // Garante que o tooltip não ultrapasse as bordas da janela
    const left = Math.max(w / 2 + 12, Math.min(window.innerWidth - w / 2 - 12, rawLeft))
    setPos({ top: r.top - 8, left })
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setPos(null), 180)
  }

  function cancelHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        style={{
          borderBottom: "1px dashed var(--text-03)",
          cursor: "help",
          outline: "none",
          display: "inline",
        }}
        className="hover:text-[var(--text-01)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
      >
        {children}
      </span>

      {pos && (
        <div
          role="tooltip"
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -100%)",
            width: "260px",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-02)",
            borderRadius: "6px",
            padding: "12px 14px",
            zIndex: 1050,
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.45)",
          }}
        >
          <h5
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-01)",
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {item.title}
          </h5>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-02)",
              lineHeight: "1.5",
              margin: "0 0 8px 0",
              fontWeight: "normal",
              textAlign: "left",
            }}
          >
            {item.desc}
          </p>
          <a
            href={item.href}
            style={{
              display: "inline-flex",
              fontSize: "11px",
              color: "var(--blue-40)",
              textDecoration: "none",
              fontWeight: 600,
            }}
            className="hover:underline"
          >
            Ver mais no glossário →
          </a>
        </div>
      )}
    </>
  )
}
