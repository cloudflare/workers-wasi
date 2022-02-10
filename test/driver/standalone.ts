import { ModuleTable } from '../../build/test/benchmark-wasm-table'
import { exec, ExecOptions } from './common'

const [moduleName, rawOptions] = process.argv.slice(2)
const options = JSON.parse(rawOptions)

exec(options, ModuleTable[moduleName]).then((result) => {
  console.log(result.stdout)
  console.error(result.stderr)
  process.exit(result.status)
})
