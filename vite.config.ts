import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        background: './src/background.ts',
        content: './src/content.ts',
        sidepanel: './src/sidepanel.ts',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/sidepanel.html',
          dest: '.',
        },
        {
          src: 'src/styles/*',
          dest: 'styles',
        },
        {
          src: 'icons/*',
          dest: 'icons',
        },
        {
          src: 'manifest.json',
          dest: '.',
        },
        {
          src: 'node_modules/tesseract.js/dist/worker.min.js',
          dest: 'workers',
          rename: 'worker.min.js',
        },
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          dest: 'workers',
          rename: 'pdf.worker.min.js',
        },
        {
          src: 'node_modules/tesseract.js-core/tesseract-core-lstm.js',
          dest: 'core',
        },
        {
          src: 'node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js',
          dest: 'core',
        },
        {
          src: 'node_modules/tesseract.js-core/tesseract-core-lstm.wasm',
          dest: 'core',
        },
      ],
    }),
  ],
});
