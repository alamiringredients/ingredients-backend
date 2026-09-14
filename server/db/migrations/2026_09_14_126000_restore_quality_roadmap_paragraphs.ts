import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function restoreRoadmapParagraphs(document:unknown):void{
  if(!document||typeof document!=='object')return
  const sections=((document as Json).content as Json[]|undefined)??[]
  const roadmap=sections.find(section=>section.type==='contentSection'&&(section.attrs as Json|undefined)?.id==='roadmap')
  if(!roadmap)return
  const content=(roadmap.content as Json[]|undefined)??[]
  const headerIndex=content.findIndex(node=>node.type==='sectionHeader')
  const paragraph=content[headerIndex+1]
  if(paragraph?.type!=='paragraph'||!Array.isArray(paragraph.content))return
  const separator=(paragraph.content as Json[]).findIndex(node=>node.type==='text'&&node.text===' '&&Object.keys(node).length===2)
  if(separator<1||separator===paragraph.content.length-1)return
  const before=(paragraph.content as Json[]).slice(0,separator)
  const after=(paragraph.content as Json[]).slice(separator+1)
  content.splice(headerIndex+1,1,
    {...paragraph,attrs:{...((paragraph.attrs as Json|undefined)??{}),variant:'body'},content:before},
    {type:'paragraph',attrs:{variant:'lead'},content:after},
  )
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','quality').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    const body=value.body as Json|undefined
    if(body)Object.values(body).forEach(restoreRoadmapParagraphs)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
