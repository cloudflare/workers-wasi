import path from 'path'
import fs from 'fs/promises'

export const recurseFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(async (dirent) => {
        if (dirent.isDirectory()) {
          return recurseFiles(path.join(dir, dirent.name))
        }
        if (!dirent.name.endsWith('.wasm')) {
          return []
        }

        return [path.resolve(dir, dirent.name)]
      })
    )
  ).flat()
}
