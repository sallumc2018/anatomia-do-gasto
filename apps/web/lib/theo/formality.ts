import type { FormalityLevel } from "./types"

export function detectFormality(query: string): FormalityLevel {
  const q = query.toLowerCase()
  let signals = 0

  // Abreviações comuns
  if (/\b(vc|pq|tb|msm|blz|vlw|obg|mto|nao\b|num\b|eh\b)\b/.test(q)) signals += 2
  // Gírias e interjeições
  if (/\b(cara|tipo|mano|vei|vei|po\b|puts|nossa|eai|e ai|opa)\b/.test(q)) signals += 2
  // Riso
  if (/k{3,}|haha|rsrs/.test(q)) signals += 2
  // Múltipla pontuação expressiva
  if (/[?!]{2,}/.test(query)) signals += 1
  // Frase muito curta (≤ 4 palavras) — sinal fraco, só complementa
  if (q.trim().split(/\s+/).length <= 4) signals += 1

  return signals >= 2 ? "simples" : "padrao"
}
