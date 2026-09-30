import {DB,defineMigration} from '@holo-js/db'
import type {HomeSectionContent,WebsiteSettings} from '@/lib/cms/contracts'

export default defineMigration({
  async up(){
    const setting=await DB.table('website_settings').where('setting_key','website').first()
    if(!setting)return
    const settings=(typeof setting.value==='string'?JSON.parse(setting.value):setting.value) as WebsiteSettings
    const rows=await DB.table('home_sections').whereIn('section_key',['footer','figures']).get()
    const sections=rows.map(row=>({row,content:(typeof row.content==='string'?JSON.parse(row.content):row.content) as HomeSectionContent}))
    if(settings.groupLogo===undefined){
      const footer=sections.find(section=>section.row.section_key==='footer')?.content
      const figures=sections.find(section=>section.row.section_key==='figures')?.content
      settings.groupLogo=footer?.assets.find(asset=>asset.source==='/assets/logo.webp')?.value??figures?.assets.find(asset=>asset.source==='/assets/logo-group-mark.webp')?.value??''
      await DB.table('website_settings').where('id',Number(setting.id)).update({value:JSON.stringify(settings)})
    }
    for(const {row,content} of sections){
      content.assets=content.assets.filter(asset=>asset.source!=='/assets/logo.webp'&&asset.source!=='/assets/logo-group-mark.webp')
      await DB.table('home_sections').where('id',Number(row.id)).update({content:JSON.stringify(content)})
    }
  },
  async down(){},
})
