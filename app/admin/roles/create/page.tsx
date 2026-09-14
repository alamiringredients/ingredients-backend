import {AccessManager} from '@/components/admin/access-manager'
import {getAccessManagementData} from '@/server/admin/access-data'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
import {emptyRolePermissions} from '@/lib/admin/access'

export default async function CreateRolePage() {
  await requireAdminPagePermission('roles', 'create')
  return <AccessManager kind="role" {...await getAccessManagementData()} capabilities={await getAdminResourceCapabilities('roles')} initialRole={{id: 0, name: '', description: '', permissions: emptyRolePermissions()}}/>
}
