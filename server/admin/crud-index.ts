import 'server-only'
import {DB, type TableQueryBuilder} from '@holo-js/db'
import type {CrudCell, CrudFilter, CrudIndexData, CrudIndexRow} from '@/lib/admin/crud-index'
import type {ListSearchParams} from '@/lib/admin/submission-list'
import {countQuery, paginateCrud} from '@/server/admin/crud-query'
import {decodeStoredJson} from '@/lib/cms/stored-json'
import {textContent, type ContentDocument} from '@/lib/editor/document'
import {databaseDate} from '@/server/support/database-date'
import {normalizeRolePermissions} from '@/lib/admin/access'

export type CrudKind = 'products' | 'product-categories' | 'applications' | 'concentrations' | 'certifications' | 'certification-types' | 'news' | 'sustainability' | 'sustainability-goals' | 'news-categories' | 'news-tags' | 'events' | 'careers' | 'admins' | 'roles'
type Row = Record<string, unknown>
type Definition=Pick<CrudIndexData,'title'|'section'|'noun'|'resource'|'columns'>&{
  query: TableQueryBuilder; filters: CrudFilter[]; searchColumns: string[]
  translatedSearch?: {table: string; key: string; column: string | string[]; parent?: string}[]
  filter: (query: TableQueryBuilder, key: string, value: string) => TableQueryBuilder
  row: (row: Row) => CrudIndexRow
}
const statusOptions = [{value: 'published', label: 'Published'}, {value: 'draft', label: 'Draft'}]
const filter = (key: string, label: string, options: CrudFilter['options']): CrudFilter => ({key, label, options})
const status = (active: unknown, yes = 'Published', no = 'Draft'): CrudCell => ({label: active ? yes : no, active: Boolean(active)})
const str = (value: unknown) => String(value ?? '')
const doc = (value: unknown) => textContent(value as ContentDocument)
type ListContent = {
  en: {name: string; title: string; department: string; location: string; hero: string}
  fr: {name: string}
  title: ContentDocument & {en: ContentDocument}
  location: {en: string}
  heroImage: string; hero: string; badge: string; icon: string; gallery?: {src: string; image: string}[]
}
const json = (value: unknown): ListContent => decodeStoredJson(value) as ListContent
const identity = (row: Row, name: unknown, cells: CrudCell[], subtitle?: unknown, image?: unknown): CrudIndexRow => ({id: Number(row.id), name: str(name), subtitle: str(subtitle), image: str(image), cells})
const none = (query: TableQueryBuilder) => query
const translated = (table: string, key: string, parent = 'r.id') => DB.table(table).where('locale', 'en').whereColumn(key, '=', parent)
const names = async (table: string, key: string) => (await DB.table(table).select(key, 'name').where('locale', 'en').orderBy('name').get()).map(row => ({value: str(row[key]), label: str(row.name)}))

