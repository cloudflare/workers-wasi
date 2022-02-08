import { ReadableStream, TransformStream } from 'node:stream/web'
import { WASI } from '@cloudflare/workers-wasi'
import { ExecOptions, ExecResult } from './common'

// @ts-ignore the file might not always exist, so we'll just supress any errors.
import { ModuleTable } from '../build/benchmark/wasm-table'

const exec = async (
  options: ExecOptions,
  wasm: WebAssembly.Module,
  body?: ReadableStream<any>
): Promise<ExecResult> => {
  const stdout = new TransformStream()
  const stderr = new TransformStream()

  const wasi = new WASI({
    args: options.args,
    env: options.env,
    fs: options.fs,
    preopens: options.preopens,
    returnOnExit: options.returnOnExit,
    stderr: stderr.writable,
    stdin: body,
    stdout: stdout.writable,
    streamStdio: options.asyncify,
  })

  const instance = new WebAssembly.Instance(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
  })
  const promise = wasi.start(instance)

  const streams = await Promise.all([
    collectStream(stdout.readable),
    collectStream(stderr.readable),
  ])

  try {
    const result = {
      stdout: streams[0],
      stderr: streams[1],
      status: await promise,
    }

    return result
  } catch (e: any) {
    e.message = `${e}\n\nstdout:\n${streams[0]}\n\nstderr:\n${streams[1]}\n\n`
    throw e
  }
}

async function collectStream(stream: ReadableStream): Promise<string> {
  const chunks = []

  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  return new TextDecoder().decode(Buffer.concat(chunks))
}

const [moduleName, rawOptions] = process.argv.slice(2)
const options = JSON.parse(rawOptions)

exec(options, ModuleTable[moduleName]).then((result) => {
  console.log(result.stdout)
  console.error(result.stderr)
  process.exit(result.status)
})
