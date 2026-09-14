import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('terms_page','view');return <ManagedPageManager page="terms" initialContent={await getManagedPageContent('terms')}/>}
