import { WASI, traceImportsToConsole } from '@cloudflare/workers-wasi'
import { ModuleTable } from '../../build/test/wasm-table'
import { ExecOptions, ExecResult } from './common'

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
    new Response(stdout.readable).text(),
    new Response(stderr.readable).text(),
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

export default {
  async fetch(request: Request) {
    const options: ExecOptions = JSON.parse(
      atob(request.headers.get('EXEC_OPTIONS')!)
    )

    const result = await exec(
      options,
      ModuleTable[options.moduleName],
      request.body ?? undefined
    )
    return new Response(JSON.stringify(result))
  },
}
