"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { detectFormality, findBestMatch, findTopMatches, THEO_ROUTES, FALLBACK_ROUTE } from "@/lib/theo"
import type { TheoRoute } from "@/lib/theo"

const SUGGESTIONS = [
  { label: "Receita de Sorocaba", q: "Quanto entrou em Sorocaba?" },
  { label: "Gastos com Saúde", q: "Quanto Sorocaba gastou com saúde?" },
  { label: "O que é empenho?", q: "O que significa empenho, liquidação, pagamento?" },
  { label: "Missão da ONG", q: "Qual é o propósito e a missão da ONG?" },
]

// Aberturas neutras, só para variar o tom entre respostas — não alteram o
// conteúdo factual (que continua vindo 100% de route.answer/answerSimple).
const OPENERS = ["Aqui está o que encontrei:", "Beleza, olha só:", "Certo, essa é a resposta:", "Show, veja:"]

// Limiar de ambiguidade: só pergunta "você quis dizer X ou Y?" quando o sinal
// do vencedor é fraco (score <= 3, ou seja, nenhum match de frase exata
// isolado o suficiente) E o segundo colocado está a 1 ponto ou menos. Medido
// contra os 240 casos de treino: com score<=3 + margem<=1, zero respostas
// hoje diretas e corretas viram clarify — só os casos genuinamente incertos.
const AMBIGUITY_MAX_SCORE = 3
const AMBIGUITY_MAX_MARGIN = 1
// Retomada de contexto: só tenta reaproveitar o tema anterior quando a
// pergunta atual não bateu em nada (fallback) e é curta o bastante pra ser
// uma continuação ("e em 2023?") em vez de um assunto novo.
const CONTEXT_RETRY_MAX_WORDS = 6

type MatchResult =
  | { kind: "answer"; route: TheoRoute; contextUsed: boolean }
  | { kind: "clarify"; options: [TheoRoute, TheoRoute] }
  | { kind: "fallback" }

