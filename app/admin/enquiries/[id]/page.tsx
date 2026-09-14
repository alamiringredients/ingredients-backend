import {notFound} from 'next/navigation'
import ContactEnquiry from '@/server/models/ContactEnquiry'
import ContactReply from '@/server/models/ContactReply'
import {EnquiryDetails} from '@/components/admin/enquiry-manager'
import type {EnquiryRecord,EnquiryReplyRecord} from '@/lib/enquiries/contracts'
import {getAdminResourceCapabilities,requireAdminPagePermission} from '@/server/admin/authorization'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAdminPagePermission('contact_enquiries','view');const id=Number((await params).id),row=await ContactEnquiry.where('id',id).firstJson();if(!row)notFound();const replies=await ContactReply.where('enquiry_id',id).orderBy('id','desc').getJson();return <EnquiryDetails enquiry={JSON.parse(JSON.stringify(row)) as EnquiryRecord} replies={JSON.parse(JSON.stringify(replies)) as EnquiryReplyRecord[]} canEdit={(await getAdminResourceCapabilities('contact_enquiries')).edit}/>}
