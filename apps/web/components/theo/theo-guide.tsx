"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { detectFormality, findBestMatch } from "@/lib/theo"

const SUGGESTIONS = [
  { label: "Receita de Sorocaba", q: "Quanto entrou em Sorocaba?" },
  { label: "Gastos com Saúde", q: "Quanto Sorocaba gastou com saúde?" },
  { label: "O que é empenho?", q: "O que significa empenho, liquidação, pagamento?" },
  { label: "Missão da ONG", q: "Qual é o propósito e a missão da ONG?" },
]

export default function TheoGuide({ initialQuery = "" }: { initialQuery?: string }) {
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [lastUserQuestion, setLastUserQuestion] = useState(initialQuery)
  const [isThinking, setIsThinking] = useState(false)

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery)
    setQuery(initialQuery)
    setSubmittedQuery(initialQuery)
    setLastUserQuestion(initialQuery)
  }

  const result = useMemo(
    () => (submittedQuery && !isThinking ? findBestMatch(submittedQuery) : null),
    [submittedQuery, isThinking]
  )
  const formality = useMemo(() => detectFormality(submittedQuery), [submittedQuery])
  const answer = result?.route
  const isFallback = !!submittedQuery && (result?.score ?? 0) === 0
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

    setTimeout(() => {
      setSubmittedQuery(trimmed)
      setIsThinking(false)
    }, 600) // Delay realista premium de IA
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

      {/* Resposta Encontrada */}
      {answer && !isThinking && (
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

          {answer.status !== "Disponível" && (
            <p className={`theo-chat__status-notice theo-chat__status-notice--${answer.status === "Lacuna" ? "lacuna" : "coleta"}`}>
              {answer.status === "Lacuna" ? "Dado não publicado ainda" : "Em processo de coleta"}{" — "}{answer.limitation}
            </p>
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
