import { defineConfig } from 'tsup'

export default defineConfig([
  // Build principal (index.ts) em CJS + ESM
  {
    entry: ['src/index.ts'],
    target: 'node22',
    format: ['cjs', 'esm'],
    dts: true,
    external: ['koffi'],
    splitting: false,
    sourcemap: true,
    clean: true,
    esbuildOptions(options) {
      // import.meta.url é usado com fallback para __dirname em CJS
      options.logOverride = { 'empty-import-meta': 'silent' }
    },
  },
  // Worker (worker.ts) somente em ESM (usa top-level await)
  {
    entry: ['src/worker.ts'],
    target: 'node22',
    format: ['esm'], // Só ESM
    dts: true,
    external: ['koffi'],
    splitting: false,
    sourcemap: true,
    clean: false, // Não limpa para não apagar o build do index
  },
])
