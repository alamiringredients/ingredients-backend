import {SustainabilityManager} from '@/components/admin/sustainability-manager'
import {getSustainability} from '@/server/services/sustainability/content'
import {newSustainabilityArticle} from '@/lib/sustainability/contracts'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('sustainability','create');return <SustainabilityManager {...await getSustainability()} initial={newSustainabilityArticle()} capabilities={await getAdminResourceCapabilities('sustainability')}/>}
