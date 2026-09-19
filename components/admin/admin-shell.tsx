'use client'

import Link from 'next/link'
import Image from 'next/image'
import {usePathname} from 'next/navigation'
import {useEffect, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {AccountMenu} from '@/components/admin/account-menu'
import {hasAdminPermission, type AdminResource, type RolePermissions} from '@/lib/admin/access'

const sidebarStorageKey = 'alamir-admin-sidebar'

type IconName =
  | 'dashboard'
  | 'home'
  | 'about'
  | 'products'
  | 'product-categories'
  | 'quality'
  | 'certifications'
  | 'certification-types'
  | 'sustainability-page'
  | 'sustainability-articles'
  | 'careers-page'
  | 'jobs'
  | 'applications'
  | 'news-page'
  | 'articles'
  | 'news-categories'
  | 'tags'
  | 'downloads'
  | 'translations'
  | 'admins'
  | 'roles'

type NavigationLink = {
  href: string
  label: string
  icon: IconName
  resource: AdminResource | null
}

type NavigationTooltip = {
  instant: boolean
  label: string
  left: number
  top: number
}

const navigationGroups: {label: string; links: NavigationLink[]}[] = [
  {
    label: 'Overview',
    links: [
      {href: '/admin', label: 'Dashboard', icon: 'dashboard', resource: null},
      {href: '/admin/home', label: 'Home page', icon: 'home', resource: 'home_sections'},
      {href:'/admin/about',label:'About page',icon:'about',resource:'about_page'},
    ],
  },
  {
    label: 'Products',
    links: [
      {href: '/admin/products-page', label: 'Products page', icon: 'products', resource: 'products_page'},
      {href: '/admin/products', label: 'Products', icon: 'products', resource: 'products'},
      {href: '/admin/product-filters/applications', label: 'Applications', icon: 'products', resource: 'product_filters'},
      {href: '/admin/product-filters/concentrations', label: 'Concentrations', icon: 'products', resource: 'product_filters'},
      {href: '/admin/product-categories', label: 'Product categories', icon: 'product-categories', resource: 'product_categories'},
    ],
  },
  {
    label:'Events',
    links:[
      {href:'/admin/events-page',label:'Events page',icon:'news-page',resource:'events_page'},
      {href:'/admin/events',label:'Events & appointments',icon:'articles',resource:'events'},
    ],
  },
  {
    label:'Contact',
    links:[
      {href:'/admin/contact',label:'Contact page',icon:'about',resource:'contact_page'},
      {href:'/admin/enquiries',label:'Enquiries',icon:'applications',resource:'contact_enquiries'},
      {href:'/admin/book-a-meeting',label:'Book a meeting page',icon:'careers-page',resource:'book_meeting_page'},
    ],
  },
  {
    label: 'Quality',
    links: [
      {href: '/admin/quality', label: 'Quality page', icon: 'quality', resource: 'quality_page'},
      {href: '/admin/certifications', label: 'Certifications', icon: 'certifications', resource: 'certifications'},
      {href: '/admin/certification-types', label: 'Certification types', icon: 'certification-types', resource: 'certification_types'},
    ],
  },
  {
    label: 'Sustainability',
    links: [
      {href:'/admin/sustainability-page',label:'Sustainability page',icon:'sustainability-page',resource:'sustainability_page'},
      {href:'/admin/sustainability',label:'Sustainability articles',icon:'sustainability-articles',resource:'sustainability'},
    ],
  },
  {
    label: 'Careers',
    links: [
      {href:'/admin/careers-page',label:'Careers page',icon:'careers-page',resource:'careers_page'},
      {href:'/admin/careers',label:'Job openings',icon:'jobs',resource:'career_jobs'},
      {href:'/admin/applications',label:'Applications',icon:'applications',resource:'career_applications'},
    ],
  },
  {
    label: 'News',
    links: [
      {href:'/admin/news-page',label:'News page',icon:'news-page',resource:'news_page'},
      {href:'/admin/news',label:'Articles',icon:'articles',resource:'news'},
      {href:'/admin/news-categories',label:'Categories',icon:'news-categories',resource:'news_taxonomies'},
      {href:'/admin/news-tags',label:'Tags',icon:'tags',resource:'news_taxonomies'},
    ],
  },
  {
    label: 'Downloads',
    links: [
      {href: '/admin/downloads', label: 'Downloads page', icon: 'downloads', resource: 'downloads_page'},
    ],
  },
  {
    label: 'Language',
    links: [
      {href: '/admin/translations', label: 'Translations', icon: 'translations', resource: 'content_translations'},
    ],
  },
  {
    label:'Utility pages',
    links:[
      {href:'/admin/privacy',label:'Privacy page',icon:'quality',resource:'privacy_page'},
      {href:'/admin/terms',label:'Terms page',icon:'quality',resource:'terms_page'},
      {href:'/admin/cookies',label:'Cookies page',icon:'quality',resource:'cookies_page'},
      {href:'/admin/search',label:'Search page',icon:'news-page',resource:'search_page'},
      {href:'/admin/thank-you',label:'Thank-you page',icon:'about',resource:'thank_you_page'},
      {href:'/admin/404',label:'404 page',icon:'about',resource:'not_found_page'},
    ],
  },
  {
    label: 'Access control',
    links: [
      {href: '/admin/admins', label: 'Admins', icon: 'admins', resource: 'admins'},
      {href: '/admin/roles', label: 'Roles', icon: 'roles', resource: 'roles'},
    ],
  },
]

function NavigationIcon({name}: {name: IconName}) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    about: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/></>,
    products: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z"/><path d="M12 11v10"/></>,
    'product-categories': <><rect x="3" y="3" width="7" height="7" rx="2"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="m7 14-4 7h8l-4-7Z"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    quality: <><circle cx="12" cy="9" r="6"/><path d="m9.5 9 1.7 1.7L15 7"/><path d="m8 14-1 7 5-3 5 3-1-7"/></>,
    certifications: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m8 15 2 2 5-5"/></>,
    'certification-types': <><path d="M12 2 15 5l4-.5.5 4 3 3-3 3-.5 4-4-.5-3 3-3-3-4 .5-.5-4-3-3 3-3 .5-4 4 .5 3-3Z"/><circle cx="12" cy="11.5" r="3"/></>,
    'sustainability-page': <><path d="M20.8 3.2C13.5 3.4 7.4 5.4 5 10.1c-1.9 3.7.2 7.8 4.3 7.8 6.5 0 9.8-7.1 11.5-14.7Z"/><path d="M3 21c2.2-5.2 6-8.7 11.5-11"/></>,
    'sustainability-articles': <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/><path d="M16.5 7.5c-1.5.1-2.4.7-3.5 2"/></>,
    'careers-page': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M17 11a4 4 0 0 1 4 4v2"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></>,
    jobs: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/><path d="M10 12v2h4v-2"/></>,
    applications: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><circle cx="10" cy="13" r="2"/><path d="M7 19a3 3 0 0 1 6 0"/></>,
    'news-page': <><path d="M4 4h14a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Z"/><path d="M4 16H2V6"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></>,
    articles: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/></>,
    'news-categories': <><path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2"/><path d="M3 9h18l-2 11H5L3 9Z"/></>,
    tags: <><path d="M12.6 3H5v7.6L14.4 20l7.6-7.6L12.6 3Z"/><circle cx="8.5" cy="7.5" r="1"/><path d="m3 14 7 7"/></>,
    downloads: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    translations: <><path d="M4 5h10"/><path d="M9 3v2c0 5-2 8-6 10"/><path d="M5 9c2 3 5 5 8 6"/><path d="m15 21 3-8 3 8"/><path d="M16 18h4"/></>,
    admins: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></>,
    roles: <><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
  }

  return <svg className="admin-nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

