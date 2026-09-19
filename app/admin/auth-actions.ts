'use server'

import auth from '@holo-js/auth'
import {validate} from '@holo-js/forms'
import {logoutForm} from '@/app/admin/login/schema'
import {redirect} from 'next/navigation'

export async function logoutAdminAction(formData: FormData) {
  await validate(formData, logoutForm)
  await auth.guard('admin').logout()
  redirect('/admin/login')
}
