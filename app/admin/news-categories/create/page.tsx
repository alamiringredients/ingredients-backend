import {NewsTaxonomyManager} from '@/components/admin/news-taxonomy-manager'
import {getNews} from '@/server/services/news/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('news_taxonomies','create');const {taxonomies}=await getNews();const initial={id:0,kind:'category' as const,slug:'',sort_order:0,content:{en:{name:'',description:''},ar:{name:'',description:''},fr:{name:'',description:''}}};return <NewsTaxonomyManager items={taxonomies.filter(t=>t.kind==='category')} kind="category" initial={initial} capabilities={await getAdminResourceCapabilities('news_taxonomies')}/>}
