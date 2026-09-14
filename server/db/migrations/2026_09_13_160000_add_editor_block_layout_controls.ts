import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

const blockTypes=new Set(['paragraph','heading','bulletList','orderedList','blockquote','horizontalRule','image','gallery','facts','textStatistics','columns','video','callout','contentSection','dataTable','sectionHeader','aboutProfile','valuesRail','certificationPanel','mediaCards','pillars'])

function visit(value:unknown,about=false):void{
  if(Array.isArray(value)){value.forEach(item=>visit(item,about));return}
  if(!value||typeof value!=='object')return
  const node=value as Json
  if(typeof node.type==='string'&&blockTypes.has(node.type)){
    const current=(node.attrs as Json|undefined)??{}
    const attrs:Json={...current,visible:current.visible!==false}
    if(node.type==='columns')attrs.verticalAlign=about?'center':attrs.verticalAlign??'start'
    if(['image','gallery','video'].includes(node.type))attrs.captionPosition=attrs.captionPosition??'below'
    node.attrs=attrs
  }
  Object.values(node).forEach(child=>visit(child,about))
}

function addSustainabilityHero(value:Json):void{
  const sections=value.sections as Json[]|undefined
  const hero=sections?.find(section=>section.key==='section-0')
  if(!hero)return
  const assets=hero.assets as Json[]
  if(!assets.some(asset=>asset.id==='hero-image'))assets.push({id:'hero-image',label:'Hero image',kind:'image',source:'/assets/photos/value-06-sustainability.webp',value:'/assets/photos/value-06-sustainability.webp'})
  const texts=hero.texts as Json[]
  const fields=[
    {id:'sustainability-kicker',label:'Small label',source:'Sustainability',values:{ar:'الاستدامة',en:'Sustainability',fr:'Durabilité'}},
    {id:'sustainability-hero-alt',label:'Hero image alternative text',source:'Drip irrigation lines between young tomato plants at dawn',values:{ar:'خطوط الري بالتنقيط بين نباتات الطماطم الصغيرة عند الفجر',en:'Drip irrigation lines between young tomato plants at dawn',fr:"Lignes d'irrigation goutte à goutte entre de jeunes plants de tomates à l'aube"}},
  ]
  for(const field of fields)if(!texts.some(item=>item.id===field.id))texts.push(field)
}

export default defineMigration({
  async up(){
    for(const key of ['about','quality','sustainability']){
      const row=await DB.table('website_settings').where('setting_key',key).first()
      if(!row)continue
      const value=(typeof row.value==='string'?JSON.parse(row.value):row.value) as Json
      visit(value,key==='about')
      if(key==='sustainability')addSustainabilityHero(value)
      await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(value)})
    }
  },
  async down(){},
})
