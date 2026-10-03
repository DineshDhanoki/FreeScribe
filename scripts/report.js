import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export function getArgument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

export async function printReport(report) {
  const outputPath = getArgument('--output')
  const serialized = JSON.stringify(report, null, 2)
  if (outputPath) {
    const resolvedPath = resolve(process.cwd(), outputPath)
    await mkdir(dirname(resolvedPath), { recursive: true })
    await writeFile(resolvedPath, `${serialized}\n`, 'utf8')
    console.error(`Wrote evaluation report to ${resolvedPath}`)
  }
  console.log(serialized)
}
