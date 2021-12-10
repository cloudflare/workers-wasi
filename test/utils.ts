import { Miniflare } from 'miniflare'
import { Buffer } from 'buffer'
import { ExecOptions, ExecResult } from './driver/common'
import fs from 'fs/promises'
import path from 'path'
import type { _FS } from 'workers-wasi'

export class TestEnv {
  #mf: Miniflare

  constructor(mf: Miniflare) {
    this.#mf = mf
  }

  async exec(config: ExecOptions): Promise<ExecResult> {
    const response = await this.#mf.dispatchFetch('http://localhost:8787', {
      body: config.stdin,
      method: 'POST',
      headers: {
        EXEC_OPTIONS: Buffer.from(JSON.stringify(config)).toString('base64'),
      },
    })
    const body = await response.text()
    return JSON.parse(body)
  }
}

export const withEnv = async (callback: (env: TestEnv) => Promise<void>) => {
  const mf = new Miniflare({
    wranglerConfigPath: './driver/wrangler.toml',
  })

  await callback(new TestEnv(mf))
  await mf.dispose()
}

export const filesWithExt = async (
  dir: string,
  ext: string
): Promise<string[]> => {
  const files = await fs.readdir(dir)
  return files.filter((path) => path.endsWith(ext))
}

async function mapENOENT<T>(f: () => Promise<T>): Promise<T | undefined> {
  try {
    return await f()
  } catch (e) {
    if ((e as any).code === 'ENOENT') {
      return Promise.resolve(undefined)
    }
    throw e
  }
}

export const maybeReadContents = async (
  file: string
): Promise<string | undefined> => {
  return mapENOENT(async () => {
    return new TextDecoder().decode(await fs.readFile(file))
  })
}

export const withExtension = (file: string, ext: string) => {
  const basename = path.basename(file, path.extname(file))
  return path.join(path.dirname(file), basename + ext)
}

const recurseFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(async (dirent): Promise<string[]> => {
        if (dirent.isDirectory()) {
          return recurseFiles(path.join(dir, dirent.name))
        }

        return [path.join(dir, dirent.name)]
      })
    )
  ).flat()
}

export const readfs = async (dir: string): Promise<_FS> => {
  const prefix = path.dirname(dir)
  const files = await mapENOENT(async () => await recurseFiles(dir))
  if (files === undefined) {
    return {}
  }

  const result = Object.fromEntries(
    await Promise.all(
      files.map(async (file) => {
        const contents = await fs.readFile(file)
        const resolved = file.substr(prefix.length)
        return [resolved, contents.toString('utf8')]
      })
    )
  )
  return result
}
