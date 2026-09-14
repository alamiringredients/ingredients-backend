import {notFound} from 'next/navigation'
import {ProductFilterEditor} from '@/components/admin/product-filter-manager'
import {requireAdminPagePermission, getAdminResourceCapabilities} from '@/server/admin/authorization'
import {getProductFilters} from '@/server/services/catalog/product-filters'

export default async function EditProductFilterPage({params}: {params: Promise<{group: string; id: string}>}) {
  await requireAdminPagePermission('product_filters', 'edit')
  const {group, id} = await params
  if (group !== 'applications' && group !== 'concentrations') notFound()
  const record = (await getProductFilters(group)).find(record => record.group === group && record.id === Number(id))
  if (!record) notFound()
  return <ProductFilterEditor key={`${group}-${id}`} record={record} capabilities={await getAdminResourceCapabilities('product_filters')}/>
}
