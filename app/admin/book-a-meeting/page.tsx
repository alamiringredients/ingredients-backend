import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('book_meeting_page','view');return <ManagedPageManager page="book-a-meeting" initialContent={await getManagedPageContent('book-a-meeting')}/>}
