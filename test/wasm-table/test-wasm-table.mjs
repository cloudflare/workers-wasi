import * as path from 'node:path'
import { recurseFiles } from './index.mjs'

const dir = path.resolve(process.argv[2])
const files = (await recurseFiles(dir)).map((f) =>
  path.join('./', f.substr(dir.length))
)
for (const file of files) {
  console.log('// @ts-ignore')
  const identifier = file.replace(/[-\/\.]/g, '_')
  console.log(`import ${identifier} from '${file}'`)
}
console.log()

console.log(
  'export const ModuleTable: { [key: string]: WebAssembly.Module } = {'
)
for (const file of files) {
  const identifier = file.replace(/[-\/\.]/g, '_')
  console.log(`  '${file}': ${identifier},`)
}
console.log('}')
