export function checkEvaluationThresholds(type, report, thresholds = {}) {
  const checks = []
  const addCheck = (name, actual, comparator, expected) => {
    if (expected === undefined) return
    checks.push({ name, actual, expected, passed: comparator(actual, expected) })
  }

  addCheck('minimum examples', report.summary.examples, (actual, expected) => actual >= expected, thresholds.minExamples)
  if (type === 'translation') {
    addCheck('minimum exact-match rate', report.summary.exactMatchRate, (actual, expected) => actual >= expected, thresholds.minExactMatchRate)
    addCheck('minimum character F-score', report.summary.averageCharacterFScore, (actual, expected) => actual >= expected, thresholds.minCharacterFScore)
  } else {
    addCheck('maximum word error rate', report.summary.wordErrorRate, (actual, expected) => actual <= expected, thresholds.maxWordErrorRate)
    addCheck('maximum character error rate', report.summary.characterErrorRate, (actual, expected) => actual <= expected, thresholds.maxCharacterErrorRate)
  }
  return checks
}

export function evaluationGatePassed(checks = []) {
  return checks.length > 0 && checks.every((check) => check.passed)
}
