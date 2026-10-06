import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import cache from '@holo-js/cache'
import type {AboutContent, CareersContent} from '@/lib/careers/contracts'
import {aboutSectionKeys} from '@/lib/careers/contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
import {requireContent} from '@/lib/cms/stored-json'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await cache.rememberForever(contentCacheKeyForPage('about', locale), async () => {
    const setting = await WebsiteSetting.where('setting_key', 'about').firstJson()
    if (!setting) throw new Error('About page content is missing. Run the careers_about seeder.')
    const page = requireContent<AboutContent & CareersContent>(setting.value, 'About page')
    return {
      ...page,
      sectionVisibility: sectionVisibility(page.sectionVisibility, aboutSectionKeys),
    }
    })
    return Response.json({data: await resolveMediaReferences(data)}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public about request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
