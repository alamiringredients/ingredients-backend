import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function restoreVisionLayout(value:Json):void{
  const visit=(node:unknown):void=>{
    if(Array.isArray(node)){node.forEach(visit);return}
    if(!node||typeof node!=='object')return
    const block=node as Json
    const attrs=(block.attrs as Json|undefined)??{}
    if(block.type==='contentSection'&&attrs.id==='vision'){
      const header=(block.content as Json[]|undefined)?.find(child=>child.type==='sectionHeader')
      if(header)header.attrs={...((header.attrs as Json|undefined)??{}),width:'wide',layout:'split'}
    }
    Object.values(block).forEach(visit)
  }
  visit(value.body)
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','about').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    restoreVisionLayout(value)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
