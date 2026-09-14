import {DB,defineMigration} from '@holo-js/db'
import {getEnquiryInterfaceDefinitions} from '../seed-data/enquiry-interface-definitions'
import {getCareersInterfaceDefinitions} from '../seed-data/careers-interface'

type Json=Record<string,unknown>

function json(value:unknown):Json{
  return (typeof value==='string'?JSON.parse(value):value) as Json
}

function addSampleFilmPoster(node:unknown):void{
  if(Array.isArray(node)){node.forEach(addSampleFilmPoster);return}
  if(!node||typeof node!=='object')return
  const block=node as Json,attrs=block.attrs as Json|undefined
  if(block.type==='video'&&attrs?.source==='embed'&&String(attrs.label??'').includes('Sample film'))attrs.poster='/assets/photos/field-film-poster.webp'
  Object.values(block).forEach(addSampleFilmPoster)
}

function removeDuplicateColdBreakCaption(content:Json):void{
  const page=content.page as Json|undefined
  const blocks=page?.blocks
  if(!Array.isArray(blocks))return
  for(const block of blocks as Json[]){
    if(block.key!=='section-1'||!Array.isArray(block.texts))continue
    block.texts=(block.texts as Json[]).filter(text=>!(text.id==='text-3'&&text.source==='Cold Break concentrate'))
  }
}

export default defineMigration({
  async up(){
    const quality=await DB.table('website_settings').where('setting_key','quality').first()
    if(quality){
      const value=json(quality.value)
      addSampleFilmPoster(value)
      await DB.table('website_settings').where('id',Number(quality.id)).update({value:JSON.stringify(value)})
    }

    const coldBreak=await DB.table('products').where('slug','cold-break').first()
    if(coldBreak){
      const translations=await DB.table('product_translations').where('product_id',Number(coldBreak.id)).get()
      for(const translation of translations){
        const content=json(translation.content)
        removeDuplicateColdBreakCaption(content)
        await DB.table('product_translations').where('id',Number(translation.id)).update({content:JSON.stringify(content)})
      }
    }

    const definitions=[
      ...getEnquiryInterfaceDefinitions().filter(entry=>entry.key.includes('Placeholder')||entry.key.includes('required')||entry.key.endsWith('validEmail')),
      ...getCareersInterfaceDefinitions().filter(entry=>entry.key==='careers.interface.home'),
    ]
    for(const entry of definitions){
      let translation=await DB.table('content_translations').where('translation_key',entry.key).first()
      if(!translation){
        await DB.table('content_translations').insert({translation_key:entry.key,page:entry.page,source:entry.source})
        translation=await DB.table('content_translations').where('translation_key',entry.key).first()
      }
      for(const [locale,value] of Object.entries(entry.translations)){
        const saved=await DB.table('content_translation_values').where('translation_id',Number(translation!.id)).where('locale',locale).first()
        if(saved)await DB.table('content_translation_values').where('id',Number(saved.id)).update({value})
        else await DB.table('content_translation_values').insert({translation_id:Number(translation!.id),locale,value})
      }
      if(!await DB.table('translation_seed_keys').where('translation_key',entry.key).first())await DB.table('translation_seed_keys').insert({translation_key:entry.key})
    }
  },
  async down(){},
})
