import path from 'path'
import { withEnv, TestEnv, filesWithExt } from './utils'

const todos = new Set([
  'wasmtime/dangling_symlink.wasm',
  'wasmtime/fd_readdir.wasm',
  'wasmtime/file_unbuffered_write.wasm',
  'wasmtime/interesting_paths.wasm',
  'wasmtime/nofollow_errors.wasm',
  'wasmtime/path_exists.wasm',
  'wasmtime/path_filestat.wasm',
  'wasmtime/path_link.wasm',
  'wasmtime/path_symlink_trailing_slashes.wasm',
  'wasmtime/poll_oneoff_files.wasm',
  'wasmtime/poll_oneoff_stdio.wasm',
  'wasmtime/readlink.wasm',
  'wasmtime/symlink_create.wasm',
  'wasmtime/symlink_filestat.wasm',
  'wasmtime/symlink_loop.wasm',
])

await withEnv(async (fixture: TestEnv) => {
  const dir = '../build/test/wasmtime/'
  const files = await filesWithExt(dir, '.wasm')
  for (const file of files) {
    const name = path.join(path.basename(dir), file)
    const fn = todos.has(name) ? test.skip : test
    fn(name, async () => {
      await fixture.exec({
        preopens: ['/tmp'],
        fs: {
          '/tmp/.gitkeep': '',
        },
        asyncify: false,
        args: [file, '/tmp'],
        moduleName: name,
        returnOnExit: false,
      })
    })
  }
})
