import {DB,defineMigration} from '@holo-js/db'
import type {HomeSectionContent} from '@/lib/cms/contracts'
import {migrateHomeFigures} from '../seed-data/home-figures'

export default defineMigration({
  async up(){
    const row=await DB.table('home_sections').where('section_key','figures').first()
    if(!row)return
    const content=(typeof row.content==='string'?JSON.parse(row.content):row.content) as HomeSectionContent
    await DB.table('home_sections').where('id',Number(row.id)).update({content:JSON.stringify(migrateHomeFigures(content))})
  },
  async down(){},
})
