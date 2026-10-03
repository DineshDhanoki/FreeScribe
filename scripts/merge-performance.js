import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { mergePerformancePayloads } from '../src/services/evaluation/mergePerformance.js'
import { parsePerformancePayload } from '../src/services/evaluation/input.js'
import { printReport } from './report.js'

const inputPaths = process.argv.reduce((paths, argument, index) => {
  if (argument === '--input' && process.argv[index + 1]) paths.push(process.argv[index + 1])
  return paths
}, [])

if (inputPaths.length === 0) throw new Error('Provide one or more --input performance JSON files.')

const payloads = await Promise.all(inputPaths.map(async (inputPath) => {
  const payload = JSON.parse(await readFile(resolve(process.cwd(), inputPath), 'utf8'))
  return parsePerformancePayload(payload)
}))

await printReport(mergePerformancePayloads(payloads))
