interface Props {
  titulo?: string
  items: string[]
}

export function DadoQueMostra({ titulo = "O que os dados mostram", items }: Props) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-raised)",
        border: "1px solid var(--border-02)",
        padding: "20px 24px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 600,
          color: "var(--text-03)",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}
      >
        {titulo}
      </p>
      <ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ color: "var(--blue-40)", fontSize: "14px", flexShrink: 0, lineHeight: "22px" }}>—</span>
            <p style={{ fontSize: "14px", color: "var(--text-01)", lineHeight: "22px", margin: 0 }}>{item}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
