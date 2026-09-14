import { defineDatabaseConfig } from '@holo-js/db'
import { env } from '@holo-js/config'

export default defineDatabaseConfig({
  defaultConnection: 'main',
  connections: {
    main: {
      driver: 'mysql',
      host: env('DB_HOST', '127.0.0.1'),
      port: env('DB_PORT', '3306'),
      username: env('DB_USERNAME', 'root'),
      password: env('DB_PASSWORD'),
      database: env('DB_DATABASE', 'alamir'),
    },
  },
})
