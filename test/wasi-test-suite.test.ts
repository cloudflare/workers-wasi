import fs from 'fs/promises'
import path from 'path'
import * as utils from './utils'
import type { Environment } from '@cloudflare/workers-wasi'

interface Config {
  env?: Environment
  status?: number
  stdin?: string
  stdout?: string
  args?: string[]
}

const parseEnvironment = (x: string): Environment => {
  return Object.fromEntries(
    x
      .trim()
      .split('\n')
      .map((line) => {
        return line.split('=')
      })
  )
}

const parseStatus = (x: string): number => {
  return parseInt(x)
}

const parseArgs = (x: string): string[] => {
  const s = x.trim()
  return s ? s.split('\n') : []
}

const readConfig = async (file: string): Promise<Config> => {
  const mapContents = async <T>(
    ext: string,
    parse: (x: string) => T = (x: any) => x
  ): Promise<T | undefined> => {
    const x = await utils.maybeReadContents(utils.withExtension(file, ext))
    if (x !== undefined) {
      return parse(x)
    }
    return undefined
  }

  return {
    env: await mapContents('.env', parseEnvironment),
    stdin: await mapContents('.stdin'),
    stdout: await mapContents('.stdout'),
    status: await mapContents('.status', parseStatus),
    args: await mapContents('.arg', parseArgs),
  }
}

const generateTestCases = async (
  fixture: utils.TestEnv,
  asyncify: boolean,
  dir: string
) => {
  const wasmFiles = await utils.filesWithExt(dir, '.wasm')
  for (const file of wasmFiles) {
    const absFile = path.resolve(path.join(dir, file))
    const config = await readConfig(absFile)
    const args = config.args
    if (args != undefined) {
      args.unshift(file)
    }

    const moduleName = path.join('wasi-test-suite', path.basename(dir), file)

    const preopensDir = path.basename(utils.withExtension(file, '.dir'))
    const fs = await utils.readfs(utils.withExtension(absFile, '.dir'))
    test(moduleName, async () => {
      const result = await fixture.exec({
        preopens: ['/' + preopensDir],
        fs,
        asyncify,
        args,
        env: config.env,
        moduleName,
        stdin: config.stdin,
        returnOnExit: config.status !== undefined,
      })
      if (config.status) {
        expect(result.status).toBe(config.status)
      }
      if (config.stdout) {
        expect(result.stdout).toBe(config.stdout)
      }
    })
  }
}

await utils.withEnv(async (fixture: utils.TestEnv) => {
  await generateTestCases(fixture, true, '../deps/wasi-test-suite/libc/')
  await generateTestCases(fixture, true, '../deps/wasi-test-suite/libstd/')

  // assemblyscript tests not compatible with default asyncify memory layout
  await generateTestCases(fixture, false, '../deps/wasi-test-suite/core/')
})
