import { defineConfig, loadEnv  } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      vue()
    ],
    define: {
      'process.env': env
    },
    preview: {
      allowedHosts: ['dodieboy.codes']
    },
  }
})
