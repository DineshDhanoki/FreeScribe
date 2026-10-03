function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function editDistance(reference, hypothesis) {
  const rows = reference.length + 1
  const columns = hypothesis.length + 1
  const matrix = Array.from({ length: rows }, (_, row) => {
    const values = new Array(columns).fill(0)
    values[0] = row
    return values
  })

  for (let column = 0; column < columns; column += 1) matrix[0][column] = column

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost = reference[row - 1] === hypothesis[column - 1] ? 0 : 1
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      )
    }
  }

  return matrix[rows - 1][columns - 1]
}

export function wordErrorRate(reference, hypothesis) {
  const referenceWords = normalizeText(reference)
  const hypothesisWords = normalizeText(hypothesis)
  return {
    referenceWords: referenceWords.length,
    hypothesisWords: hypothesisWords.length,
    errors: editDistance(referenceWords, hypothesisWords),
    rate: referenceWords.length === 0
      ? (hypothesisWords.length === 0 ? 0 : 1)
      : editDistance(referenceWords, hypothesisWords) / referenceWords.length,
  }
}

export function characterErrorRate(reference, hypothesis) {
  const referenceCharacters = String(reference || '').toLowerCase().replace(/\s+/g, ' ').trim().split('')
  const hypothesisCharacters = String(hypothesis || '').toLowerCase().replace(/\s+/g, ' ').trim().split('')
  const errors = editDistance(referenceCharacters, hypothesisCharacters)
  return {
    referenceCharacters: referenceCharacters.length,
    hypothesisCharacters: hypothesisCharacters.length,
    errors,
    rate: referenceCharacters.length === 0
      ? (hypothesisCharacters.length === 0 ? 0 : 1)
      : errors / referenceCharacters.length,
  }
}

