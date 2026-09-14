import '../.holo-js/generated/schema.generated'
import assert from 'node:assert/strict'
import {loadEnvFile} from 'node:process'
import {test} from 'node:test'
import {createConnection} from 'mysql2/promise'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {configureDB, createConnectionManager, createDialect, createSeederService, DB, resetDB} from '@holo-js/db'
import AdminSeeder from '../server/db/seeders/AdminSeeder'
import RolesSeeder from '../server/db/seeders/RolesSeeder'
import Admin from '../server/models/Admin'

test('the first seeded administrator is marked as primary', async () => {
  loadEnvFile('.env')
  const client = await createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'alamir',
  })

  try {
    for (const table of ['roles', 'admins']) {
      const [rows] = await client.query(`SHOW CREATE TABLE \`${table}\``)
      const ddl = (rows as Array<{'Create Table': string}>)[0]['Create Table']
        .replace('CREATE TABLE', 'CREATE TEMPORARY TABLE')
        .split('\n')
        .filter(line => !line.trimStart().startsWith('CONSTRAINT '))
        .join('\n')
        .replace(/,\n\)/, '\n)')
      await client.query(ddl)
    }

    configureDB(createConnectionManager({
      defaultConnection: 'main',
      connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}},
    }))
    const seeders = createSeederService(DB.connection(), [RolesSeeder, AdminSeeder])
    await seeders.seed({only: ['admin']})

    const admins = await Admin.getJson()
    assert.equal(admins.length, 1)
    assert.equal(admins[0].is_primary_admin, true)
  } finally {
    resetDB()
    await client.end()
  }
})
