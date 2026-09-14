'use server'

import auth from '@holo-js/auth'
import {validate} from '@holo-js/forms'
import {redirect} from 'next/navigation'
import {loginForm} from '@/app/login/schema'

export async function loginAdminAction(formData: FormData) {
  const credentials = await validate(formData, loginForm, {throttle: 'login'})
  await auth.guard('admin').login(credentials)
  redirect('/admin')
}
