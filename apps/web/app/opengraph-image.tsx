import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt =
  "Anatomia do Gasto — Rastreador auditável do gasto público de Sorocaba"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const AREAS = ["Saúde", "Educação", "Segurança", "Transporte"]

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#161616",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Barra azul lateral */}
        <div
          style={{
            position: "absolute",
            left: "80px",
            top: "80px",
            bottom: "80px",
            width: "4px",
            background: "#0f62fe",
          }}
        />

        <div
          style={{
            paddingLeft: "36px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Label superior */}
          <span
            style={{
              fontSize: "13px",
              letterSpacing: "0.1em",
              color: "#6f6f6f",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            Sorocaba, SP · Dados públicos 2020–2025
          </span>

          {/* Título principal */}
          <span
            style={{
              fontSize: "80px",
              fontWeight: 600,
              color: "#f4f4f4",
              lineHeight: 1.05,
              marginBottom: "20px",
            }}
          >
            Anatomia do Gasto
          </span>

          {/* Tagline */}
          <span
            style={{
              fontSize: "30px",
              color: "#8d8d8d",
              lineHeight: 1.3,
              marginBottom: "48px",
            }}
          >
            Para onde vai o dinheiro público
          </span>

          {/* Áreas */}
          <div style={{ display: "flex", gap: "12px" }}>
            {AREAS.map((area) => (
              <div
                key={area}
                style={{
                  fontSize: "15px",
                  color: "#6f6f6f",
                  padding: "8px 20px",
                  border: "1px solid #393939",
                }}
              >
                {area}
              </div>
            ))}
          </div>

          {/* URL */}
          <span
            style={{
              marginTop: "40px",
              fontSize: "14px",
              color: "#525252",
              letterSpacing: "0.02em",
            }}
          >
            anatomiadogasto.ong.br
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
