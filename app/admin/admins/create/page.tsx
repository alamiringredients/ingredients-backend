import {AccessManager} from '@/components/admin/access-manager'
import {getAdminEditorData} from '@/server/admin/access-data'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'

export default async function CreateAdminPage() {
  await requireAdminPagePermission('admins', 'create')
  return <AccessManager kind="admin" roles={(await getAdminEditorData()).roles} capabilities={await getAdminResourceCapabilities('admins')} initialAdmin={{id: 0, name: '', email: '', role_id: null}}/>
}
