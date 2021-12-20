import { Environment, _FS } from '@cloudflare/workers-wasi'

export interface ExecOptions {
  args?: string[]
  asyncify: boolean
  env?: Environment
  fs: _FS
  moduleName: string
  preopens: string[]
  returnOnExit: boolean
  stdin?: string
}

export interface ExecResult {
  stdout: string
  status?: number
}