async function definition(kind: CrudKind): Promise<Definition> {
  if (kind === 'sustainability-goals') {
    return {title:'Sustainability goals',section:'Sustainability',noun:'goal',resource:'sustainability_goals',columns:['Name','Goal ID','Articles','Display order'],
      query:DB.table('sustainability_goals as r').select('r.id','r.image','r.sort_order').addSelectSub(translated('sustainability_goal_translations','goal_id').select('name'),'name').addSelectSub(DB.table('sustainability_article_goal').whereColumn('goal_id','=','r.id').selectCount(),'used_by').orderBy('r.sort_order').orderBy('r.id'),
      filters:[],searchColumns:[],translatedSearch:[{table:'sustainability_goal_translations',key:'goal_id',column:'name'}],filter:none,
      row:r=>identity(r,r.name,[Number(r.id),Number(r.used_by),Number(r.sort_order)],undefined,r.image),
    }
  }
  if (kind === 'products' || kind === 'product-categories') {
    const product = kind === 'products'
    const table = product ? 'products' : 'product_categories'
    const translations = product ? 'product_translations' : 'product_category_translations'
    const key = product ? 'product_id' : 'category_id'
    let query = DB.table(`${table} as r`).select('r.id', 'r.slug', 'r.published', 'r.sort_order')
      .addSelectSub(translated(translations, key).select('name'), 'name')
      .addSelectSub(DB.table(translations).select('name').where('locale', 'fr').whereColumn(key, '=', 'r.id'), 'subtitle')
    query = query.addSelectSub(translated(translations, key).select('content'), 'detail')
    if (product) query = query.addSelect('r.category_id').addSelectSub(translated('product_category_translations', 'category_id', 'r.category_id').select('name'), 'category')
    else query = query.addSelectSub(DB.table('products').whereColumn('category_id', '=', 'r.id').selectCount(), 'products')
    return {title: product ? 'Products' : 'Product categories', section: 'Catalog', noun: product ? 'product' : 'category', resource: product ? 'products' : 'product_categories',
      columns: ['Name', product ? 'Category' : 'Products', 'URL slug', 'Status', 'Order'], query: query.orderBy('r.sort_order').orderBy('r.id'),
      filters: [filter('status', 'Status', statusOptions), ...(product ? [filter('category', 'Category', await names('product_category_translations', 'category_id'))] : [])],
      searchColumns: ['r.slug'], translatedSearch: [{table: translations, key, column: 'name'}],
      filter: (q, key, value) => key === 'status' ? q.where('r.published', value === 'published') : q.where('r.category_id', Number(value)),
      row: r => identity(r, r.name, [product ? str(r.category) : Number(r.products), str(r.slug), status(r.published), Number(r.sort_order)], r.subtitle, product ? json(r.detail).gallery?.[0]?.image : json(r.detail).icon),
    }
  }
  if (kind === 'applications' || kind === 'concentrations') {
    const application = kind === 'applications'
    const table = application ? 'product_applications' : 'concentration_ranges'
    const translations = application ? 'application_translations' : 'concentration_translations'
    const key = application ? 'application_id' : 'concentration_id'
    return {title: application ? 'Applications' : 'Concentrations', section: 'Catalog', noun: application ? 'application' : 'concentration', resource: 'product_filters', columns: ['Name', 'URL slug', 'Status', 'Order'],
      query: DB.table(`${table} as r`).select('r.id', 'r.slug', 'r.is_active', 'r.sort_order').addSelectSub(translated(translations, key).select('name'), 'name').orderBy('r.sort_order').orderBy('r.id'),
      filters: [filter('status', 'Status', [{value: 'active', label: 'Active'}, {value: 'inactive', label: 'Inactive'}])], searchColumns: ['r.slug'], translatedSearch: [{table: translations, key, column: 'name'}],
      filter: (q, _key, value) => q.where('r.is_active', value === 'active'), row: r => identity(r, r.name, [str(r.slug), status(r.is_active, 'Active', 'Inactive'), Number(r.sort_order)]),
    }
  }
  if (kind === 'news-categories' || kind === 'news-tags') {
    const category = kind === 'news-categories'
    return {title: category ? 'News categories' : 'News tags', section: 'News', noun: category ? 'category' : 'tag', resource: 'news_taxonomies', columns: ['Name', 'URL slug', 'Order'],
      query: DB.table('news_taxonomies as r').select('r.id', 'r.slug', 'r.content', 'r.sort_order').where('r.kind', category ? 'category' : 'tag').orderBy('r.sort_order').orderBy('r.id'), filters: [], filter: none,
      searchColumns: ['r.slug', ...['en', 'ar', 'fr'].map(locale => `r.content->${locale}->name`)],
      row: r => identity(r, json(r.content).en.name, [str(r.slug), Number(r.sort_order)], json(r.content).fr.name),
    }
  }
  if (kind === 'careers' || kind === 'events') {
    const event = kind === 'events'
    return {title: event ? 'Events & appointments' : 'Careers', section: event ? 'Events' : 'Recruitment', noun: event ? 'event' : 'job', resource: event ? 'events' : 'career_jobs', columns: event ? ['Event', 'Dates', 'Type', 'Status'] : ['Role', 'Department', 'Location', 'Status'],
      query: DB.table(`${event ? 'events' : 'career_jobs'} as r`).select(...(event ? ['r.id', 'r.slug', 'r.content', 'r.starts_at', 'r.ends_at', 'r.kind', 'r.published'] : ['r.id', 'r.code', 'r.content', 'r.status'])).orderBy('r.id'),
      filters: event ? [filter('kind', 'Type', [{value: 'event', label: 'Event'}, {value: 'recap', label: 'Recap'}]), filter('published', 'Publishing', [{value: 'yes', label: 'Published'}, {value: 'no', label: 'Draft'}])] : [filter('status', 'Status', ['draft', 'open', 'closed'].map(value => ({value, label: value[0].toUpperCase() + value.slice(1)})))],
      searchColumns: event ? ['r.slug', ...['en', 'ar', 'fr'].flatMap(locale => [`r.content->title->${locale}`, `r.content->location->${locale}`])] : ['r.code', ...['en', 'ar', 'fr'].flatMap(locale => [`r.content->${locale}->title`, `r.content->${locale}->department`, `r.content->${locale}->location`])],
      filter: (q, key, value) => q.where(`r.${key}`, key === 'published' ? value === 'yes' : value),
      row: r => {const content = json(r.content); return event ? identity(r, doc(content.title.en), [`${databaseDate(r.starts_at)} – ${databaseDate(r.ends_at)}`, str(r.kind), status(r.published)], content.location.en, content.heroImage) : identity(r, content.en.title, [content.en.department, content.en.location, status(r.status === 'open', 'Open', str(r.status))], r.code, content.en.hero)},
    }
  }
  if (kind === 'admins' || kind === 'roles') {
    const admin = kind === 'admins'
    let query = DB.table(`${kind} as r`).select(...(admin ? ['r.id', 'r.name', 'r.email', 'r.role_id'] : ['r.id', 'r.name', 'r.description', 'r.permissions'])).orderBy('r.name').orderBy('r.id')
    if (admin) query = query.addSelectSub(DB.table('roles').select('name').whereColumn('id', '=', 'r.role_id'), 'role_name')
    else query = query.addSelectSub(DB.table('admins').whereColumn('role_id', '=', 'r.id').selectCount(), 'assigned')
    return {title: admin ? 'Admins' : 'Roles', section: 'Access control', noun: admin ? 'admin' : 'role', resource: kind, columns: admin ? ['Name', 'Email', 'Role'] : ['Name', 'Description', 'Permissions', 'Admins'], query,
      filters: admin ? [filter('role', 'Role', [{value: 'owner', label: 'Owner'}, ...(await DB.table('roles').select('id', 'name').orderBy('name').get()).map(row => ({value: str(row.id), label: str(row.name)}))])] : [], searchColumns: admin ? ['r.name', 'r.email'] : ['r.name', 'r.description'],
      filter: (q, _key, value) => value === 'owner' ? q.whereNull('r.role_id') : q.where('r.role_id', Number(value)),
      row: r => identity(r, r.name, admin ? [str(r.email), status(r.role_id !== null, str(r.role_name), 'Owner')] : [str(r.description), Object.values(normalizeRolePermissions(decodeStoredJson(r.permissions))).reduce((total, actions) => total + actions.length, 0), Number(r.assigned)]),
    }
  }
  if (kind === 'certifications' || kind === 'certification-types') {
    const cert = kind === 'certifications'
    let query = DB.table(`${cert ? 'certifications' : 'certification_types'} as r`).select(...(cert ? ['r.id', 'r.type_id', 'r.holder', 'r.status', 'r.expiry_date', 'r.document', 'r.published', 'r.sort_order'] : ['r.id', 'r.slug', 'r.logo', 'r.kind']))
      .addSelectSub(translated('certification_type_translations', 'type_id', cert ? 'r.type_id' : 'r.id').select('name'), 'name').orderBy('r.id')
    if (!cert) query = query.addSelectSub(DB.table('certifications').whereColumn('type_id', '=', 'r.id').selectCount(), 'used_by')
    return {title: cert ? 'Certifications' : 'Certification types', section: 'Quality', noun: cert ? 'certification' : 'certification type', resource: cert ? 'certifications' : 'certification_types', columns: cert ? ['Name', 'Holder', 'Status', 'Document', 'Visibility', 'Order'] : ['Name', 'Slug', 'Used by'], query,
      filters: cert ? [filter('visibility', 'Visibility', statusOptions)] : [], searchColumns: cert ? ['r.holder', 'r.certificate_number'] : ['r.slug'], translatedSearch: [{table: 'certification_type_translations', key: 'type_id', column: 'name', parent: cert ? 'r.type_id' : 'r.id'}],
      filter: (q, _key, value) => q.where('r.published', value === 'published'),
      row: r => identity(r, r.name, cert ? [r.holder === 'group' ? 'Al Amir Group' : 'Alamir Ingredients · Sadat City', r.status === 'held' && r.expiry_date && databaseDate(r.expiry_date) < new Date().toISOString().slice(0, 10) ? 'Expired' : str(r.status), r.document ? {href: str(r.document), label: 'View PDF'} : 'No PDF', status(r.published), Number(r.sort_order)] : [str(r.slug), Number(r.used_by)], r.kind, r.logo),
    }
  }
  const news = kind === 'news'
  const table = news ? 'news_articles' : 'sustainability_articles'
  const translations = news ? 'news_article_translations' : 'sustainability_article_translations'
  const publications = news ? 'news_publications' : 'sustainability_publications'
  const categories = news
    ? (await DB.table('news_taxonomies').select('id', 'content').where('kind', 'category').orderBy('sort_order').get()).map(r => ({value: str(r.id), label: str(json(r.content).en.name)}))
    : [...new Set((await DB.table(translations).select('content').where('locale', 'en').get()).map(row => str(json(row.content).badge)).filter(Boolean))].map(badge => ({value: badge, label: badge}))
  const query = DB.table(`${table} as r`).select('r.id', 'r.slug', 'r.article_date').addSelectSub(translated(translations, 'article_id').select('content'), 'content').addSelectSub(DB.table(translations).select('content').where('locale', 'fr').whereColumn('article_id', '=', 'r.id'), 'subtitle_content').addSelectSub(DB.table(publications).whereColumn('article_id', '=', 'r.id').selectCount(), 'published_count')
  return {title: news ? 'News articles' : 'Sustainability articles', section: news ? 'News' : 'Sustainability', noun: 'article', resource: news ? 'news' : 'sustainability', columns: ['Name', 'Category', 'URL slug', 'Status', 'Date'],
    query: (news ? query.addSelect('r.category_id') : query).orderBy('r.article_date', 'desc').orderBy('r.id', 'desc'),
    filters: [filter('status', 'Status', statusOptions), filter('topic', 'Category', categories)], searchColumns: ['r.slug'], translatedSearch: [{table: translations, key: 'article_id', column: ['content->title', 'content->badge']}, ...(news ? [{table: 'news_taxonomies', key: 'id', column: ['content->en->name', 'content->ar->name', 'content->fr->name'], parent: 'r.category_id'}] : [])],
    filter: (q, key, value) => key === 'topic' ? news ? q.where('r.category_id', Number(value)) : q.whereInSub('r.id', DB.table(translations).select('article_id').where('locale', 'en').whereJson('content->badge', value)) : value === 'published' ? q.whereInSub('r.id', DB.table(publications).select('article_id')) : q.whereNotInSub('r.id', DB.table(publications).select('article_id')),
    row: r => {const content = json(r.content); return identity(r, doc(content.title), [news ? categories.find(category => category.value === str(r.category_id))?.label ?? 'Unassigned' : str(content.badge), str(r.slug), status(Number(r.published_count)), databaseDate(r.article_date)], doc(json(r.subtitle_content).title), news ? content.hero : content.gallery?.[0]?.src)},
  }
}

