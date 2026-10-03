import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateTranscriptDataset } from '../src/services/evaluation/dataset.js'
import { checkEvaluationThresholds, evaluationGatePassed } from '../src/services/evaluation/gates.js'
import { parseEvaluationPayload } from '../src/services/evaluation/input.js'
import { evaluateTranslationDataset } from '../src/services/evaluation/translation.js'

function getArgument(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? null : process.argv[index + 1]
}

function getRequiredNumber(name) {
  const value = getArgument(name)
  if (value === null || value === undefined) throw new Error(`${name} requires a numeric value.`)
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${name} requires a finite numeric value.`)
  return number
}

function parseThresholds(type) {
  const thresholds = {}
  const thresholdArguments = type === 'translation'
    ? [['--min-exact-match-rate', 'minExactMatchRate'], ['--min-character-fscore', 'minCharacterFScore']]
    : [['--max-wer', 'maxWordErrorRate'], ['--max-cer', 'maxCharacterErrorRate']]

  for (const [argument, key] of thresholdArguments) {
    if (getArgument(argument) !== null) thresholds[key] = getRequiredNumber(argument)
  }
  if (getArgument('--min-examples') !== null) thresholds.minExamples = getRequiredNumber('--min-examples')
  if (!Object.keys(thresholds).length) throw new Error('Provide at least one evaluation threshold.')
  return thresholds
}

const type = getArgument('--type') || 'transcription'
if (!['transcription', 'translation'].includes(type)) throw new Error('--type must be transcription or translation.')

const inputPath = getArgument('--input')
const defaultFixture = type === 'translation' ? '../evaluation/fixtures/translation.sample.json' : '../evaluation/fixtures/sample.json'
const fixturePath = inputPath ? resolve(process.cwd(), inputPath) : new URL(defaultFixture, import.meta.url)
const payload = parseEvaluationPayload(JSON.parse(await readFile(fixturePath, 'utf8')))
const report = type === 'translation'
  ? evaluateTranslationDataset(payload.records, payload.metadata)
  : evaluateTranscriptDataset(payload.records, payload.metadata)
const thresholds = parseThresholds(type)
const checks = checkEvaluationThresholds(type, report, thresholds)
const result = { type, passed: evaluationGatePassed(checks), thresholds, checks, report }

console.log(JSON.stringify(result, null, 2))
if (!result.passed) process.exitCode = 1
