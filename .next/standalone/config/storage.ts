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
    r2: {
      driver: 's3',
      visibility: 'public',
      accessKeyId: env('STORAGE_DISKS_S3_ACCESS_KEY_ID'),
      secretAccessKey: env('STORAGE_DISKS_S3_SECRET_ACCESS_KEY'),
      region: env('STORAGE_DISKS_S3_REGION', 'auto'),
      bucket: env('STORAGE_DISKS_S3_BUCKET'),
      url: env('STORAGE_DISKS_S3_URL') || undefined,
      endpoint: env('STORAGE_DISKS_S3_ENDPOINT') || undefined,
      forcePathStyleEndpoint: env('STORAGE_DISKS_S3_FORCE_PATH_STYLE_ENDPOINT', false),
    },
  },
})
