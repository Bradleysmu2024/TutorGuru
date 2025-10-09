import { defineConfig, loadEnv  } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      vue(),
      Components({
        resolvers: [BootstrapVueNextResolver()]
      })
    ],
    define: {
      'process.env': env // This makes process.env available in your app
    },
  }
})
