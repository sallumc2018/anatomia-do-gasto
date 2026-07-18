import { serializeJsonLd } from "@/lib/json-ld"

type JsonLdProps = {
  data: unknown
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
