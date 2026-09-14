import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function restoreHeadingLayout(value:Json):void{
  const visit=(node:unknown):void=>{
    if(Array.isArray(node)){node.forEach(visit);return}
    if(!node||typeof node!=='object')return
    const block=node as Json
    if(block.type==='sectionHeader')block.attrs={...((block.attrs as Json|undefined)??{}),width:'wide',singleLine:true}
    Object.values(block).forEach(visit)
  }
  visit(value.body)
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','quality').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    restoreHeadingLayout(value)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
