import { createTable } from './index.mjs'

await createTable((f) => f.startsWith('benchmark'))
