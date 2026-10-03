import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateTranscriptDataset } from '../src/services/evaluation/dataset.js'
import { parseEvaluationPayload } from '../src/services/evaluation/input.js'
import { getArgument, printReport } from './report.js'

const inputPath = getArgument('--input')
const fixturePath = inputPath
  ? resolve(process.cwd(), inputPath)
  : new URL('../evaluation/fixtures/sample.json', import.meta.url)
const payload = parseEvaluationPayload(JSON.parse(await readFile(fixturePath, 'utf8')))

await printReport(evaluateTranscriptDataset(payload.records, payload.metadata))
