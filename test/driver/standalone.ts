import * as fs from 'node:fs/promises'
import { exec } from './common'

const [modulePath, rawOptions] = process.argv.slice(2)
const options = JSON.parse(rawOptions)

fs.readFile(modulePath)
  .then((wasmBytes) => new WebAssembly.Module(wasmBytes))
  .then((wasmModule) => exec(options, wasmModule))
  .then((result) => {
    console.log(result.stdout)
    console.error(result.stderr)
    process.exit(result.status)
  })
