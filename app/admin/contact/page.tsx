import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('contact_page','view');return <ManagedPageManager canEdit={await canAdminEdit('contact_page')} page="contact" initialContent={await getManagedPageContent('contact')}/>}
