import {notFound} from 'next/navigation'
import {NewsTaxonomyManager} from '@/components/admin/news-taxonomy-manager'
import {getNews} from '@/server/services/news/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAdminPagePermission('news_taxonomies','edit');const {taxonomies}=await getNews();const {id}=await params;const initial=taxonomies.find(t=>t.id===Number(id)&&t.kind==='tag');if(!initial)notFound();return <NewsTaxonomyManager items={taxonomies.filter(t=>t.kind==='tag')} kind="tag" initial={initial} capabilities={await getAdminResourceCapabilities('news_taxonomies')}/>}
