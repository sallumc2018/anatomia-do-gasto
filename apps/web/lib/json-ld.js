const JSON_LD_ESCAPE_LOOKUP = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => JSON_LD_ESCAPE_LOOKUP[character])
}

module.exports = {
  serializeJsonLd,
}
