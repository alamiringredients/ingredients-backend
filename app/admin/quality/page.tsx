import {EditorialPageManager} from '@/components/admin/editorial-page-manager'
import {getAdminResourceCapabilities,requireAdminPagePermission} from '@/server/admin/authorization'
import {getQualityPageContent} from '@/server/services/quality/content'

export default async function QualityAdminPage() {
  await requireAdminPagePermission('quality_page', 'view')
  return <EditorialPageManager page="quality" initial={await getQualityPageContent()} canEdit={(await getAdminResourceCapabilities('quality_page')).edit}/>
}
