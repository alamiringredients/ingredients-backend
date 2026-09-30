export const adminResources = [
  {key:'product_filters',label:'Product filters'},
  {key:'products_page',label:'Products page'},
  {key:'events_page',label:'Events page'},
  {key:'events',label:'Events and appointments'},
  {key:'contact_page',label:'Contact page'},
  {key:'contact_enquiries',label:'Enquiries'},
  {key:'book_meeting_page',label:'Book a meeting page'},
  {key:'privacy_page',label:'Privacy page'},
  {key:'terms_page',label:'Terms page'},
  {key:'cookies_page',label:'Cookies page'},
  {key:'search_page',label:'Search page'},
  {key:'thank_you_page',label:'Thank-you page'},
  {key:'not_found_page',label:'404 page'},
  {key:'career_jobs',label:'Career jobs'},
  {key:'career_applications',label:'Applications'},
  {key:'about_page',label:'About page'},
  {key:'careers_page',label:'Careers page'},
  {key:'sustainability',label:'Sustainability articles'},
  {key:'sustainability_goals',label:'Sustainability goals'},
  {key:'sustainability_page',label:'Sustainability page'},
  {key: 'news', label: 'News articles'},
  {key: 'news_taxonomies', label: 'News categories and tags'},
  {key: 'news_page', label: 'News page'},
  {key: 'home_sections', label: 'Home page'},
  {key: 'downloads_page', label: 'Downloads page'},
  {key: 'quality_page', label: 'Quality page'},
  {key: 'certifications', label: 'Certifications'},
  {key: 'certification_types', label: 'Certification types'},
  {key: 'products', label: 'Products'},
  {key: 'product_categories', label: 'Product categories'},
  {key: 'content_translations', label: 'Translations'},
  {key: 'website_settings', label: 'Website settings'},
  {key: 'admins', label: 'Admins'},
  {key: 'roles', label: 'Roles'},
] as const

export const adminActions = ['view', 'create', 'edit', 'delete'] as const

export type AdminResource = (typeof adminResources)[number]['key']
export type AdminAction = (typeof adminActions)[number]
export type RolePermissions = Partial<Record<AdminResource, AdminAction[]>>
export type AdminCapabilities = Record<AdminAction, boolean>

export function emptyRolePermissions(): RolePermissions {
  return Object.fromEntries(adminResources.map(({key}) => [key, []])) as RolePermissions
}

export function fullRolePermissions(): RolePermissions {
  return Object.fromEntries(adminResources.map(({key}) => [key, [...adminActions]])) as RolePermissions
}

export function normalizeRolePermissions(value: unknown): RolePermissions {
  const input = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const permissions = emptyRolePermissions()

  for (const {key} of adminResources) {
    const actions = Array.isArray(input[key]) ? input[key] : []
    permissions[key] = adminActions.filter((action) => actions.includes(action))
  }

  return permissions
}

export function hasAdminPermission(permissions: RolePermissions, resource: AdminResource, action: AdminAction) {
  return permissions[resource]?.includes(action) ?? false
}
