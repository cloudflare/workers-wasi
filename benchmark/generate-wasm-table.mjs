// generate a table with explicit imports since we can't dynamically load
// WebAssembly modules in our worker
import path from 'path'
import fs from 'fs/promises'

const recurseFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return (
    await Promise.all(
      entries
        .filter((dirent) => dirent.name !== 'deps')
        .map(async (dirent) => {
          if (dirent.isDirectory()) {
            return recurseFiles(path.join(dir, dirent.name))
          }
          if (!dirent.name.endsWith('.wasm')) {
            return []
          }

          return [path.resolve(dir, dirent.name)]
        })
    )
  ).flat()
}

const dir = path.resolve('subjects')
const files = (await recurseFiles(dir)).map((f) =>
  path.join('./', f.substr(dir.length))
)

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
    `const ${identifier} = new WebAssembly.Module(fs.readFileSync(path.resolve(__dirname, '../../benchmark/subjects/${file}')));`
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