async function getStats(kind: CrudKind, config: Definition) {
  const total = await countQuery(config.query)
  const stats = [{label: `Total ${config.title.toLowerCase()}`, value: total}]
  if (['products', 'product-categories', 'news', 'sustainability'].includes(kind)) {
    const published = await countQuery(config.filter(config.query, 'status', 'published'))
    stats.push({label: 'Published', value: published}, {label: 'Drafts', value: total - published})
  } else if (kind === 'applications' || kind === 'concentrations') {
    const active = await countQuery(config.query.where('r.is_active', true))
    stats.push({label: 'Active', value: active}, {label: 'Inactive', value: total - active})
  } else if (kind === 'events') {
    const [published, upcoming] = await Promise.all([countQuery(config.query.where('r.published', true)), countQuery(config.query.where('r.ends_at', '>', new Date()))])
    stats.push({label: 'Published', value: published}, {label: 'Upcoming', value: upcoming})
  } else if (kind === 'careers') {
    const [open, drafts] = await Promise.all([countQuery(config.query.where('r.status', 'open')), countQuery(config.query.where('r.status', 'draft'))])
    stats.push({label: 'Open', value: open}, {label: 'Drafts', value: drafts})
  } else if (kind === 'certifications') {
    const [published, documents] = await Promise.all([countQuery(config.query.where('r.published', true)), countQuery(config.query.where('r.document', '!=', ''))])
    stats.push({label: 'Published', value: published}, {label: 'With documents', value: documents})
  } else if (kind === 'certification-types') {
    const [logos, certifications] = await Promise.all([countQuery(config.query.where('r.logo', '!=', '')), countQuery(DB.table('certifications'))])
    stats.push({label: 'With logos', value: logos}, {label: 'Certifications', value: certifications})
  } else if (kind === 'admins') {
    const assigned = await countQuery(config.query.whereNotNull('r.role_id'))
    stats.push({label: 'Assigned to roles', value: assigned}, {label: 'Owner accounts', value: total - assigned})
  } else if (kind === 'roles') {
    const used = await countQuery(config.query.whereInSub('r.id', DB.table('admins').select('role_id').whereNotNull('role_id')))
    stats.push({label: 'Roles in use', value: used}, {label: 'Unassigned roles', value: total - used})
  }
  return stats
}

