import * as fs from 'node:fs/promises'
import { ReadableStream } from 'node:stream/web'
import { exec } from './common'

const [modulePath, rawOptions] = process.argv.slice(2)
const options = JSON.parse(rawOptions)

const nulls = new Uint8Array(4096).fill(0)
let written = 0

const stdinStream = new ReadableStream<Uint8Array>({
  pull: (controller) => {
    if (written > 1_000_000) {
      controller.close()
    } else {
      controller.enqueue(nulls)
      written += nulls.byteLength
    }
  },
})

fs.readFile(modulePath)
  .then((wasmBytes) => new WebAssembly.Module(wasmBytes))
  .then((wasmModule) => exec(options, wasmModule, stdinStream as any))
  .then((result) => {
    console.log(result.stdout)
    console.error(result.stderr)
    process.exit(result.status)
  })
