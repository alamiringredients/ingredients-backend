import {EnquiriesList} from '@/components/admin/enquiry-manager'
import {getAdminResourceCapabilities,requireAdminPagePermission} from '@/server/admin/authorization'
import {getSubmissionList} from '@/server/admin/submission-list'
import type {ListSearchParams} from '@/lib/admin/submission-list'

export default async function Page({searchParams}:{searchParams:Promise<ListSearchParams>}){
  await requireAdminPagePermission('contact_enquiries','view')
  const {records,pagination,counts}=await getSubmissionList('enquiries',await searchParams)
  return <EnquiriesList enquiries={records} pagination={pagination} counts={counts} capabilities={await getAdminResourceCapabilities('contact_enquiries')}/>
}
