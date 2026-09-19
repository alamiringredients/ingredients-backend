import assert from 'node:assert/strict'
import {test} from 'node:test'
import {accountRateLimitKey, publicRateLimitKey} from '../lib/security/rate-limit.mjs'
import {configureSecurityRuntime, createMemoryRateLimitStore, rateLimit, resetSecurityRuntime} from '@holo-js/security'

test('one anonymous visitor cannot exhaust another email address allowance', async () => {
  configureSecurityRuntime({config: {rateLimit: {limiters: {login: {maxAttempts: 5, decaySeconds: 60, key: accountRateLimitKey}}}}, rateLimitStore: createMemoryRateLimitStore()})
  try {
    const request = new Request('http://localhost/admin/login')
    for (let i = 0; i < 5; i++) await rateLimit('login', {request, values: {email: 'one@example.test'}})
    await assert.rejects(rateLimit('login', {request, values: {email: ' ONE@example.test '}}))
    await rateLimit('login', {request, values: {email: 'two@example.test'}})
  } finally {resetSecurityRuntime()}
})

test('public keys ignore spoofed forwarding headers unless explicitly trusted', () => {
  const previous = process.env.HOLO_SECURITY_TRUST_PROXY
  const context = {request: new Request('http://localhost/apply', {headers: {'x-forwarded-for': '192.0.2.1'}}), values: {email: 'one@example.test'}}
  try {
    process.env.HOLO_SECURITY_TRUST_PROXY = 'false'
    assert.equal(publicRateLimitKey(context), accountRateLimitKey(context))
    process.env.HOLO_SECURITY_TRUST_PROXY = 'true'
    assert.equal(publicRateLimitKey(context), 'ip:192.0.2.1')
    assert.throws(() => publicRateLimitKey({...context, request: new Request('http://localhost/apply', {headers: {'x-forwarded-for': 'fake, 192.0.2.1'}})}), /trusted client IP/)
  } finally {
    if (previous === undefined) delete process.env.HOLO_SECURITY_TRUST_PROXY
    else process.env.HOLO_SECURITY_TRUST_PROXY = previous
  }
})
