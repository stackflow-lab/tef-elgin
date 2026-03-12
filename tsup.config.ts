import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node22',
  format: ['cjs', 'esm'],
  dts: true,
  external: ['koffi'],
  splitting: false,
  sourcemap: true,
  clean: true,
})
