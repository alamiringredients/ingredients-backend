import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function normalize(document:unknown):void{
  if(!document||typeof document!=='object')return
  const sections=((document as Json).content as Json[]|undefined)??[]
  for(const section of sections){
    const attrs=(section.attrs as Json|undefined)??{}
    if(section.type!=='contentSection'||(attrs.id!=='credentials'&&attrs.id!=='roadmap'))continue
    const content=(section.content as Json[]|undefined)??[]
    const header=content.find(node=>node.type==='sectionHeader')
    if(!header||!Array.isArray(header.content))continue
    const introductionIndex=(header.content as Json[]).findIndex(node=>node.type==='paragraph')
    if(introductionIndex<0)continue
    const [introduction]=(header.content as Json[]).splice(introductionIndex,1)
    const headerIndex=content.indexOf(header)
    if(attrs.id==='roadmap'&&content[headerIndex+1]?.type==='paragraph'){
      const continuation=content.splice(headerIndex+1,1)[0]
      introduction.content=[...((introduction.content as Json[]|undefined)??[]),{type:'text',text:' '},...((continuation.content as Json[]|undefined)??[])]
      introduction.attrs={...((introduction.attrs as Json|undefined)??{}),variant:'lead'}
    }
    content.splice(headerIndex+1,0,introduction)
  }
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','quality').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    const body=value.body as Json|undefined
    if(body)Object.values(body).forEach(normalize)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
