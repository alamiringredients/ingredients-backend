import {authOnly, protectRoutes} from '@holo-js/auth/next/server'
import {NextResponse, type NextRequest} from 'next/server'
import {cors} from '@holo-js/security'
import {csrfProtection} from '@holo-js/security/next/server'
const protectAdmin = protectRoutes(
  authOnly({
    guard: 'admin',
    routes: [pathname => pathname !== '/admin/login' && (pathname === '/admin' || pathname.startsWith('/admin/'))],
    redirectTo: '/admin/login',
  }),
)
const protectCsrf = csrfProtection()

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const preflight = cors.preflight(request)
    if (preflight) return preflight

    // This endpoint sets and returns the same token itself.
    if (request.nextUrl.pathname === '/api/v1/csrf') {
      return cors.apply(request, NextResponse.next())
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !request.headers.get('X-CSRF-TOKEN')) {
      return cors.apply(request, Response.json({ok:false,valid:false,status:419,values:{},errors:{_root:['failed']}}, {status: 419}))
    }
    const csrfResponse = await protectCsrf(request)
    return cors.apply(request, csrfResponse ?? NextResponse.next())
  }

  const authResponse = await protectAdmin(request)
  if (authResponse) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl, authResponse.status)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
