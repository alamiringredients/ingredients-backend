import {notFound} from 'next/navigation'
import {EventEditor} from '@/components/admin/event-manager'
import {getEvents, getEventSlotList} from '@/server/services/events/content'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
import type {ListSearchParams} from '@/lib/admin/submission-list'

export default async function Page({params, searchParams}: {params: Promise<{id: string}>; searchParams: Promise<ListSearchParams>}) {
  await requireAdminPagePermission('events', 'view')
  const id = Number((await params).id)
  const event = (await getEvents()).find(item => item.id === id)
  if (!event) notFound()
  const capabilities = await getAdminResourceCapabilities('events')
  return <EventEditor initial={event} {...await getEventSlotList(id, await searchParams)} canEdit={capabilities.edit}/>
}
