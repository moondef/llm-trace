import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    platform: 'neutral',
    clean: true,
    fixedExtension: false,
  },
  {
    entry: {
      cli: 'src/cli/index.ts',
      standalone: 'src/server/standalone.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    platform: 'node',
    clean: true,
    fixedExtension: false,
  },
])
