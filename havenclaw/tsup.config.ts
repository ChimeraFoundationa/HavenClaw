import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/entry.ts', 'src/plugin-sdk/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
  dts: true,
  minify: false,
  external: ['node-llama-cpp', '@napi-rs/canvas', 'open'],
  treeshake: true,
  splitting: false,
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
})
