import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('privacy_page','view');return <ManagedPageManager canEdit={await canAdminEdit('privacy_page')} page="privacy" initialContent={await getManagedPageContent('privacy')}/>}
