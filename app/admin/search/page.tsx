import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('search_page','view');return <ManagedPageManager canEdit={await canAdminEdit('search_page')} page="search" initialContent={await getManagedPageContent('search')}/>}
