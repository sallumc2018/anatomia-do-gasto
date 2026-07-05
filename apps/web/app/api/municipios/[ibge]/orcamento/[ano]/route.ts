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
  { params }: { params: Promise<{ ibge: string; ano: string }> }
) {
  const { ibge, ano: anoParam } = await params

  const municipio = IBGE_TO_MUNICIPIO[ibge]
  if (!municipio) {
    return NextResponse.json({ error: "Município não encontrado" }, { status: 404, headers: CORS })
  }

  const ano = Number(anoParam)
  if (!Number.isFinite(ano) || ano < 2000 || ano > 2100) {
    return NextResponse.json({ error: "Ano inválido" }, { status: 400, headers: CORS })
  }

  const anosDisponiveis = getAvailableYearsExecutivo(municipio)
  if (!anosDisponiveis.includes(ano)) {
    return NextResponse.json(
      { error: "Dados não disponíveis para este ano", anos_disponiveis: anosDisponiveis },
      { status: 404, headers: CORS }
    )
  }

  const funcoes = loadExecutivoData(ano, municipio)
  if (funcoes.length === 0) {
    return NextResponse.json({ error: "Dados não encontrados" }, { status: 404, headers: CORS })
  }

  const totais = funcoes.reduce(
    (acc, r) => ({
      dotacao_inicial:    acc.dotacao_inicial    + r.dotacao_inicial,
      dotacao_atualizada: acc.dotacao_atualizada + r.dotacao_atualizada,
      empenhado:          acc.empenhado          + r.empenhado,
      liquidado:          acc.liquidado          + r.liquidado,
    }),
    { dotacao_inicial: 0, dotacao_atualizada: 0, empenhado: 0, liquidado: 0 }
  )

  return NextResponse.json(
    {
      municipio,
      ibge,
      ano,
      funcoes,
      totais,
      anos_disponiveis: anosDisponiveis,
      fonte: `despesas_executivo_${municipio}_${ano}.csv`,
    },
    {
      headers: {
        ...CORS,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "X-RateLimit-Limit": "500",
      },
    }
  )
}
