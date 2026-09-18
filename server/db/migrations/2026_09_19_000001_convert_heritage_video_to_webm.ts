import {DB,defineMigration} from '@holo-js/db'

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','about').first()
    if(!row)return
    const value=typeof row.value==='string'?row.value:JSON.stringify(row.value)
    const updated=value.replaceAll('/assets/videos/heritage-vine.mp4','/assets/videos/heritage-vine.webm')
    if(updated!==value)await DB.table('website_settings').where('id',Number(row.id)).update({value:updated})
  },
  async down(){},
})