export function AdminShell({children, adminName, access, pendingApplicationsCount = 0, frontendUrl}: {children: ReactNode; adminName: string; pendingApplicationsCount?: number; frontendUrl: string; access: {owner: boolean; permissions: RolePermissions}}) {
  const [collapsed, setCollapsed] = useState(false)
  const [tooltip, setTooltip] = useState<NavigationTooltip | null>(null)
  const tooltipDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipWarmRef = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(sidebarStorageKey) === 'collapsed')

    return () => {
      if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current)
      if (tooltipCooldownRef.current) clearTimeout(tooltipCooldownRef.current)
    }
  }, [])

  function toggleSidebar() {
    const nextCollapsed = !collapsed
    setTooltip(null)
    setCollapsed(nextCollapsed)
    window.localStorage.setItem(sidebarStorageKey, nextCollapsed ? 'collapsed' : 'expanded')
  }

  function showTooltip(event: MouseEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>, label: string, fromKeyboard = false) {
    if (!collapsed && window.innerWidth > 800) return
    if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current)
    if (tooltipCooldownRef.current) clearTimeout(tooltipCooldownRef.current)

    const linkRect = event.currentTarget.getBoundingClientRect()
    const sidebarRect = event.currentTarget.closest('.admin-sidebar')?.getBoundingClientRect()
    const instant = fromKeyboard || tooltipWarmRef.current
    const reveal = () => {
      setTooltip({instant, label, left: (sidebarRect?.right ?? linkRect.right) + 12, top: linkRect.top + linkRect.height / 2})
      tooltipWarmRef.current = true
    }

    if (instant) reveal()
    else tooltipDelayRef.current = setTimeout(reveal, 250)
  }

  function hideTooltip() {
    if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current)
    setTooltip(null)
    tooltipCooldownRef.current = setTimeout(() => {
      tooltipWarmRef.current = false
    }, 400)
  }

  return <div className={`admin-shell${collapsed ? ' is-collapsed' : ''}`}>
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="admin-mark"><Image src="/assets/icon.svg" width={25} height={21} alt="" unoptimized/></span><span className="admin-brand-name">Alamir admin</span></div>
      <button className="admin-collapse" type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.5 5-5 5 5 5"/></svg>
      </button>
      <nav aria-label="Admin navigation">
        {navigationGroups.map((group) => {
          const visibleLinks = group.links.filter((link) => !link.resource || access.owner || hasAdminPermission(access.permissions, link.resource, 'view'))
          if (visibleLinks.length === 0) return null

          return <div className="admin-nav-group" key={group.label}>
            <span className="admin-nav-group-label">{group.label}</span>
            <div className="admin-nav-items">
              {visibleLinks.map((link) => {
                const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(`${link.href}/`))
                return <Link className={active ? 'active' : ''} href={link.href} key={link.href} aria-current={active ? 'page' : undefined} onMouseEnter={(event) => showTooltip(event, link.label)} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event, link.label, true)} onBlur={hideTooltip}>
                  <NavigationIcon name={link.icon}/>
                  <span className="admin-nav-label">{link.label}</span>
                  {link.resource === 'career_applications' && pendingApplicationsCount > 0 && <span className="admin-nav-count" aria-label={`${pendingApplicationsCount} pending applications`}>{pendingApplicationsCount}</span>}
                </Link>
              })}
            </div>
          </div>
        })}
      </nav>
      <AccountMenu adminName={adminName} canViewSettings={access.owner || hasAdminPermission(access.permissions, 'website_settings', 'view')} frontendUrl={frontendUrl}/>
    </aside>
    {typeof document !== 'undefined' && tooltip && createPortal(<span className="admin-nav-floating-tooltip" data-instant={tooltip.instant || undefined} style={{left: tooltip.left, top: tooltip.top}} aria-hidden="true">{tooltip.label}</span>, document.body)}
    <main className="admin-content">{children}</main>
  </div>
}
