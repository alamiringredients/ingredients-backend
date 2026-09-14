import { defineAuthConfig } from '@holo-js/auth'

export default defineAuthConfig({
  defaults: {
    guard: 'web',
    passwords: 'users',
  },
  guards: {
    web: {
      driver: 'session',
      provider: 'users',
    },
    admin: {
      driver: 'session',
      provider: 'admins',
    },
  },
  providers: {
    users: {
      model: 'User',
      identifiers: ['email'],
    },
    admins: {
      model: 'Admin',
      identifiers: ['email'],
    },
  },
  passwords: {
    users: {
      provider: 'users',
      table: 'password_reset_tokens',
      expire: 60,
      throttle: 60,
      route: '/reset-password',
    },
  },
  emailVerification: {
    required: false,
    route: '/verify-email',
  },
})
