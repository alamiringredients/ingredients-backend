import {notFound} from 'next/navigation'
import {AccessManager} from '@/components/admin/access-manager'
import {getAdminEditorData} from '@/server/admin/access-data'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'

export default async function EditAdminPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminPagePermission('admins', 'edit')
  const {id} = await params
  const data = await getAdminEditorData(Number(id))
  const admin = data.initialAdmin
  if (!admin) notFound()
  return <AccessManager kind="admin" roles={data.roles} capabilities={await getAdminResourceCapabilities('admins')} initialAdmin={admin}/>
}
