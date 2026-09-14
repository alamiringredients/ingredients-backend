import {CatalogManager} from '@/components/admin/catalog-manager'
import {getCatalog} from '@/server/services/catalog/content'
import {newCatalogRecord} from '@/lib/catalog/new-record'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
export default async function CreatePage() {
  await requireAdminPagePermission('products','create')
  const catalog=await getCatalog(true)
  const source=catalog.products[0]
  if(!source) throw new Error('Product content is missing. Run the product_catalog seeder.')
  return <CatalogManager kind="product" catalog={catalog} capabilities={await getAdminResourceCapabilities('products')} initialRecord={newCatalogRecord('product',source,catalog.categories[0]?.id)} />
}