export async function getCrudIndex(kind: CrudKind, params: ListSearchParams): Promise<CrudIndexData> {
  const config = await definition(kind)
  const search = (query: TableQueryBuilder, pattern: string) => query.where(group => {
    for (const column of config.searchColumns) group = group.orWhere(column, 'like', pattern)
    for (const {table, key, column, parent = 'r.id'} of config.translatedSearch ?? []) {
      const columns = Array.isArray(column) ? column : [column]
      group = group.orWhereExists(DB.table(table).select(key).whereColumn(key, '=', parent).where(match => {
        for (const path of columns) match = match.orWhere(path, 'like', pattern)
        return match
      }))
    }
    return group
  })
  const [result, stats] = await Promise.all([paginateCrud(config.query, params, config.filters, search, config.filter), getStats(kind, config)])
  const rows = result.rows.map(config.row)
  if (rows.length && (kind === 'news' || kind === 'sustainability')) {
    const publications = await DB.table(kind === 'news' ? 'news_publications' : 'sustainability_publications').select('article_id', 'locale').whereIn('article_id', rows.map(row => row.id)).get()
    for (const row of rows) {
      const cell = row.cells[2]
      if (typeof cell === 'object' && 'active' in cell) cell.detail = ['en', 'ar', 'fr'].filter(locale => publications.some(publication => Number(publication.article_id) === row.id && publication.locale === locale)).join(' · ').toUpperCase()
    }
  }
  return {title: config.title, section: config.section, noun: config.noun, resource: config.resource,
    basePath: ['applications', 'concentrations'].includes(kind) ? `/admin/product-filters/${kind}` : `/admin/${kind}`,
    columns: config.columns, filters: config.filters, stats, rows, pagination: result.pagination}
}
