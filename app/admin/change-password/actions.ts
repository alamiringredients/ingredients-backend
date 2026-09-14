'use server'

import {changePasswordForm} from '@/app/admin/change-password/schema'
import Admin from '@/server/models/Admin'
import { hashPassword,verifyPassword } from '@holo-js/auth'
import {getCurrentAdmin} from '@/server/admin/session'
import { isValidationException,validate } from '@holo-js/forms'
import {randomUUID} from 'node:crypto'
import { rateLimit } from '@holo-js/security'


export async function changePasswordAction(data:FormData) {
  const user = await getCurrentAdmin()
  if (!user) return {ok: false, message: 'Your session has expired. Sign in again.'}

  const attempt = await rateLimit('login', {key: `change-password:${user.id}`})
  if (attempt.limited) return {ok: false, message: `Too many attempts. Try again in ${attempt.retryAfterSeconds} seconds.`}

  let input:{currentPassword:string;password:string;passwordConfirmation:string}
  try{input=await validate(data,changePasswordForm)}catch(error){return {ok:false,message:'Please correct the highlighted fields.',errors:isValidationException(error)?error.errors.flatten():undefined}}
  const current=input.currentPassword,password=input.password,confirmation=input.passwordConfirmation
  if(password!==confirmation)return {ok:false,message:'Please correct the highlighted fields.',errors:{passwordConfirmation:['The new passwords do not match.']}}
  if(password===current)return {ok:false,message:'Please correct the highlighted fields.',errors:{password:['Choose a password different from your current password.']}}

  try {
    const admin = await Admin.findOrFail(Number(user.id))
    if(!await verifyPassword(current,String(admin.get('password'))))return {ok:false,message:'Please correct the highlighted fields.',errors:{currentPassword:['Your current password is incorrect.']}}
    await admin.update({password: await hashPassword(password), auth_version: randomUUID()})
    return {ok: true, message: 'Your password has been changed. Sign in again.'}
  } catch {
    return {ok: false, message: 'Could not change your password. Please try again.'}
  }
}
