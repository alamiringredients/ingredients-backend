import {NewsPageManager} from '@/components/admin/news-page-manager'
import {getNews} from '@/server/services/news/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('news_page','view');return <NewsPageManager initial={(await getNews()).page} canEdit={(await getAdminResourceCapabilities('news_page')).edit}/>}
