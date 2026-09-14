import {AdminPageHeader} from '@/components/admin/admin-page-header'
import {CatalogStats} from '@/components/admin/catalog-layout'
import {CatalogStat} from '@/components/admin/catalog-stat'
import Link from 'next/link'
import {getAdminResourceCapabilities} from '@/server/admin/authorization'

export default async function AdminDashboard() {
  const [home, quality, downloads, translations, settings] = await Promise.all([
    getAdminResourceCapabilities('home_sections'),
    getAdminResourceCapabilities('quality_page'),
    getAdminResourceCapabilities('downloads_page'),
    getAdminResourceCapabilities('content_translations'),
    getAdminResourceCapabilities('website_settings'),
  ])
  return <section>
    <AdminPageHeader title="Dashboard" eyebrow="Overview" description="Manage the localized Alamir Ingredients website."/>
    <CatalogStats><CatalogStat icon="box" label="Website pages" value={48}/><CatalogStat icon="category" label="Languages" value={3}/><CatalogStat icon="check" label="Localized routes" value={144}/></CatalogStats>
    {home.view&&<Link className="admin-card-link" href="/admin/home"><span>Home page manager</span><b>Open →</b></Link>}
    {quality.view&&<Link className="admin-card-link" href="/admin/quality"><span>Quality page manager</span><b>Open →</b></Link>}
    {downloads.view&&<Link className="admin-card-link" href="/admin/downloads"><span>Downloads page manager</span><b>Open →</b></Link>}
    {translations.view&&<Link className="admin-card-link" href="/admin/translations"><span>Translation manager</span><b>Open →</b></Link>}
    {settings.view&&<Link className="admin-card-link" href="/admin/settings"><span>Website settings</span><b>Open →</b></Link>}
  </section>
}
