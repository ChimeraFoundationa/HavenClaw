import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'havenclaw',
    root: './test',
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['**/*.d.ts', '**/node_modules/**']
    }
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@cli': new URL('./src/cli', import.meta.url).pathname,
      '@lib': new URL('./src/lib', import.meta.url).pathname,
      '@config': new URL('./src/config', import.meta.url).pathname
    },
    extensions: ['.ts', '.js']
  }
})
