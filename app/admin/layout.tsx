import {fontStylesheets} from '@/lib/site-font-delivery'
import {sans,arabicDisplay,arabicSans} from '@/lib/site-fonts'
import '@/styles/serif-font.css'
import type {ReactNode} from 'react'
import {getCurrentAdmin} from '@/server/admin/session'
import {redirect} from 'next/navigation'
import {AdminShell} from '@/components/admin/admin-shell'
import {getAdminNavigationAccess} from '@/server/admin/authorization'
import {hasAdminPermission} from '@/lib/admin/access'
import CareerApplication from '@/server/models/CareerApplication'
import {config} from '@holo-js/config'
import './admin.css'
import '@/components/admin/account-menu.css'
import '@/components/admin/article-manager.css'

export default async function AdminLayout({children}: {children: ReactNode}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/login')
  const frontendUrl = config('frontend.url')
  const access = await getAdminNavigationAccess(admin)
  const pendingApplicationsCount = access.owner || hasAdminPermission(access.permissions, 'career_applications', 'view')
    ? await CareerApplication.where('status', 'pending').count()
    : 0

  return <html lang="en" className={`${sans.variable} ${arabicDisplay.variable} ${arabicSans.variable}`}><head><link rel="stylesheet" href={fontStylesheets.latin}/><link rel="stylesheet" href={fontStylesheets.arabic}/></head><body><AdminShell adminName={String(admin.name ?? admin.email ?? 'Administrator')} access={access} pendingApplicationsCount={pendingApplicationsCount} frontendUrl={frontendUrl}>{children}</AdminShell></body></html>
}
