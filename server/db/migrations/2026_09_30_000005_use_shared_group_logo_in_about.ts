import {DB,defineMigration} from '@holo-js/db'

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','about').first()
    if(!row)return
    const content=typeof row.value==='string'?JSON.parse(row.value):row.value
    const visit=(value:unknown)=>{
      if(Array.isArray(value)){value.forEach(visit);return}
      if(!value||typeof value!=='object')return
      const node=value as {type?:string;attrs?:Record<string,unknown>}
      if(node.type==='textStatistics'&&['/assets/logo-group-mark.webp','/assets/logo.webp'].includes(String(node.attrs?.markSrc))){
        node.attrs!.markSrc=''
        node.attrs!.useGroupLogo=true
      }
      Object.values(value).forEach(visit)
    }
    visit(content)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(content)})
  },
  async down(){},
})
