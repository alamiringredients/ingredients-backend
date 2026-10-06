import {DB, defineMigration} from '@holo-js/db'
import type {HomeSectionContent} from '@/lib/cms/contracts'
import source from '../seed-data/site-content.json'

export default defineMigration({
  async up() {
    const row = await DB.table('home_sections').where('section_key', 'header').first()
    if (!row) return
    const content = (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) as HomeSectionContent
    const events = source.home_sections.find(section => section.section_key === 'header')!.content.texts.find(field => field.source === 'Events')!
    content.texts = content.texts.map(field => field.source === 'News' ? {...events, id: field.id} : field)
    await DB.table('home_sections').where('id', Number(row.id)).update({content: JSON.stringify(content)})
  },
  async down() {},
})
