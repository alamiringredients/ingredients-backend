import { isValidationException } from '@holo-js/forms'
import { redirect,unstable_rethrow } from 'next/navigation'
import 'server-only'
import type { AdminResource } from '@/lib/admin/access'
import { getAdminResourceCapabilities } from '@/server/admin/authorization'

export function adminActionError(error:unknown) {
  unstable_rethrow(error)
  if(isValidationException(error))return {ok:false,message:'Please correct the highlighted fields.',errors:error.errors.flatten()}
  return {ok:false,message:error instanceof Error?error.message:'The request failed. Please try again.'}
}

export async function redirectCreatedRecord(originalId:number,savedId:number,basePath:string,resource:AdminResource){
  if(originalId)return
  const capabilities=await getAdminResourceCapabilities(resource)
  redirect(capabilities.edit?`${basePath}/${savedId}/edit`:basePath)
}
