import assert from 'node:assert/strict'
import {test, after, beforeEach} from 'node:test'
import {build} from 'esbuild'
import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'

const directory = await mkdtemp(join(tmpdir(), 'alamir-password-'))
const outfile = join(directory, 'action.mjs')
await build({
  entryPoints: ['app/admin/change-password/actions.ts'], outfile, bundle: true, platform: 'node', format: 'esm',
  plugins: [{name: 'password-boundaries', setup(build) {
    build.onResolve({filter: /^(@holo-js\/(?:auth|security)|@\/server\/models\/Admin|@\/server\/admin\/session)/}, args => ({path: args.path, namespace: 'mock'}))
    build.onLoad({filter: /.*/, namespace: 'mock'}, ({path}) => ({contents: {
      '@/server/admin/session': 'export async function getCurrentAdmin() {return globalThis.passwordTest.user}',
      '@holo-js/auth/next/server': 'export async function auth() {return {user:globalThis.passwordTest.user}}',
      '@holo-js/auth': 'export async function verifyPassword(p,d) {return p === "existing-password" && d === "stored-digest"} export async function hashPassword(p) {return "hashed:" + p}',
      '@holo-js/security': 'export async function rateLimit() {return {limited:globalThis.passwordTest.limited,retryAfterSeconds:60}}',
      '@/server/models/Admin': 'export default {async findOrFail(id) {globalThis.passwordTest.lookups.push(id); return {get:() => "stored-digest",update:async values => globalThis.passwordTest.updates.push(values)}}}',
    }[path]}))
  }}],
})
const {changePasswordAction} = await import(pathToFileURL(outfile).href)
after(() => rm(directory, {recursive: true, force: true}))
beforeEach(() => {globalThis.passwordTest = {user: {id: 7}, limited: false, lookups: [], updates: []}})
async function submit(overrides = {}) {
  const form = new FormData()
  for (const [key, value] of Object.entries({currentPassword: 'existing-password', password: 'replacement-password', passwordConfirmation: 'replacement-password', ...overrides})) form.set(key, value)
  return changePasswordAction(form)
}
test('requires an authenticated admin', async () => {
  globalThis.passwordTest.user = null
  assert.equal((await submit()).ok, false)
  assert.deepEqual(globalThis.passwordTest.lookups, [])
})
test('throttles attempts before checking passwords', async () => {
  globalThis.passwordTest.limited = true
  assert.match((await submit()).message, /Too many attempts/)
  assert.deepEqual(globalThis.passwordTest.lookups, [])
})
test('rejects mismatched confirmation', async () => {
  assert.equal((await submit({passwordConfirmation: 'different'})).ok, false)
  assert.deepEqual(globalThis.passwordTest.updates, [])
})
test('rejects short and excessively long passwords', async () => {
  for (const password of ['short', 'x'.repeat(129)]) assert.equal((await submit({password, passwordConfirmation: password})).ok, false)
  assert.deepEqual(globalThis.passwordTest.updates, [])
})
test('rejects incorrect current password without writing', async () => {
  assert.match((await submit({currentPassword: 'wrong-password'})).errors.currentPassword[0], /incorrect/)
  assert.deepEqual(globalThis.passwordTest.updates, [])
})
test('does not reuse the current password', async () => {
  assert.equal((await submit({password: 'existing-password', passwordConfirmation: 'existing-password'})).ok, false)
  assert.deepEqual(globalThis.passwordTest.updates, [])
})
test('updates only the authenticated admin and stores a hash', async () => {
  assert.equal((await submit({id: '999'})).ok, true)
  assert.deepEqual(globalThis.passwordTest.lookups, [7])
  assert.equal(globalThis.passwordTest.updates.length, 1)
  assert.equal(globalThis.passwordTest.updates[0].password, 'hashed:replacement-password')
  assert.match(globalThis.passwordTest.updates[0].auth_version, /^[0-9a-f-]{36}$/)
})
