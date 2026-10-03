import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateTranslationDataset } from '../src/services/evaluation/translation.js'
import { parseEvaluationPayload } from '../src/services/evaluation/input.js'
import { getArgument, printReport } from './report.js'

const inputPath = getArgument('--input')
const fixturePath = inputPath
  ? resolve(process.cwd(), inputPath)
  : new URL('../evaluation/fixtures/translation.sample.json', import.meta.url)
const payload = parseEvaluationPayload(JSON.parse(await readFile(fixturePath, 'utf8')))

await printReport(evaluateTranslationDataset(payload.records, payload.metadata))
