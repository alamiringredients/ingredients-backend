import {DownloadsManager} from '@/components/admin/downloads-manager'
import {getDownloadsPageContent} from '@/server/services/downloads/content'
import {requireAdminPagePermission} from '@/server/admin/authorization'

export default async function DownloadsAdminPage() {
  await requireAdminPagePermission('downloads_page', 'view')
  return <DownloadsManager initialContent={await getDownloadsPageContent()}/>
}
