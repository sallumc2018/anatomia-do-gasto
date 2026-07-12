// Distância de edição simples, sem dependência externa — suficiente para
// palavras curtas (nomes de tópicos, termos técnicos tipo "iptu", "empenho").
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    const currRow = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      currRow[j] = Math.min(
        prevRow[j] + 1, // remoção
        currRow[j - 1] + 1, // inserção
        prevRow[j - 1] + cost // substituição
      )
    }
    prevRow = currRow
  }

  return prevRow[b.length]
}

// Tolerância proporcional ao tamanho da palavra: erros curtos (≤4 letras)
// não toleram distância, palavras maiores toleram 1-2 letras trocadas.
export function isCloseMatch(word: string, target: string): boolean {
  if (word === target) return true
  if (word.length <= 3 || target.length <= 3) return false

  const maxLen = Math.max(word.length, target.length)
  const tolerance = maxLen <= 6 ? 1 : 2
  return levenshtein(word, target) <= tolerance
}
