import {ApplicationsList} from '@/components/admin/application-manager'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
import {getSubmissionList} from '@/server/admin/submission-list'
import type {ListSearchParams} from '@/lib/admin/submission-list'

export default async function Page({searchParams}:{searchParams:Promise<ListSearchParams>}){
  await requireAdminPagePermission('career_applications','view')
  const {records,pagination,counts}=await getSubmissionList('applications',await searchParams)
  return <ApplicationsList applications={records} pagination={pagination} counts={counts} capabilities={await getAdminResourceCapabilities('career_applications')}/>
}
