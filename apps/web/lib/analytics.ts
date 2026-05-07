"use client"

import { track } from "@vercel/analytics"

export const trackEvent = {
  navClick:     (area: string)                        => track("nav_click",     { area }),
  relatorioAno: (area: string, ano: number)           => track("relatorio_ano", { area, ano }),
  fontClick:    (area: string, url: string)           => track("fonte_click",   { area, url }),
  rastroView:   (area: string, ano: number)           => track("rastro_view",   { area, ano }),
}
