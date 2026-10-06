import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('events_page','view');return <ManagedPageManager canEdit={await canAdminEdit('events_page')} page="events" initialContent={await getManagedPageContent('events')}/>}
