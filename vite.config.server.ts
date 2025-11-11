import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { builtinModules } from 'module';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  //NOTE: css section should match client config
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      scopeBehaviour: 'local',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@/client/styles/variables.scss' as *;`,
      },
    },
  },
  build: {
    ssr: true,
    target: 'esnext',
    outDir: 'dist/server',
    rollupOptions: {
      input: './src/server/main.ts',
      output: {
        format: 'es',
        entryFileNames: '[name].js',
      },
      external: [
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        'express',
        'fsevents',
        'chokidar',
      ],
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
});
