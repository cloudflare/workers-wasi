// @ts-check
import * as esbuild from 'esbuild'
import * as path from 'path'

const OUT_DIR = '../build/benchmark/'

/**
 * Node currently can't import wasm files in the way that we do with Workers, it either throws an
 * error if you try to import a wasm file or imports an instantiated wasm instance. Whereas in
 * Workers we get a WebAssembly.Module as the default export if we import a wasm file, so this
 * plugin is to replicate that behavior in the bundle.
 * @type {import('esbuild').Plugin}
 */
const wasmLoaderPlugin = {
  name: 'wasm-module-loader',
  setup: (build) => {
    build.onResolve({ filter: /\.wasm$/ }, (args) => ({
      path: args.path,
      namespace: 'wasm-module',
    }))

    build.onLoad({ filter: /.*/, namespace: 'wasm-module' }, (args) => ({
      contents: `
        import * as fs from 'fs';
        import * as path from 'path';
        import * as url from 'url';

        const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
        export default new WebAssembly.Module(fs.readFileSync(path.resolve(__dirname, '${args.path}')));
      `,
    }))
  },
}

esbuild.build({
  bundle: true,
  outfile: path.join(OUT_DIR, 'index.mjs'),
  format: 'esm',
  logLevel: 'warning',
  entryPoints: ['./index.ts'],
  plugins: [wasmLoaderPlugin],
  platform: 'node',
})
