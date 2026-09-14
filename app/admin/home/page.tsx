import {HomeContentManager} from '@/components/admin/home-content-manager'
import {getHomeCmsData} from '@/server/services/cms/content'
import {requireAdminPagePermission} from '@/server/admin/authorization'

export default async function HomeContentPage() {
  await requireAdminPagePermission('home_sections','view')
  return <HomeContentManager initialData={await getHomeCmsData()} />
}
