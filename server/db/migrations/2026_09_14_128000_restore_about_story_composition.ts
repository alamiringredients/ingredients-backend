import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function containsHeritageVideo(node:unknown):boolean{
  if(Array.isArray(node))return node.some(containsHeritageVideo)
  if(!node||typeof node!=='object')return false
  const block=node as Json
  const attrs=(block.attrs as Json|undefined)??{}
  return block.type==='video'&&attrs.src==='/assets/videos/heritage-vine.mp4'
    || Object.values(block).some(containsHeritageVideo)
}

function restoreStoryComposition(node:unknown):void{
  if(Array.isArray(node)){node.forEach(restoreStoryComposition);return}
  if(!node||typeof node!=='object')return
  const block=node as Json
  if(block.type==='columns'&&containsHeritageVideo(block)){
    block.attrs={...((block.attrs as Json|undefined)??{}),layout:'prose-media'}
  }
  if(block.type==='video'){
    const attrs=(block.attrs as Json|undefined)??{}
    if(attrs.src==='/assets/videos/heritage-vine.mp4')block.attrs={...attrs,captionStyle:'ledger'}
  }
  Object.values(block).forEach(restoreStoryComposition)
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','about').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    restoreStoryComposition(value)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
