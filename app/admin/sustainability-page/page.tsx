import {SustainabilityPageManager} from '@/components/admin/sustainability-page-manager'
import {getSustainability} from '@/server/services/sustainability/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('sustainability_page','view');return <SustainabilityPageManager initial={(await getSustainability()).page} canEdit={(await getAdminResourceCapabilities('sustainability_page')).edit}/>}
