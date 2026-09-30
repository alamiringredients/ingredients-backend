import {defineSeeder} from '@holo-js/db'

export default defineSeeder({
  name: 'database',
  async run({call}) {
    await call('roles')
    await call('admin')
    await call('users')
    await call('website_settings')
    await call('home_page')
    await call('careers_about')
    await call('managed_pages')
    await call('downloads_page')
    await call('quality_page')
    await call('content_translations')
    await call('media')
    await call('product_catalog')
    await call('certifications')
    await call('news')
    await call('sustainability_goals')
    await call('sustainability')
    await call('events')
  },
})
