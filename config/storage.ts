import { defineStorageConfig } from '@holo-js/storage'
import { env } from '@holo-js/config'

export default defineStorageConfig({
  defaultDisk: env('STORAGE_DEFAULT_DISK', 'public'),
  routePrefix: env('STORAGE_ROUTE_PREFIX', '/storage'),
  disks: {
    applications: {driver:'local',root:'./storage/app/applications',visibility:'private'},
    local: {
      driver: 'local',
      root: './storage/app',
    },
    public: {
      driver: 'public',
      root: './storage/app/public',
      visibility: 'public',
    },
  },
})
