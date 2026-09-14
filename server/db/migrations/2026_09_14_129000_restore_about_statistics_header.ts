import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function plainText(node:unknown):string{
  if(Array.isArray(node))return node.map(plainText).join('')
  if(!node||typeof node!=='object')return ''
  const value=node as Json
  return typeof value.text==='string'?value.text:plainText(value.content)
}

function restoreStatisticsHeader(node:unknown):void{
  if(Array.isArray(node)){node.forEach(restoreStatisticsHeader);return}
  if(!node||typeof node!=='object')return
  const block=node as Json
  const attrs=(block.attrs as Json|undefined)??{}
  if(block.type==='contentSection'&&attrs.id==='story'&&Array.isArray(block.content)){
    const content=block.content as Json[]
    const statisticsIndex=content.findIndex(child=>child.type==='textStatistics')
    if(statisticsIndex>=0){
      const statistics=content[statisticsIndex]
      const statisticsAttrs=(statistics.attrs as Json|undefined)??{}
      const preceding=content[statisticsIndex-1]
      const label=preceding?.type==='paragraph'?plainText(preceding):String(statisticsAttrs.label??'')
      statistics.attrs={
        ...statisticsAttrs,
        label,
        markSrc:'/assets/logo-group-mark.webp',
        markAlt:label,
        markHref:'https://www.alamireg.com/',
      }
      if(preceding?.type==='paragraph')content.splice(statisticsIndex-1,1)
    }
  }
  Object.values(block).forEach(restoreStatisticsHeader)
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','about').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    restoreStatisticsHeader(value)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
