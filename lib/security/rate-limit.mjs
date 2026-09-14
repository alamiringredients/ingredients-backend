import {createHash} from 'node:crypto'
import {isIP} from 'node:net'

/** @param {import('@holo-js/security/config').SecurityRateLimitContext} context */
export function accountRateLimitKey({values}) {
  const email = typeof values?.email === 'string' ? values.email.trim().toLowerCase() : ''
  return `email:${createHash('sha256').update(email).digest('hex')}`
}

/** @param {import('@holo-js/security/config').SecurityRateLimitContext} context */
export function publicRateLimitKey(context) {
  // Enable only behind an ingress which replaces, rather than appends, this header.
  if (process.env.HOLO_SECURITY_TRUST_PROXY === 'true') {
    const address = context.request.headers.get('x-forwarded-for')?.trim() ?? ''
    if (!isIP(address)) throw new Error('A trusted client IP is required.')
    return `ip:${address}`
  }
  // Next's Request has no socket address. Use the submitted identity instead of
  // pooling all anonymous visitors into Holo's default ip:unknown bucket.
  return accountRateLimitKey(context)
}
