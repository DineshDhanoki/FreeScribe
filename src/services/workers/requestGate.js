export function createRequestGate() {
  let generation = 0

  return {
    begin() {
      generation += 1
      return generation
    },
    invalidate() {
      generation += 1
      return generation
    },
    isActive(requestId) {
      return requestId === generation
    },
  }
}
