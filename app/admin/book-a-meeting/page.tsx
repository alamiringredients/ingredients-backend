import {ManagedPageManager} from '@/components/admin/managed-page-manager'
import {getManagedPageContent} from '@/server/services/cms/managed-page-content'
import {requireAdminPagePermission,canAdminEdit} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('book_meeting_page','view');return <ManagedPageManager canEdit={await canAdminEdit('book_meeting_page')} page="book-a-meeting" initialContent={await getManagedPageContent('book-a-meeting')}/>}
