import { _FS } from 'workers-wasi'

export interface ExecOptions {
  args?: string[]
  asyncify: boolean
  env?: { [key: string]: string }
  fs: _FS
  moduleName: string
  preopens: string[]
  returnOnExit: boolean
  stdin?: string
}

export interface ExecResult {
  stdout: string
  status: number
}
