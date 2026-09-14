import {NewsManager} from '@/components/admin/news-manager'
import {getNews} from '@/server/services/news/content'
import {newArticle} from '@/lib/news/contracts'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('news','create');return <NewsManager {...await getNews()} initial={newArticle()} capabilities={await getAdminResourceCapabilities('news')}/>}
