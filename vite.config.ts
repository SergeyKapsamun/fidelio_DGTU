import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isSingleFileBuild = mode === 'single'

  return {
    base: isSingleFileBuild ? './' : '/calendar/',
    plugins: [vue(), isSingleFileBuild && viteSingleFile()].filter(Boolean),
    build: isSingleFileBuild
      ? {
          assetsInlineLimit: 100000000,
          chunkSizeWarningLimit: 100000000,
          cssCodeSplit: false,
          copyPublicDir: false,
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        }
      : undefined,
  }
})
