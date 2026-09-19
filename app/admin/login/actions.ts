'use server'

import auth from '@holo-js/auth'
import {validate} from '@holo-js/forms'
import {redirect} from 'next/navigation'
import {loginForm} from '@/app/admin/login/schema'
import {adminRedirectPath} from './redirect'

export async function loginAdminAction(formData: FormData, redirectTo: string) {
  const credentials = await validate(formData, loginForm, {throttle: 'login'})
  await auth.guard('admin').login(credentials)
  redirect(adminRedirectPath(redirectTo))
}
