export type TheoLink = {
  href: string
  label: string
}

export type TheoRoute = {
  id: string
  title: string
  answer: string
  answerSimple?: string
  status: "Disponível" | "Lacuna" | "Em coleta"
  confidence: "Alta" | "Média"
  keywords: string[]
  links: TheoLink[]
  source: string
  limitation: string
}

export type RouteMatch = {
  route: TheoRoute
  score: number
}

export type FormalityLevel = "padrao" | "simples"
