import {notFound} from 'next/navigation'
import {ApplicationDetails} from '@/components/admin/application-manager'
import CareerApplication from '@/server/models/CareerApplication'
import CareerReply from '@/server/models/CareerReply'
import type {ApplicationRecord,ReplyRecord} from '@/lib/careers/contracts'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAdminPagePermission('career_applications','view');const {id}=await params;const row=await CareerApplication.where('id',Number(id)).firstJson();if(!row)notFound();return <ApplicationDetails application={JSON.parse(JSON.stringify(row)) as ApplicationRecord} replies={JSON.parse(JSON.stringify(await CareerReply.where('application_id',Number(id)).orderBy('id','desc').getJson())) as ReplyRecord[]} canEdit={(await getAdminResourceCapabilities('career_applications')).edit}/>}
