// Keep slice names stable so reports can be compared across benchmark runs.
export const EVALUATION_DIMENSIONS = [
  'language',
  'model',
  'condition',
  'accent',
  'noiseCondition',
  'speakerGroup',
]

export function groupExamplesByDimension(examples, dimensions = EVALUATION_DIMENSIONS) {
  return Object.fromEntries(dimensions.map((dimension) => {
    const groups = {}
    for (const example of examples) {
      const value = example[dimension] || 'unspecified'
      if (!groups[value]) groups[value] = []
      groups[value].push(example)
    }
    return [dimension, groups]
  }))
}
