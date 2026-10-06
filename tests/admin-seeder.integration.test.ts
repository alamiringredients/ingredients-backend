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
import Role from '../server/models/Role'
import adminAccess from '../server/abilities/admin-access'
import {normalizeAuthorizationDecision} from '@holo-js/authorization'
import {getAdminEditorData, getRoleEditorData} from '../server/admin/access-data'
import {adminResources, adminActions, fullRolePermissions, permissionsFromRows} from '../lib/admin/access'

test('admin bootstrap grants every Super admin ability and keeps delegated access scoped', async () => {
  loadEnvFile('.env')
  const client = await createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'alamir',
  })

  try {
    for (const table of ['roles', 'role_permissions', 'admins']) {
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

    const role = (await Role.with('permissions').getJson())[0]
    assert.deepEqual(permissionsFromRows(role.permissions), fullRolePermissions())
    await DB.table('role_permissions').where('role_id', role.id).where('resource', 'products').delete()
    await seeders.seed({only: ['admin']})
    const permissions = permissionsFromRows((await Role.with('permissions').getJson())[0].permissions)
    assert.deepEqual(permissions, fullRolePermissions())
    assert.deepEqual(permissions.roles, ['view', 'create', 'edit', 'delete'])

    const superAdmin = await Admin.create({name: 'Second super admin', email: 'second-super@example.test', password: 'unused', role_id: role.id})
    const actor = {id: Number(superAdmin.get('id')), auth_version: ''}
    for (const {key: resource} of adminResources) for (const action of adminActions) {
      const decision = await adminAccess.handle({user: actor, authenticated: true}, {resource, action})
      assert.equal(normalizeAuthorizationDecision(decision).allowed, true, `${resource}.${action}`)
    }
    const readerRole = await Role.create({name: 'Reader', description: ''})
    await DB.table('role_permissions').insert({role_id: Number(readerRole.get('id')), resource: 'home_sections', action: 'view'})
    await seeders.seed({only: ['roles']})
    const reader = await Admin.create({name: 'Reader', email: 'reader@example.test', password: 'unused', role_id: Number(readerRole.get('id'))})
    const readerActor = {id: Number(reader.get('id')), auth_version: ''}
    for (const [resource, action, allowed] of [['home_sections', 'view', true], ['home_sections', 'edit', false], ['media', 'view', false]] as const) {
      const decision = await adminAccess.handle({user: readerActor, authenticated: true}, {resource, action})
      assert.equal(normalizeAuthorizationDecision(decision).allowed, allowed)
    }
    const stale = await adminAccess.handle({user: {...actor, auth_version: 'expired'}, authenticated: true}, {resource: 'media', action: 'view'})
    assert.equal(normalizeAuthorizationDecision(stale).allowed, false)

    const adminEditor = await getAdminEditorData(Number(reader.get('id')))
    assert.equal(adminEditor.initialAdmin?.email, 'reader@example.test')
    assert.ok(adminEditor.roles.every(option => Object.keys(option).sort().join(',') === 'id,name'))
    assert.equal('admins' in adminEditor, false)
    const roleEditor = await getRoleEditorData(Number(readerRole.get('id')))
    assert.deepEqual(roleEditor?.permissions.home_sections, ['view'])
    assert.equal(roleEditor && 'admins' in roleEditor, false)
    assert.equal((await getAdminEditorData()).initialAdmin, null)
  } finally {
    resetDB()
    await client.end()
  }
})
