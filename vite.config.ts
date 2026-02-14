import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json'
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactPdfHighlighter',
      fileName: (format) => `react-pdf-highlighter.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-pdf'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-pdf': 'ReactPDF',
        },
      },
    },
  },
})
