import { defineCacheConfig } from '@holo-js/cache'
import { env } from '@holo-js/config'

export default defineCacheConfig({
  default: env('CACHE_DRIVER', 'file'),
  prefix: env('CACHE_PREFIX', ''),
  drivers: {
    file: {
      driver: 'file',
      path: './storage/framework/cache/data',
    },
    memory: {
      driver: 'memory',
      maxEntries: 1000,
    },
    redis: {
      driver: 'redis',
      connection: 'default',
    },
  },
})
