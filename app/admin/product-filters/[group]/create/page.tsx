import {notFound} from 'next/navigation'
import {ProductFilterEditor} from '@/components/admin/product-filter-manager'
import {requireAdminPagePermission, getAdminResourceCapabilities} from '@/server/admin/authorization'

export default async function CreateProductFilterPage({params}: {params: Promise<{group: string}>}) {
  await requireAdminPagePermission('product_filters', 'create')
  const {group} = await params
  if (group !== 'applications' && group !== 'concentrations') notFound()
  return <ProductFilterEditor record={{id: 0, group, slug: '', en: '', ar: '', fr: '', sort_order: 0, is_active: true}} capabilities={await getAdminResourceCapabilities('product_filters')}/>
}
