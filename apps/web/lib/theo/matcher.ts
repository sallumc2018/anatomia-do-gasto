import type { TheoRoute, RouteMatch } from "./types"
import { normalize } from "./text"
import { isCloseMatch } from "./fuzzy"
import { THEO_ROUTES, FALLBACK_ROUTE } from "./routes"
import { STOPWORDS } from "./stopwords"

export function scoreRoute(route: TheoRoute, query: string): number {
  const normalizedQuery = normalize(query)
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean)

  return route.keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalize(keyword)

    if (normalizedQuery.includes(normalizedKeyword)) return score + 3

    const keywordParts = normalizedKeyword.split(" ")
    if (
      keywordParts.some(
        (part) => part.length > 4 && !STOPWORDS.has(part) && normalizedQuery.includes(part)
      )
    ) {
      return score + 1
    }

    // Tolerância a erro de digitação: keyword de uma palavra só, próxima de
    // alguma palavra da pergunta (ex. "trasparencia" ~ "transparencia").
    if (keywordParts.length === 1 && queryWords.some((word) => isCloseMatch(word, normalizedKeyword))) {
      return score + 2
    }

    return score
  }, 0)
}

export function findBestMatch(query: string): RouteMatch {
  let best: RouteMatch = { route: FALLBACK_ROUTE, score: 0 }
  for (const route of THEO_ROUTES) {
    const s = scoreRoute(route, query)
    if (s > best.score) best = { route, score: s }
  }
  return best
}
