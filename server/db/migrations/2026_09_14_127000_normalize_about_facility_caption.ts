import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

const captions=new Set([
  'Sadat City, Egypt — aseptic production and cold storage.',
  'مدينة السادات، مصر – الإنتاج المعقم والتخزين البارد.',
  'Sadat City, Égypte — production aseptique et stockage à froid.',
])

function plainText(node:unknown):string{
  if(Array.isArray(node))return node.map(plainText).join('')
  if(!node||typeof node!=='object')return ''
  const value=node as Json
  return typeof value.text==='string'?value.text:plainText(value.content)
}

function normalizeFacility(node:unknown):void{
  if(Array.isArray(node)){node.forEach(normalizeFacility);return}
  if(!node||typeof node!=='object')return
  const block=node as Json
  const attrs=(block.attrs as Json|undefined)??{}
  if(block.type==='contentSection'&&attrs.id==='facility'&&Array.isArray(block.content)){
    const content=block.content as Json[]
    const captionIndex=content.findIndex(child=>child.type==='paragraph'&&captions.has(plainText(child)))
    const video=content.find(child=>child.type==='video')
    if(captionIndex>=0&&video){
      video.attrs={...((video.attrs as Json|undefined)??{}),caption:plainText(content[captionIndex])}
      content.splice(captionIndex,1)
    }
  }
  Object.values(block).forEach(normalizeFacility)
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','about').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    normalizeFacility(value)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
