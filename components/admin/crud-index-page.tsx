import {CrudIndex} from './crud-index'
import {getCrudIndex, type CrudKind} from '@/server/admin/crud-index'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
import type {ListSearchParams} from '@/lib/admin/submission-list'
import type {AdminResource} from '@/lib/admin/access'
import type {AdminResult} from './form-feedback'
import {deleteCatalogRecord} from '@/app/admin/catalog-actions'
import {deleteCertificationRecord} from '@/app/admin/certification-actions'
import {deleteNews, deleteNewsTaxonomy} from '@/app/admin/news/actions'
import {deleteGoal} from '@/app/admin/sustainability-goals/actions'
import {deleteSustainability} from '@/app/admin/sustainability/actions'
import {deleteJob} from '@/app/admin/career-actions'
import {deleteEventAction} from '@/app/admin/events/actions'
import {deleteAdminAction, deleteRoleAction} from '@/app/admin/access-actions'

const resources: Record<CrudKind, AdminResource> = {
  products: 'products', 'product-categories': 'product_categories', applications: 'product_filters', concentrations: 'product_filters',
  certifications: 'certifications', 'certification-types': 'certification_types', news: 'news', sustainability: 'sustainability', 'sustainability-goals': 'sustainability_goals',
  'news-categories': 'news_taxonomies', 'news-tags': 'news_taxonomies', events: 'events', careers: 'career_jobs', admins: 'admins', roles: 'roles',
}
const removals: Partial<Record<CrudKind, (id: number) => Promise<AdminResult>>> = {
  products: deleteCatalogRecord.bind(null, 'product'), 'product-categories': deleteCatalogRecord.bind(null, 'category'),
  certifications: deleteCertificationRecord.bind(null, 'certification'), 'certification-types': deleteCertificationRecord.bind(null, 'certification-type'),
  news: deleteNews, sustainability: deleteSustainability, 'sustainability-goals': deleteGoal, 'news-categories': deleteNewsTaxonomy, 'news-tags': deleteNewsTaxonomy,
  events: deleteEventAction, careers: deleteJob, admins: deleteAdminAction, roles: deleteRoleAction,
}

export async function CrudIndexPage({kind, searchParams}: {kind: CrudKind; searchParams: Promise<ListSearchParams>}) {
  const resource = resources[kind]
  await requireAdminPagePermission(resource, 'view')
  const [data, capabilities] = await Promise.all([getCrudIndex(kind, await searchParams), getAdminResourceCapabilities(resource)])
  return <CrudIndex data={data} capabilities={capabilities} remove={removals[kind]}/>
}
