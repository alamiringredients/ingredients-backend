import {EditorialPageManager} from '@/components/admin/editorial-page-manager'
import {getEditorialPage} from '@/server/services/careers/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('about_page','view');return <EditorialPageManager page="about" initial={await getEditorialPage('about')} canEdit={(await getAdminResourceCapabilities('about_page')).edit}/>}
