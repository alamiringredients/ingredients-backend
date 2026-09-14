import {EditorialPageManager} from '@/components/admin/editorial-page-manager'
import {getEditorialPage} from '@/server/services/careers/content'
import {getNews} from '@/server/services/news/content'
import {textContent} from '@/lib/editor/document'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('careers_page','view');return <EditorialPageManager page="careers" initial={await getEditorialPage('careers')} canEdit={(await getAdminResourceCapabilities('careers_page')).edit} news={(await getNews()).articles.map(a=>({id:a.id,title:textContent(a.content.locales.en.title)}))}/>}
