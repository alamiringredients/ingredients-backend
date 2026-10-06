'use server'
import {storeMediaPaths} from '@/server/support/media-references'

import { requireAdminPermission } from '@/server/admin/authorization'
import {adminActionError,redirectCreatedRecord} from '@/server/admin/form-actions'
import type { ApplicationStatus } from '@/lib/careers/contracts'
import { validateAbout,validateCareersPage,validateJob } from '@/lib/careers/validation'
import { getWebsiteSettings } from '@/server/services/cms/content'
import { contentUrl } from '@/lib/editor/document'
import {applicationReplyForm, applicationStatusForm} from '@/app/admin/career-schema'
import ApplicationReplyMail from '@/server/mail/application-reply'
import CareerApplication from '@/server/models/CareerApplication'
import CareerJob from '@/server/models/CareerJob'
import CareerReply from '@/server/models/CareerReply'
import NewsArticle from '@/server/models/NewsArticle'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import { config } from '@holo-js/config'
import { validate } from '@holo-js/forms'
import { sendMail } from '@holo-js/mail'
import { Storage } from '@holo-js/storage/runtime'
import { revalidatePath } from 'next/cache'
const error=adminActionError
export async function saveJob(id:number,payload:string){const originalId=id;try{
 if(!Number.isSafeInteger(id)||id<0)throw new Error('Invalid job.')
 await requireAdminPermission('career_jobs',id?'edit':'create')
 const parsed=JSON.parse(payload)
 const value=validateJob(parsed),duplicate=await CareerJob.where('slug',value.slug).firstJson()
 if(duplicate&&Number(duplicate.id)!==id)return {ok:false,message:'Please correct the highlighted fields.',errors:{slug:['This slug is already used.']}}
 if(id)await (await CareerJob.findOrFail(id)).update(await storeMediaPaths(value));else id=Number((await CareerJob.create(await storeMediaPaths(value))).id)
 await redirectCreatedRecord(originalId,id,'/admin/careers','career_jobs');return {ok:true,message:'Job saved.',id}
}catch(e){return error(e)}}
export async function deleteJob(id:number){try{await requireAdminPermission('career_jobs','delete');await (await CareerJob.findOrFail(id)).delete();return {ok:true,message:'Job deleted. Existing applications are retained.'}}catch(e){return error(e)}}
export async function saveEditorialPage(page:'about'|'careers'|'quality',payload:string){try{
 if(!['about','careers','quality'].includes(page))throw new Error('Unknown page.')
 await requireAdminPermission(`${page}_page`,'edit')
 const parsed=JSON.parse(payload)
 const value=page==='careers'?validateCareersPage(parsed):validateAbout(parsed)
 if(page==='careers'&&'newsIds' in value){
  for(const id of value.newsIds)if(!await NewsArticle.find(id))throw new Error('A selected News article no longer exists.')
 }
 value.seo.socialImage=contentUrl(value.seo.socialImage,true)
 await WebsiteSetting.updateOrCreate({setting_key:page},{value:await storeMediaPaths(value)});return {ok:true,message:'Page saved.'}
}catch(e){return error(e)}}
export async function setApplicationStatus(data:FormData){try{
 const input=await validate(data,applicationStatusForm),id=Number(input.applicationId),status=input.status as ApplicationStatus
 await requireAdminPermission('career_applications','edit');if(!['pending','accepted','declined'].includes(status))throw new Error('Invalid status.')
 await (await CareerApplication.findOrFail(id)).update({status});revalidatePath('/admin','layout');return {ok:true,message:'Status updated.'}
}catch(e){return error(e)}}
export async function deleteApplication(id:number){try{
 await requireAdminPermission('career_applications','delete');const row=await CareerApplication.findOrFail(id)
 await Storage.disk('applications').delete(row.cv_path);await row.delete();revalidatePath('/admin','layout');return {ok:true,message:'Application deleted.'}
}catch(e){return error(e)}}
export async function replyToApplication(data:FormData){
 try{
  const input=await validate(data,applicationReplyForm),id=Number(input.applicationId),subject=input.subject,body=input.body,key=input.key
  await requireAdminPermission('career_applications','edit')
  const application=await CareerApplication.findOrFail(id)
  const existing=await CareerReply.where('request_key',key).firstJson()
  if(existing)return {ok:existing.status==='sent',message:existing.status==='sent'?'Reply already sent.':'This reply was already attempted. Check its delivery status.'}
  const row=await CareerReply.create({application_id:id,subject,body,status:'sending',request_key:key})
  try{
   const settings=await getWebsiteSettings()
   const brandName=settings.siteName.en
   const mail=ApplicationReplyMail({to:application.email,subject,body,brandName,logo:settings.logo,appUrl:config('app.url')})
   const sent=await sendMail(mail)
   await row.update({status:'sent',message_id:sent.messageId})
  }
  catch{await row.update({status:'failed'});revalidatePath(`/admin/applications/${id}`);return {ok:false,message:'SMTP delivery failed. Your reply is saved with failed status.'}}
  revalidatePath(`/admin/applications/${id}`);return {ok:true,message:'Reply sent.'}
 }catch(e){return error(e)}
}
