import assert from 'node:assert/strict'
import {test} from 'node:test'
import {renderToStaticMarkup} from 'react-dom/server'
import {HomeContentManager} from '../components/admin/home-content-manager'
import {SettingsManager} from '../components/admin/settings-manager'
import {DownloadsManager} from '../components/admin/downloads-manager'
import {ManagedPageManager} from '../components/admin/managed-page-manager'
import {getHomePageSeedContent} from '../server/db/seeders/HomePageSeeder'
import {getWebsiteSettingsSeedContent} from '../server/db/seeders/WebsiteSettingsSeeder'
import {getDownloadsPageSeedContent} from '../server/db/seeders/DownloadsPageSeeder'

const managers = {
  Home: (canEdit: boolean) => <HomeContentManager canEdit={canEdit} initialData={getHomePageSeedContent()}/>,
  Settings: (canEdit: boolean) => <SettingsManager canEdit={canEdit} initialSettings={getWebsiteSettingsSeedContent()}/>,
  Downloads: (canEdit: boolean) => <DownloadsManager canEdit={canEdit} initialContent={getDownloadsPageSeedContent()}/>,
  'Managed page': (canEdit: boolean) => <ManagedPageManager canEdit={canEdit} page="contact" initialContent={{sections: [{key: 'hero', label: 'Hero', enabled: true, texts: [], assets: [], links: []}], seo: getHomePageSeedContent().seo}}/>,
}

for (const [name, render] of Object.entries(managers)) {
  test(`${name} viewers can browse sections without mutation controls`, () => {
    const html = renderToStaticMarkup(render(false))
    assert.doesNotMatch(html, /Save changes/)
    assert.match(html, /<fieldset[^>]*disabled=""/)
    assert.match(html, /<nav[^>]*class="cms-tabs"/)
  })
  test(`${name} editors can save their changes`, () => {
    const html = renderToStaticMarkup(render(true))
    assert.match(html, /Save changes/)
    assert.doesNotMatch(html, /<fieldset[^>]*disabled=""/)
  })
}
