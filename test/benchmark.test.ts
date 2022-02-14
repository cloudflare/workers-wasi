import * as child from 'node:child_process'
import * as fs from 'node:fs'
import { cwd } from 'node:process'
import path from 'path/posix'
import type { ExecOptions } from './driver/common'

const { OUTPUT_DIR } = process.env
const moduleNames = fs
  .readdirSync(`${OUTPUT_DIR}/benchmark`)
  .map((dirent) => `benchmark/${dirent}`)

for (const modulePath of moduleNames) {
  const prettyName = modulePath.split('/').pop()
  if (!prettyName) throw new Error('unreachable')

  test(`${prettyName}`, async () => {
    const execOptions: ExecOptions = {
      moduleName: prettyName,
      asyncify: prettyName.endsWith('.asyncify.wasm'),
      fs: {},
      preopens: [],
      returnOnExit: false,
    }

    // Spawns a child process that runs the wasm so we can isolate the profiling to just that
    // specific test case.
    const proc = child.execFile(
      `node`,
      [
        '--experimental-vm-modules',
        '--cpu-prof',
        '--cpu-prof-dir=./prof',
        `--cpu-prof-name=${prettyName}.${Date.now()}.cpuprofile`,
        'standalone.mjs',
        modulePath,
        JSON.stringify(execOptions),
      ],
      {
        encoding: 'utf8',
        cwd: OUTPUT_DIR,
      }
    )

    let stderr = ''
    proc.stderr?.on('data', (data) => (stderr += data))

    const exitCode = await new Promise((resolve) => proc.once('exit', resolve))

    if (exitCode !== 0) {
      console.error(`Child process exited with code ${exitCode}:\n${stderr}`)
    }
  })
}
