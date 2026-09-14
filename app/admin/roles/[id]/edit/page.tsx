import {notFound} from 'next/navigation'
import {AccessManager} from '@/components/admin/access-manager'
import {getAccessManagementData} from '@/server/admin/access-data'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'

export default async function EditRolePage({params}: {params: Promise<{id: string}>}) {
  await requireAdminPagePermission('roles', 'edit')
  const {id} = await params
  const data = await getAccessManagementData()
  const role = data.roles.find((item) => item.id === Number(id))
  if (!role) notFound()
  return <AccessManager kind="role" {...data} capabilities={await getAdminResourceCapabilities('roles')} initialRole={role}/>
}
