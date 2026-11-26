import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

// Default build produces the demo app. `vite build --mode lib` builds the
// publishable library bundle into dist-lib/.
export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      plugins: [react(), dts({ include: ['src/index.ts', 'src/PullToRefresh.tsx', 'src/usePullToRefresh.ts'] })],
      build: {
        outDir: 'dist-lib',
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'PullJSReact',
          formats: ['es'],
          fileName: 'pulljs-react',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
      },
    };
  }
  return {
    base: './',
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
  };
});
