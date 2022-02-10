import * as path from 'node:path'
import { recurseFiles } from './index.mjs'

const dir = path.resolve(process.argv[2])
const files = (await recurseFiles(dir))
  .map((f) => path.join('./', f.substr(dir.length)))
  .filter((f) => f.includes('benchmark'))

console.log(`
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

// @ts-ignore
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
`)

for (const file of files) {
  console.log('// @ts-ignore')
  const identifier = file.replace(/[-\/\.]/g, '_')

  console.log(
    `const ${identifier} = new WebAssembly.Module(fs.readFileSync(path.resolve(__dirname, '${file}')));`
  )
}
console.log()

console.log(
  'export const ModuleTable: { [key: string]: WebAssembly.Module } = {'
)
for (const file of files) {
  const identifier = file.replace(/[-\/\.]/g, '_')
  const name = file.split('/').pop()
  console.log(`  '${name}': ${identifier},`)
}
console.log('}')
