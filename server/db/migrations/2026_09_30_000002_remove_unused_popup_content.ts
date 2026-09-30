import {DB,defineMigration} from '@holo-js/db'
import type {HomeSectionContent} from '@/lib/cms/contracts'

const activeSources=new Set([
  'Upcoming event','Meet us at','Book a meeting','View all','Not right now','Close announcement',
  'Request a quote','Tell us what you','need.',
  'Sealed 1 kg sample plus the technical data sheet within five business days. No obligation.','Close',
  'Cookie notice','cookie notice','Accept all','Essential only',
  'We use essential cookies to run this site and optional analytics cookies to understand which pages buyers use. Read the',
])

export default defineMigration({
  async up(){
    const row=await DB.table('home_sections').where('section_key','overlays').first()
    if(!row)return
    const content=(typeof row.content==='string'?JSON.parse(row.content):row.content) as HomeSectionContent
    content.texts=content.texts.filter(field=>activeSources.has(field.source))
    content.richTexts=content.richTexts?.filter(field=>field.sources.every(source=>activeSources.has(source)))
    content.assets=content.assets.filter(asset=>asset.source!=='/assets/photos/team-corridor.webp')
    await DB.table('home_sections').where('id',Number(row.id)).update({content:JSON.stringify(content)})
  },
  async down(){},
})
