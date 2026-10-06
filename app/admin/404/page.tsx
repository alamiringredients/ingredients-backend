import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('not_found_page','view');return <ManagedPageManager canEdit={await canAdminEdit('not_found_page')} page="404" initialContent={await getManagedPageContent('404')}/>}
