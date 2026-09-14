import {notFound} from 'next/navigation'
import {SustainabilityManager} from '@/components/admin/sustainability-manager'
import {getSustainability} from '@/server/services/sustainability/content'
import {requireAdminPagePermission,getAdminResourceCapabilities} from '@/server/admin/authorization'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAdminPagePermission('sustainability','edit');const {id}=await params,data=await getSustainability(),record=data.articles.find(a=>a.id===Number(id));if(!record)notFound();return <SustainabilityManager {...data} initial={record} capabilities={await getAdminResourceCapabilities('sustainability')}/>}
