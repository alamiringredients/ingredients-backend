import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {loadEnvFile} from 'node:process'
import {test} from 'node:test'
import {createConnection} from 'mysql2/promise'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {configureDB, createConnectionManager, createDialect, createMigrationService, DB, defineMigration, resetDB} from '@holo-js/db'
import {normalizeAuthorizationDecision} from '@holo-js/authorization'
import createAdmins from '../server/db/migrations/2026_09_12_000012_create_admins'
import normalizePermissions from '../server/db/migrations/2026_10_06_000001_normalize_role_permissions'
import adminAccess from '../server/abilities/admin-access'

const originalName = '2026_09_12_000012_create_admins'

test('upgrading an existing database preserves delegated grants without granting extra access', async () => {
  loadEnvFile('.env')
  const client = await createConnection({host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME || 'root', password: process.env.DB_PASSWORD})
  const database = `alamir_test_${randomUUID().replaceAll('-', '')}`
  try {
    await client.query(`CREATE DATABASE \`${database}\``)
    await client.query(`USE \`${database}\``)
    configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
    const legacy = defineMigration({
      name: originalName,
      async up({schema}) {
        await schema.createTable('roles', table => {
          table.id()
          table.string('name').unique()
          table.text('description').nullable()
          table.json('permissions')
          table.timestamps()
        })
        await schema.createTable('admins', table => {
          table.id()
          table.string('name')
          table.string('email').unique()
          table.string('password')
          table.bigInteger('role_id').nullable()
          table.boolean('is_primary_admin').default(false)
          table.string('auth_version').default('')
          table.timestamps()
        })
      },
    })
    await createMigrationService(DB.connection(), [legacy]).migrate()
    await client.query('INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?), (?, ?, ?)', [1, 'Reader', JSON.stringify({products: ['view'], news: ['view', 'edit']}), 2, 'No access', JSON.stringify({})])
    await client.query('INSERT INTO admins (id, name, email, password, role_id) VALUES (1, ?, ?, ?, 1), (2, ?, ?, ?, 2)', ['Reader', 'reader@example.test', 'unused', 'No access', 'none@example.test', 'unused'])
    const migrations = createMigrationService(DB.connection(), [
      {...createAdmins, name: originalName},
      {...normalizePermissions, name: '2026_10_06_000001_normalize_role_permissions'},
    ])
    for (const rollback of [false, true]) {
      if (rollback) await migrations.rollback({step: 1})
      await migrations.migrate()
      for (const [id, resource, action, allowed] of [[1, 'products', 'view', true], [1, 'products', 'edit', false], [1, 'news', 'edit', true], [1, 'roles', 'edit', false], [2, 'products', 'view', false]] as const) {
        const decision = await adminAccess.handle({authenticated: true, user: {id, auth_version: ''}}, {resource, action})
        assert.equal(normalizeAuthorizationDecision(decision).allowed, allowed, `${id}: ${resource}.${action}`)
      }
      assert.equal((await migrations.migrate()).length, 0)
    }
  } finally {
    resetDB()
    await client.query(`DROP DATABASE IF EXISTS \`${database}\``)
    await client.end()
  }
})
