import {DownloadsManager} from '@/components/admin/downloads-manager'
import {getDownloadsPageContent} from '@/server/services/downloads/content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'

export default async function DownloadsAdminPage() {
  await requireAdminPagePermission('downloads_page', 'view')
  return <DownloadsManager canEdit={await canAdminEdit('downloads_page')} initialContent={await getDownloadsPageContent()}/>
}
