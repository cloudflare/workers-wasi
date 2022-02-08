const { transformSync } = require('esbuild')

exports.process = (code, file) => {
  const options = {
    target: 'esnext',
    format: 'esm',
    loader: 'ts',
    sourcemap: 'inline',
    sourcefile: file,
  }
  return transformSync(code, options).code
}
