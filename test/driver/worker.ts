import { ModuleTable } from '../../build/test/wasm-table'
import { ExecOptions, exec } from './common'

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
