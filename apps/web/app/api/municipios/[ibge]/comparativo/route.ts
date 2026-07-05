import { NextRequest, NextResponse } from "next/server"
import { getAvailableYearsExecutivo, loadExecutivoData } from "@/lib/data"

const IBGE_TO_MUNICIPIO: Record<string, string> = {
  "3552205": "sorocaba",
  "3536505": "paulinia",
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ibge: string }> }
) {
  const { ibge } = await params

  const municipio = IBGE_TO_MUNICIPIO[ibge]
  if (!municipio) {
    return NextResponse.json({ error: "Município não encontrado" }, { status: 404, headers: CORS })
  }

  const anos = getAvailableYearsExecutivo(municipio)
  if (anos.length === 0) {
    return NextResponse.json({ error: "Nenhum dado disponível" }, { status: 404, headers: CORS })
  }

  const serie = anos
    .map((ano) => {
      const funcoes = loadExecutivoData(ano, municipio)
      if (funcoes.length === 0) return null
      const totais = funcoes.reduce(
        (acc, r) => ({
          dotacao_inicial:    acc.dotacao_inicial    + r.dotacao_inicial,
          dotacao_atualizada: acc.dotacao_atualizada + r.dotacao_atualizada,
          empenhado:          acc.empenhado          + r.empenhado,
          liquidado:          acc.liquidado          + r.liquidado,
        }),
        { dotacao_inicial: 0, dotacao_atualizada: 0, empenhado: 0, liquidado: 0 }
      )
      return { ano, ...totais }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.ano - b.ano)

  return NextResponse.json(
    { municipio, ibge, serie },
    {
      headers: {
        ...CORS,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "X-RateLimit-Limit": "500",
      },
    }
  )
}