export default function TheoGuide({ initialQuery = "" }: { initialQuery?: string }) {
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [lastUserQuestion, setLastUserQuestion] = useState(initialQuery)
  const [isThinking, setIsThinking] = useState(false)
  const [forcedRouteId, setForcedRouteId] = useState<string | null>(null)
  const [lastRoute, setLastRoute] = useState<TheoRoute | null>(null)
  const [askCount, setAskCount] = useState(0)

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery)
    setQuery(initialQuery)
    setSubmittedQuery(initialQuery)
    setLastUserQuestion(initialQuery)
  }

  const matchResult: MatchResult | null = useMemo(() => {
    if (!submittedQuery || isThinking) return null

    if (forcedRouteId) {
      const forced = THEO_ROUTES.find((route) => route.id === forcedRouteId)
      if (forced) return { kind: "answer", route: forced, contextUsed: false }
    }

    const best = findBestMatch(submittedQuery)
    const runnerUp = findTopMatches(submittedQuery, 2)[1]

    const isAmbiguous =
      best.score > 0 &&
      best.score <= AMBIGUITY_MAX_SCORE &&
      !!runnerUp &&
      runnerUp.score > 0 &&
      runnerUp.route.id !== best.route.id &&
      best.score - runnerUp.score <= AMBIGUITY_MAX_MARGIN

    if (isAmbiguous && runnerUp) {
      return { kind: "clarify", options: [best.route, runnerUp.route] }
    }

    if (best.score > 0) {
      return { kind: "answer", route: best.route, contextUsed: false }
    }

    if (lastRoute && submittedQuery.trim().split(/\s+/).filter(Boolean).length <= CONTEXT_RETRY_MAX_WORDS) {
      const contextual = findBestMatch(`${lastRoute.title} ${submittedQuery}`)
      if (contextual.score > 0) {
        return { kind: "answer", route: contextual.route, contextUsed: true }
      }
    }

    return { kind: "fallback" }
  }, [submittedQuery, isThinking, forcedRouteId, lastRoute])

  // Ajuste de estado durante a renderização (padrão documentado do React,
  // já usado acima para prevInitialQuery) — evita setState em useEffect e
  // leitura de ref durante render, ambos bloqueados pelo lint deste projeto.
  if (matchResult?.kind === "answer" && matchResult.route.id !== lastRoute?.id) {
    setLastRoute(matchResult.route)
  }

  const formality = useMemo(() => detectFormality(submittedQuery), [submittedQuery])
  const isFallback = matchResult?.kind === "fallback"
  const answer =
    matchResult?.kind === "answer" ? matchResult.route : isFallback ? FALLBACK_ROUTE : undefined
  const contextUsed = matchResult?.kind === "answer" && matchResult.contextUsed
  const opener = OPENERS[askCount % OPENERS.length]
  const displayAnswer =
    answer && formality === "simples" && answer.answerSimple
      ? answer.answerSimple
      : answer?.answer

  function handleSearch(nextQuery: string) {
    const trimmed = nextQuery.trim()
    if (!trimmed) return

    setIsThinking(true)
    setSubmittedQuery("")
    setLastUserQuestion(trimmed)
    setForcedRouteId(null)
    setAskCount((count) => count + 1)

    setTimeout(() => {
      setSubmittedQuery(trimmed)
      setIsThinking(false)
    }, 600) // Delay realista premium de IA
  }

  function pickClarifyOption(routeId: string) {
    setForcedRouteId(routeId)
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim()) {
      handleSearch(query)
      setQuery("")
    }
  }

  return (
    <section id="theo" className="theo-chat animate-fade-in" aria-label="Guia de perguntas">
      <form className="theo-chat__composer" onSubmit={submitQuestion}>
        <div style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
          <input
            id="theo-question"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pergunte sobre Sorocaba ou sobre a nossa ONG…"
            aria-label="Pergunte ao Théo"
          />
          <button type="submit" aria-label="Enviar pergunta">→</button>
        </div>
      </form>

      {/* Chips de Sugestões Rápidas */}
      <div className="flex flex-wrap gap-2 mt-3" aria-label="Sugestões de perguntas">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleSearch(item.q)}
            style={{
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor: "var(--bg-raised)",
              border: "1px solid var(--border-01)",
              color: "var(--text-02)",
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
            className="hover:bg-[var(--bg-high)] hover:text-[var(--text-01)] hover:border-[var(--border-02)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
          >
            {item.label}
          </button>
        ))}
      </div>

      <p
        role="note"
        style={{
          margin: "12px 0 0",
          padding: "8px 12px",
          fontSize: "12px",
          lineHeight: "18px",
          color: "var(--text-03)",
          backgroundColor: "var(--bg-raised)",
          border: "1px solid var(--border-02)",
          borderRadius: "6px",
        }}
      >
        🛈 O Théo ainda está <strong>em treinamento</strong>. Ele é um guia em construção e responde a um conjunto
        limitado de perguntas — se não encontrar o que você procura, tente outras palavras ou navegue pelo site.
      </p>

      {/* Estado "Pensando" (Carregamento Premium) */}
      {isThinking && (
        <div
          className="theo-chat__answer mt-6"
          role="status"
          aria-live="polite"
          aria-label="Théo está buscando a resposta"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-[var(--theme-accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-[var(--theme-accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-[var(--theme-accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            <span className="text-xs font-semibold text-[var(--text-03)] uppercase tracking-wider">
              Buscando no banco de conhecimento...
            </span>
          </div>
          {/* Skeleton Screen */}
          <div className="space-y-2 mt-4 animate-pulse">
            <div className="h-4 bg-[var(--bg-raised)] rounded w-3/4"></div>
            <div className="h-3 bg-[var(--bg-raised)] rounded w-5/6"></div>
            <div className="h-3 bg-[var(--bg-raised)] rounded w-2/3"></div>
          </div>
        </div>
      )}

      {/* Pergunta de esclarecimento: sinal fraco demais pra escolher sozinho */}
      {matchResult?.kind === "clarify" && !isThinking && (
        <div className="theo-chat__answer" role="region" aria-live="polite" aria-label="Esclarecimento">
          {lastUserQuestion && (
            <div
              style={{
                borderLeft: "2px solid var(--border-02)",
                paddingLeft: "10px",
                marginBottom: "14px",
                fontSize: "12px",
                color: "var(--text-03)",
              }}
              className="italic"
            >
              Você perguntou: <span style={{ color: "var(--text-01)" }}>&ldquo;{lastUserQuestion}&rdquo;</span>
            </div>
          )}
          <p className="leading-relaxed text-[var(--text-02)] mb-3">
            Não tenho certeza — você quis dizer:
          </p>
          <div className="flex flex-wrap gap-2">
            {matchResult.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => pickClarifyOption(option.id)}
                style={{
                  fontSize: "13px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "var(--bg-raised)",
                  border: "1px solid var(--border-02)",
                  color: "var(--text-01)",
                  cursor: "pointer",
                }}
                className="hover:bg-[var(--bg-high)] hover:border-[var(--border-focus)]"
              >
                {option.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resposta Encontrada */}
      {answer && matchResult?.kind !== "clarify" && !isThinking && (
        <div className="theo-chat__answer" role="region" aria-live="polite" aria-label="Resposta">
          {/* Histórico Curto */}
          {lastUserQuestion && (
            <div
              style={{
                borderLeft: "2px solid var(--border-02)",
                paddingLeft: "10px",
                marginBottom: "14px",
                fontSize: "12px",
                color: "var(--text-03)",
              }}
              className="italic"
            >
              Você perguntou: <span style={{ color: "var(--text-01)" }}>&ldquo;{lastUserQuestion}&rdquo;</span>
            </div>
          )}

          {isFallback && (
            <p className="theo-chat__fallback-notice">
              Não encontrei uma resposta específica para o que você digitou. Tente clicar em uma das sugestões acima ou buscar por termos chaves como: <em>receita, gasto, empenho, vereador, dívida, ou sobre a própria ONG</em>.
            </p>
          )}

          {contextUsed && (
            <p className="theo-chat__fallback-notice">
              Não achei nada exato, mas pela sua pergunta anterior sobre <strong>{lastRoute?.title}</strong>, acho que é isso:
            </p>
          )}

          {answer.status !== "Disponível" && (
            <p className={`theo-chat__status-notice theo-chat__status-notice--${answer.status === "Lacuna" ? "lacuna" : "coleta"}`}>
              {answer.status === "Lacuna" ? "Dado não publicado ainda" : "Em processo de coleta"}{" — "}{answer.limitation}
            </p>
          )}

          {!isFallback && !contextUsed && (
            <p className="text-xs font-medium text-[var(--text-03)] mb-1">{opener}</p>
          )}

          <h4 className="font-semibold text-lg text-[var(--text-01)] mb-2">{answer.title}</h4>
          <p className="leading-relaxed text-[var(--text-02)]">{displayAnswer}</p>

          <div className="theo-chat__links">
            {answer.links.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </div>

          <p className="theo-chat__trace">{answer.source}</p>
        </div>
      )}
    </section>
  )
}
