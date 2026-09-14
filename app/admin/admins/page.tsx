import {CrudIndexPage} from '@/components/admin/crud-index-page'
import type {ListSearchParams} from '@/lib/admin/submission-list'

export default function Page({searchParams}: {searchParams: Promise<ListSearchParams>}) {
  return <CrudIndexPage kind="admins" searchParams={searchParams}/>
}
