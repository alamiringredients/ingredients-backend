import {notFound} from 'next/navigation'
import {CatalogManager} from '@/components/admin/catalog-manager'
import {getCatalog} from '@/server/services/catalog/content'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
export default async function EditPage({params}:{params:Promise<{id:string}>}) {
  await requireAdminPagePermission('product_categories','edit')
  const {id}=await params
  const catalog=await getCatalog(true)
  const record=catalog.categories.find(record=>record.id===Number(id))
  if(!record) notFound()
  return <CatalogManager key={record.id} kind="category" catalog={catalog} capabilities={await getAdminResourceCapabilities('product_categories')} initialRecord={record} />
}
