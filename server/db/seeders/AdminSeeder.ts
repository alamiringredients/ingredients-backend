import {hashPassword} from '@holo-js/auth'
import {defineSeeder} from '@holo-js/db'
import Admin from '@/server/models/Admin'
import Role from '@/server/models/Role'

export default defineSeeder({
  name: 'admin',
  async run({call}) {
    await call('roles')
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@admin.com'
    const existing = await Admin.where('email', email).firstJson()
    if (existing) return
    const role = await Role.where('name', 'Super admin').firstJson()
    if (!role) throw new Error('Seed the Super admin role first.')
    const production = (process.env.APP_ENV || process.env.NODE_ENV) === 'production'
    const password = process.env.SEED_ADMIN_PASSWORD || (production ? '' : 'password')
    if (!password) throw new Error('Set SEED_ADMIN_PASSWORD to create the first production administrator.')
    const first = !await Admin.firstJson()
    const admin = await Admin.create({email, name: 'Administrator', password: await hashPassword(password), role_id: Number(role.id)})
    if (first) {
      await Admin.unguarded(async () => {
        admin.forceFill({is_primary_admin: true})
        await admin.save()
      })
    }
  },
})
