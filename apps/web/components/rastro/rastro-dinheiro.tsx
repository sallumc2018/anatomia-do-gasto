import { formatMillions, formatPrecise, type Area } from "@/lib/data"

type MoneySource = {
  label: string
  value: number
  note: string
}

type MoneyDestination = {
  label: string
  value: number
}

type BudgetStage = {
  label: string
  value: number
  note: string
}

interface RastroDinheiroProps {
  area: Area
  year: number
  periodLabel: string
  sources: MoneySource[]
  stages: BudgetStage[]
  destinations: MoneyDestination[]
  documentSource: string
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  h2: {
    fontSize: "28px",
    lineHeight: "36px",
    color: "var(--text-01)",
    fontWeight: 300,
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  small: {
    fontSize: "12px",
    lineHeight: "18px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const AREA_LABEL: Record<Area, string> = {
  saude: "Saúde",
  educacao: "Educação",
}

export function RastroDinheiro({
  area,
  year,
  periodLabel,
  sources,
  stages,
  destinations,
  documentSource,
}: RastroDinheiroProps) {
  const validSources = sources.filter((source) => source.value > 0)
  const validDestinations = destinations.filter((destination) => destination.value > 0)

  return (
    <section id="rastro" style={{ backgroundColor: "var(--bg-base)", ...S.borderTop, ...S.borderBottom }}>
      <div className="mx-auto px-6 py-14" style={S.container}>
        <p className="uppercase font-semibold mb-2" style={S.label}>
          Rastro documentado do dinheiro · {AREA_LABEL[area]} · {year} · {periodLabel}
        </p>
        <h2 className="font-light mb-3" style={S.h2}>
          Origem, registro administrativo e destino funcional
        </h2>
        <p className="mb-8" style={{ ...S.body, maxWidth: "760px" }}>
          Este bloco mostra apenas etapas presentes nos arquivos publicados. Quando o dataset não identifica
          pessoa, fornecedor, conta bancária ou local físico, essa ausência fica declarada.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0" style={S.borderTop}>
          <TraceColumn
            number="01"
            title="Origem registrada"
            rows={validSources.map((source) => ({
              label: source.label,
              value: source.value,
              note: source.note,
            }))}
          />
          <TraceColumn
            number="02"
            title="Entrada no ente publico"
            rows={[
              {
                label: "Prefeitura de Sorocaba",
                value: null,
                note: "Os relatórios agregados registram a execução municipal por área. O dataset publicado não identifica conta bancária ou unidade gestora detalhada.",
              },
            ]}
          />
          <TraceColumn
            number="03"
            title="Estagio orcamentario"
            rows={stages.map((stage) => ({
              label: stage.label,
              value: stage.value,
              note: stage.note,
            }))}
          />
          <TraceColumn
            number="04"
            title="Destino funcional"
            rows={validDestinations.map((destination) => ({
              label: destination.label,
              value: destination.value,
              note: "Classificação funcional do documento oficial. Não equivale a fornecedor, escola, unidade de saúde ou endereço.",
            }))}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
          <div className="py-6 md:pr-8" style={S.borderBottom}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Fonte usada</p>
            <p style={S.body}>{documentSource}</p>
          </div>
          <div className="py-6 md:pl-8" style={{ ...S.borderBottom, borderLeft: "1px solid var(--border-01)" }}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Campos não publicados neste dataset</p>
            <p style={S.body}>
              Ordenador de despesa, servidor responsável, fornecedor, CNPJ, nota de empenho individual,
              conta bancária, escola, unidade de saúde, endereço e comprovante de pagamento individual.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function TraceColumn({
  number,
  title,
  rows,
}: {
  number: string
  title: string
  rows: { label: string; value: number | null; note: string }[]
}) {
  return (
    <div className="trace-column py-7 lg:pr-7 lg:pl-7 first:lg:pl-0" style={S.borderBottom}>
      <p className="font-mono mb-3" style={{ color: "var(--text-04)", fontSize: "12px" }}>{number}</p>
      <h3 className="font-semibold mb-5" style={{ color: "var(--text-01)", fontSize: "15px" }}>{title}</h3>
      <div className="flex flex-col gap-5">
        {rows.map((row) => (
          <div key={`${row.label}-${row.value ?? "sem-valor"}`}>
            <p className="font-semibold mb-1" style={{ color: "var(--text-01)", fontSize: "13px" }}>
              {row.label}
            </p>
            {row.value !== null && (
              <>
                <p className="font-mono" style={{ color: "var(--text-01)", fontSize: "18px", lineHeight: "24px" }}>
                  {formatMillions(row.value)}
                </p>
                <p className="font-mono mb-2" style={S.small}>{formatPrecise(row.value)}</p>
              </>
            )}
            <p style={S.small}>{row.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
