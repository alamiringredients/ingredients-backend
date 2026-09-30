import {DB,defineMigration} from '@holo-js/db'
import type {HomeSectionContent} from '@/lib/cms/contracts'

export default defineMigration({
  async up(){
    const row=await DB.table('home_sections').where('section_key','footer').first()
    if(!row)return
    const content=(typeof row.content==='string'?JSON.parse(row.content):row.content) as HomeSectionContent
    content.assets=content.assets.filter(asset=>asset.source!=='/assets/logo-full.svg')
    await DB.table('home_sections').where('id',Number(row.id)).update({content:JSON.stringify(content)})
  },
  async down(){},
})
