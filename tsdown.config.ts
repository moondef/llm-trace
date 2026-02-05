import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli/index.ts',
    standalone: 'src/server/standalone.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  platform: 'node',
  clean: true,
  fixedExtension: false,
})
