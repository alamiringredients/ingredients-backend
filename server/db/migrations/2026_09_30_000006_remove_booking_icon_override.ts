import {DB,defineMigration} from '@holo-js/db'
import type {ManagedPageContent} from '@/lib/cms/contracts'

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','book-a-meeting').first()
    if(!row)return
    const content=(typeof row.value==='string'?JSON.parse(row.value):row.value) as ManagedPageContent
    for(const section of content.sections)section.assets=section.assets.filter(asset=>asset.source!=='/assets/icon.svg')
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(content)})
  },
  async down(){},
})
