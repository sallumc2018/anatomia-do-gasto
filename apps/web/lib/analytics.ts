"use client"

import { track } from "@vercel/analytics"

export const trackEvent = {
  navClick:     (area: string)                        => track("nav_click",     { area }),
  relatorioAno: (area: string, ano: number)           => track("relatorio_ano", { area, ano }),
  fontClick:    (area: string, url: string)           => track("fonte_click",   { area, url }),
  rastroView:   (area: string, ano: number)           => track("rastro_view",   { area, ano }),
  // Compreensao: voto anonimo de clareza (so booleano + caminho da pagina; nunca texto digitado).
  feedbackClareza: (contexto: string, util: boolean)  => track("feedback_clareza", { contexto, util }),
  // Findability: flag de busca sem resultado (so o contexto/area; NUNCA o termo digitado -> esse vai p/ 1a-parte).
  buscaZero:    (contexto: string)                    => track("busca_zero", { contexto }),
}
