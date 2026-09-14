import {notFound} from 'next/navigation'
import {CrudIndexPage} from '@/components/admin/crud-index-page'
import type {ListSearchParams} from '@/lib/admin/submission-list'

export default async function Page({params, searchParams}: {params: Promise<{group: string}>; searchParams: Promise<ListSearchParams>}) {
  const {group} = await params
  if (group !== 'applications' && group !== 'concentrations') notFound()
  return <CrudIndexPage kind={group} searchParams={searchParams}/>
}
