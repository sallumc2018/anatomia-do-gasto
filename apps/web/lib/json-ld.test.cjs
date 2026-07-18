const test = require("node:test")
const assert = require("node:assert/strict")

const { serializeJsonLd } = require("./json-ld.js")

test("serializeJsonLd escapes script-breaking and HTML-sensitive characters", () => {
  const serialized = serializeJsonLd({
    name: "</script><script>alert('x')</script>",
    description: "A & B > C",
    separators: "linha\u2028paragrafo\u2029fim",
  })

  assert.equal(serialized.includes("</script>"), false)
  assert.equal(serialized.includes("<script>"), false)
  assert.equal(serialized.includes("<"), false)
  assert.equal(serialized.includes(">"), false)
  assert.equal(serialized.includes("&"), false)
  assert.match(serialized, /\\u003c\/script\\u003e/)
  assert.match(serialized, /\\u0026/)
  assert.match(serialized, /\\u2028/)
  assert.match(serialized, /\\u2029/)
})

test("serializeJsonLd preserves parseable JSON values", () => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Anatomia do Gasto",
    count: 3,
    active: true,
  }

  assert.deepEqual(JSON.parse(serializeJsonLd(data)), data)
})
