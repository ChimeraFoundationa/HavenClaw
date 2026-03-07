import { defineConfig } from 'tsdown'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/entry.ts', 'src/plugin-sdk/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
  dts: true,
  minify: false,
  external: [
    'node-llama-cpp',
    '@napi-rs/canvas',
    'open'
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  treeshake: true,
  splitting: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@cli': path.resolve(__dirname, 'src/cli'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@config': path.resolve(__dirname, 'src/config')
    }
  }
})
