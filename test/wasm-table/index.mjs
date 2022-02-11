import * as path from 'path'
import * as fs from 'fs/promises'

const recurseFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(async (dirent) => {
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

export const createTable = async (filter = () => true) => {
  const dir = path.resolve(process.argv[2])
  const files = (await recurseFiles(dir))
    .map((f) => path.join('./', f.substr(dir.length)))
    .filter(filter)

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
}
