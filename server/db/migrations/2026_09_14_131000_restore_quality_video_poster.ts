import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function restorePoster(node:unknown):void{
  if(Array.isArray(node)){node.forEach(restorePoster);return}
  if(!node||typeof node!=='object')return
  const block=node as Json,attrs=block.attrs as Json|undefined
  if(block.type==='video'&&attrs?.source==='embed'&&String(attrs.label??'').includes('Sample film'))attrs.poster='/assets/photos/field-film-poster.webp'
  Object.values(block).forEach(restorePoster)
}

export default defineMigration({
  async up(){
    const quality=await DB.table('website_settings').where('setting_key','quality').first()
    if(!quality)return
    const value=(typeof quality.value==='string'?JSON.parse(quality.value):quality.value) as Json
    restorePoster(value)
    await DB.table('website_settings').where('id',Number(quality.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
