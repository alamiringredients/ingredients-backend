import {notFound} from 'next/navigation'
import {JobEditor} from '@/components/admin/job-manager'
import {getJobs} from '@/server/services/careers/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAdminPagePermission('career_jobs','view');const {id}=await params;const job=(await getJobs()).find(j=>j.id===Number(id));if(!job)notFound();return <JobEditor initial={job} canEdit={(await getAdminResourceCapabilities('career_jobs')).edit}/>}
