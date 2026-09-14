import assert from 'node:assert/strict'
import {test, beforeEach, after} from 'node:test'
import {build} from 'esbuild'
import {mkdtemp, rm} from 'node:fs/promises'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'

const directory = await mkdtemp(join(process.cwd(), '.security-test-'))
const outfile = join(directory, 'security.mjs')
await build({
  stdin: {contents: `export * from './app/admin/access-actions'; export * from './app/admin/change-password/actions'; export * from './server/admin/session'; export * from './lib/admin/access';`, resolveDir: process.cwd()},
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
  plugins: [{name: 'security-boundaries', setup(build) {
    build.onResolve({filter: /^@alamir\/forms\//}, ({path}) => ({path: join(process.cwd(), 'node_modules', path + '.ts')}))
    build.onResolve({filter: /^(@\/server\/models\/(Admin|Role)|@\/server\/admin\/(authorization|form-actions)|@holo-js\/auth(?:\/next\/server)?|@holo-js\/security|server-only)$/}, ({path}) => ({path, namespace: 'mock'}))
    build.onLoad({filter: /.*/, namespace: 'mock'}, ({path}) => ({contents: {
      'server-only': 'export {}',
      '@holo-js/auth/next/server': 'export async function auth(){return {user:globalThis.securityTest.user}}',
      '@holo-js/auth': 'export async function hashPassword(p){return "hash:"+p} export async function verifyPassword(p,h){return h === "hash:"+p}',
      '@holo-js/security': 'export async function rateLimit(){return {limited:false}}',
      '@/server/admin/authorization': 'export async function requireAdminPermission(){if(!globalThis.securityTest.user)throw Error("Unauthorized");return globalThis.securityTest.user}',
      '@/server/admin/form-actions': 'export function adminActionError(e){return {ok:false,message:e.message}} export async function redirectCreatedRecord(){}',
      '@/server/models/Admin': 'export default globalThis.securityTestModels.admins',
      '@/server/models/Role': 'export default globalThis.securityTestModels.roles',
    }[path]}))
    build.onResolve({filter: /^next\/cache$/}, () => ({path: 'cache', namespace: 'cache'}))
    build.onLoad({filter: /.*/, namespace: 'cache'}, () => ({contents: 'export function revalidatePath(){}'}))
  }}],
})

function model(table) {
  const query = (filters = []) => ({
    where(key, value) {return query([...filters, row => row[key] === value])},
    async firstJson() {return globalThis.securityTest[table].find(row => filters.every(filter => filter(row)))},
    async getJson() {return globalThis.securityTest[table].filter(row => filters.every(filter => filter(row)))},
    async findOrFail(id) {
      const row = globalThis.securityTest[table].find(row => row.id === id)
      if (!row) throw Error('Missing row')
      return {get: key => row[key], async update(values) {Object.assign(row, values)}, async delete() {globalThis.securityTest[table] = globalThis.securityTest[table].filter(item => item.id !== id)}}
    },
    async create(values) {const row = {id: 100, ...values}; globalThis.securityTest[table].push(row); return {get: key => row[key]}},
  })
  return query()
}
globalThis.securityTestModels = {admins: model('admins'), roles: model('roles')}
const security = await import(pathToFileURL(outfile).href)
after(() => rm(directory, {recursive: true, force: true}))
beforeEach(() => {
  globalThis.securityTest = {
    user: {id: 2, auth_version: ''},
    admins: [
      {id: 1, name: 'First admin', email: 'first@example.test', role_id: 1, is_primary_admin: true, auth_version: '', password: 'hash:existing-password'},
      {id: 2, name: 'Limited admin', email: 'limited@example.test', role_id: 2, is_primary_admin: false, auth_version: '', password: 'hash:existing-password'},
      {id: 3, name: 'Other super', email: 'other@example.test', role_id: 3, is_primary_admin: false, auth_version: ''},
    ],
    roles: [
      {id: 1, name: 'Super admin', permissions: security.fullRolePermissions()},
      {id: 2, name: 'Access editor', permissions: {admins: ['view', 'edit', 'create', 'delete'], roles: ['view', 'edit', 'create', 'delete']}},
      {id: 3, name: 'Other full access', permissions: security.fullRolePermissions()},
    ],
  }
})

test('a role editor cannot grant itself missing permissions', async () => {
  const result = await security.saveRoleAction(2, JSON.stringify({name: 'Access editor', description: '', permissions: security.fullRolePermissions()}))
  assert.equal(result.ok, false)
  assert.match(result.message, /cannot manage or grant/)
  assert.equal(globalThis.securityTest.roles[1].permissions.products, undefined)
})

test('an account editor cannot promote itself or create a Super admin', async () => {
  for (const id of [2, 0]) {
    const result = await security.saveAdminAction(id, JSON.stringify({name: 'Attempt', email: 'attempt@example.test', password: 'replacement-password', role_id: 1}))
    assert.equal(result.ok, false)
    assert.match(result.message, /cannot manage or grant/)
  }
  assert.equal(globalThis.securityTest.admins.length, 3)
  assert.equal(globalThis.securityTest.admins[1].role_id, 2)
})

test('even another full-access admin cannot edit, reset or delete the first admin or edit its role', async () => {
  globalThis.securityTest.user = {id: 3, auth_version: ''}
  const original = structuredClone(globalThis.securityTest.admins[0])
  const edit = await security.saveAdminAction(1, JSON.stringify({name: 'Changed', email: 'changed@example.test', password: 'replacement-password', role_id: 3}))
  const remove = await security.deleteAdminAction(1)
  const role = await security.saveRoleAction(1, JSON.stringify({name: 'Changed role', description: '', permissions: {products: ['view']}}))
  for (const result of [edit, remove, role]) {assert.equal(result.ok, false); assert.match(result.message, /first Super admin/)}
  assert.deepEqual(globalThis.securityTest.admins[0], original)
})

test('the first admin can edit its own account but cannot delete itself', async () => {
  globalThis.securityTest.user = {id: 1, auth_version: ''}
  assert.equal((await security.saveAdminAction(1, JSON.stringify({name: 'Updated first', email: 'first@example.test', password: '', role_id: 1}))).ok, true)
  assert.equal((await security.deleteAdminAction(1)).ok, false)
  assert.equal(globalThis.securityTest.admins[0].is_primary_admin, true)
})

test('delegated editors may create roles containing only permissions they already hold', async () => {
  assert.equal((await security.saveRoleAction(0, JSON.stringify({name: 'Reader', description: '', permissions: {admins: ['view']}}))).ok, true)
})

test('password changes invalidate old sessions and accept a newly authenticated session', async () => {
  const form = new FormData()
  for (const [key, value] of Object.entries({currentPassword: 'existing-password', password: 'replacement-password', passwordConfirmation: 'replacement-password'})) form.set(key, value)
  assert.ok(await security.getCurrentAdmin())
  assert.equal((await security.changePasswordAction(form)).ok, true)
  assert.equal(await security.getCurrentAdmin(), null)
  assert.equal((await security.changePasswordAction(form)).ok, false)
  globalThis.securityTest.user = {...globalThis.securityTest.admins[1]}
  assert.ok(await security.getCurrentAdmin())
})

test('administrator password resets invalidate the target session', async () => {
  globalThis.securityTest.user = {id: 1, auth_version: ''}
  assert.equal((await security.saveAdminAction(2, JSON.stringify({name: 'Limited admin', email: 'limited@example.test', password: 'replacement-password', role_id: 2}))).ok, true)
  globalThis.securityTest.user = {id: 2, auth_version: ''}
  assert.equal(await security.getCurrentAdmin(), null)
})

test('a deleted account cannot keep using its serialized session', async () => {
  globalThis.securityTest.admins.splice(1, 1)
  assert.equal(await security.getCurrentAdmin(), null)
})
