import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('cookies_page','view');return <ManagedPageManager canEdit={await canAdminEdit('cookies_page')} page="cookies" initialContent={await getManagedPageContent('cookies')}/>}
