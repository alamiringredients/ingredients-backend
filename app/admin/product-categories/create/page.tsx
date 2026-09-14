import {CatalogManager} from '@/components/admin/catalog-manager'
import {getCatalog} from '@/server/services/catalog/content'
import {newCatalogRecord} from '@/lib/catalog/new-record'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
export default async function CreatePage() {
  await requireAdminPagePermission('product_categories','create')
  const catalog=await getCatalog(true)
  const source=catalog.categories[0]
  if(!source) throw new Error('Product category content is missing. Run the product_catalog seeder.')
  return <CatalogManager kind="category" catalog={catalog} capabilities={await getAdminResourceCapabilities('product_categories')} initialRecord={newCatalogRecord('category',source)} />
}
