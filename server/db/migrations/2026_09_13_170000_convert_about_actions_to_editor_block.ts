import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

const labels:Record<string,{products:string;quote:string}>={
  ar:{products:'اكتشف منتجاتنا',quote:'طلب عرض أسعار'},
  en:{products:'Explore our products',quote:'Request a quote'},
  fr:{products:'Explorez nos produits',quote:'Demander un devis'},
}

function nodeText(value:unknown):string{
  if(!value||typeof value!=='object')return ''
  const node=value as Json
  if(typeof node.text==='string')return node.text
  return Array.isArray(node.content)?node.content.map(nodeText).join(''):''
}

function replaceActions(document:unknown,locale:string):void{
  if(!document||typeof document!=='object')return
  const content=(document as Json).content
  if(!Array.isArray(content))return
  const copy=labels[locale]
  for(let index=0;index<content.length-1;index++){
    const first=content[index] as Json,second=content[index+1] as Json
    if(copy&&first.type==='paragraph'&&second.type==='paragraph'&&nodeText(first)===copy.products&&nodeText(second)===copy.quote){
      content.splice(index,2,{type:'actions',attrs:{visible:true,items:[
        {label:copy.products,href:'/products',variant:'primary',visible:true},
        {label:copy.quote,href:'/contact',variant:'secondary',visible:true},
      ]}})
      return
    }
    replaceActions(first,locale)
  }
  const last=content.at(-1)
  if(last)replaceActions(last,locale)
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','about').first()
    if(!row)return
    const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
    const body=value.body as Json|undefined
    if(!body)return
    for(const locale of Object.keys(labels))replaceActions(body[locale],locale)
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
  },
  async down(){},
})
