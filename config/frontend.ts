import {defineConfig, env} from '@holo-js/config'

export default defineConfig({
  url: env('FRONTEND_URL', 'http://localhost:3000'),
})
