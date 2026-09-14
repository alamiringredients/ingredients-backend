import {defineSeeder} from '@holo-js/db'
import User from '@/server/models/User'

export default defineSeeder({
  name: 'users',
  async run() {
    if ((process.env.APP_ENV || process.env.NODE_ENV) === 'production') return
    // The website's web guard is separate from the admin dashboard guard.
    // This sample has no password and cannot be used to sign in.
    await User.firstOrCreate({email: 'user@example.test'}, {name: 'Example User', password: null, avatar: null})
  },
})
