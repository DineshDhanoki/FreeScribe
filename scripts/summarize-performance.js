import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { summarizeTranscriptionMetrics } from '../src/services/evaluation/performance.js'
import { parsePerformancePayload } from '../src/services/evaluation/input.js'
import { getArgument, printReport } from './report.js'

const inputPath = getArgument('--input')
const fixturePath = inputPath
  ? resolve(process.cwd(), inputPath)
  : new URL('../evaluation/fixtures/performance.sample.json', import.meta.url)
const payload = parsePerformancePayload(JSON.parse(await readFile(fixturePath, 'utf8')))

await printReport(summarizeTranscriptionMetrics(payload.runs, payload.metadata))
