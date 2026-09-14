import 'server-only'
import {auth} from '@holo-js/auth/next/server'
import Admin from '@/server/models/Admin'
import {adminSessionMatches} from '@/lib/admin/session'

export async function getCurrentAdmin() {
  const {user} = await auth({guard: 'admin'})
  if (!user) return null
  const id = Number(user.id)
  if (!Number.isSafeInteger(id) || id < 1) return null
  const current = await Admin.where('id', id).firstJson()
  return adminSessionMatches(user, current) ? user : null
}
