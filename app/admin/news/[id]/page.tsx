import {notFound} from 'next/navigation'
import {NewsManager} from '@/components/admin/news-manager'
import {getNews} from '@/server/services/news/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAdminPagePermission('news','view');const {id}=await params,data=await getNews(),record=data.articles.find(a=>a.id===Number(id));if(!record)notFound();return <NewsManager {...data} initial={record} capabilities={await getAdminResourceCapabilities('news')}/>}
