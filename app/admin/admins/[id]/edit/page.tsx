import {notFound} from 'next/navigation'
import {AccessManager} from '@/components/admin/access-manager'
import {getAccessManagementData} from '@/server/admin/access-data'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'

export default async function EditAdminPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminPagePermission('admins', 'edit')
  const {id} = await params
  const data = await getAccessManagementData()
  const admin = data.admins.find((item) => item.id === Number(id))
  if (!admin) notFound()
  return <AccessManager kind="admin" {...data} capabilities={await getAdminResourceCapabilities('admins')} initialAdmin={admin}/>
}
