'use server'
import { requireAdminPermission } from '@/server/admin/authorization'
import { adminActionError } from '@/server/admin/form-actions'
import { getWebsiteSettings } from '@/server/services/cms/content'
import {enquiryReplyForm, enquiryStatusForm} from '@/server/http/controllers/enquiry-schema'
import ApplicationReplyMail from '@/server/mail/application-reply'
import ContactEnquiry from '@/server/models/ContactEnquiry'
import ContactReply from '@/server/models/ContactReply'
import { config } from '@holo-js/config'
import { validate } from '@holo-js/forms'
import { sendMail } from '@holo-js/mail'
import { revalidatePath } from 'next/cache'

const failure=adminActionError
export async function setEnquiryStatusAction(data:FormData){try{await requireAdminPermission('contact_enquiries','edit');const input=await validate(data,enquiryStatusForm);await (await ContactEnquiry.findOrFail(Number(input.enquiryId))).update({status:input.status});revalidatePath('/admin/enquiries','layout');return {ok:true as const,message:'Status updated.'}}catch(error){return failure(error)}}
export async function deleteEnquiryAction(id:number){try{await requireAdminPermission('contact_enquiries','delete');await (await ContactEnquiry.findOrFail(id)).delete();revalidatePath('/admin/enquiries','layout');return {ok:true as const,message:'Enquiry and reply history deleted.'}}catch(error){return failure(error)}}
export async function replyToEnquiryAction(data:FormData){try{
 await requireAdminPermission('contact_enquiries','edit');const input=await validate(data,enquiryReplyForm),enquiry=await ContactEnquiry.findOrFail(Number(input.enquiryId)),existing=await ContactReply.where('request_key',input.key).firstJson()
 if(existing)return {ok:existing.status==='sent',message:existing.status==='sent'?'Reply already sent.':'This reply was already attempted. Check its delivery status.'}
 const reply=await ContactReply.create({enquiry_id:Number(input.enquiryId),subject:input.subject,body:input.body,status:'sending',request_key:input.key})
 try{const settings=await getWebsiteSettings(),sent=await sendMail(ApplicationReplyMail({to:enquiry.email,subject:input.subject,body:input.body,brandName:settings.siteName.en,logo:settings.logo,appUrl:config('app.url')}));await reply.update({status:'sent',message_id:sent.messageId})}
 catch{await reply.update({status:'failed'});revalidatePath(`/admin/enquiries/${enquiry.id}`);return {ok:false as const,message:'Delivery failed. The reply is saved with failed status.'}}
 revalidatePath(`/admin/enquiries/${enquiry.id}`);return {ok:true as const,message:'Reply sent.'}
}catch(error){return failure(error)}}
