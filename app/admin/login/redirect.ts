export function adminRedirectPath(value: string | string[] | undefined) {
  if (typeof value !== 'string') return '/admin'
  if (value !== '/admin' && !value.startsWith('/admin/')) return '/admin'
  if (value === '/admin/login' || value.startsWith('/admin/login?')) return '/admin'
  return value
}
