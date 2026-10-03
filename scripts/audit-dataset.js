import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { auditDatasetSplits } from '../src/services/evaluation/audit.js'
import { parseEvaluationPayload } from '../src/services/evaluation/input.js'
import { printReport } from './report.js'

const inputPaths = process.argv.reduce((paths, argument, index) => {
  if (argument === '--input' && process.argv[index + 1]) paths.push(process.argv[index + 1])
  return paths
}, [])

if (inputPaths.length === 0) throw new Error('Provide one or more --input dataset JSON files.')

const payloads = await Promise.all(inputPaths.map(async (inputPath) => {
  const payload = JSON.parse(await readFile(resolve(process.cwd(), inputPath), 'utf8'))
  return parseEvaluationPayload(payload)
}))
const report = auditDatasetSplits(payloads)
await printReport(report)
if (!report.valid) process.exitCode = 1
