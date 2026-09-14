import {DB,defineMigration} from '@holo-js/db'
import type {CmsLocale,HomeSeoContent,LocalizedValue} from '@/lib/cms/contracts'
import type {ContentDocument,ContentNode} from '@/lib/editor/document'

type Field={values:LocalizedValue}
type Asset={value:string}
type LegacySection={key:string;enabled:boolean;texts:Field[];assets:Asset[]}
type LegacyQuality={sections:LegacySection[];seo:HomeSeoContent}

const locales=['en','ar','fr'] as const
const paragraph=(text:string,variant:'body'|'lead'='body'):ContentNode=>({type:'paragraph',attrs:{variant},content:text?[{type:'text',text}]:[]})
const heading=(start:string,accent:string,id:string):ContentNode=>({type:'heading',attrs:{id,level:2,hideFromContents:false},content:[{type:'text',text:`${start} `},{type:'text',text:accent,marks:[{type:'italic'}]}]})

function convertQuality(value:LegacyQuality){
  const sections=Object.fromEntries(value.sections.map(section=>[section.key,section])) as Record<string,LegacySection>
  const copy=(section:LegacySection,index:number,locale:CmsLocale)=>section.texts[index]?.values[locale]??''
  const header=(section:LegacySection,locale:CmsLocale,id:string):ContentNode=>({type:'sectionHeader',attrs:{eyebrow:copy(section,0,locale),ctaLabel:'',ctaHref:''},content:[heading(copy(section,1,locale),copy(section,2,locale),id),paragraph(copy(section,3,locale))]})
  const body=Object.fromEntries(locales.map(locale=>{
    const credentials=sections.credentials,roadmap=sections.roadmap,technology=sections.technology,sourcing=sections.sourcing
    const content:ContentNode[]=[
      {type:'contentSection',attrs:{id:'credentials',goals:[],theme:'plain'},content:[header(credentials,locale,'credentials-heading'),{type:'certificationPanel',attrs:{holder:'group'}},{type:'paragraph',attrs:{variant:'lead'},content:[{type:'text',text:`${copy(credentials,4,locale)} `},{type:'text',text:copy(credentials,5,locale),marks:[{type:'link',attrs:{href:'/downloads'}}]},{type:'text',text:'.'}]}]},
      {type:'contentSection',attrs:{id:'roadmap',goals:[],theme:'navy'},content:[header(roadmap,locale,'roadmap-heading'),paragraph(copy(roadmap,4,locale),'lead'),{type:'certificationPanel',attrs:{holder:'sadat-city'}}]},
      {type:'contentSection',attrs:{id:'technology',goals:[],theme:'plain'},content:[header(technology,locale,'technology-heading'),{type:'mediaCards',attrs:{items:[0,1,2].map(index=>({image:technology.assets[index]?.value??'',alt:copy(technology,index*3+4,locale),title:copy(technology,index*3+5,locale),description:copy(technology,index*3+6,locale)}))}}]},
      {type:'contentSection',attrs:{id:'sourcing',goals:[],theme:'tint'},content:[header(sourcing,locale,'sourcing-heading'),{type:'video',attrs:{source:'embed',src:sourcing.assets[0]?.value??'',mode:'player',autoplay:false,loop:false,muted:false,controls:true,poster:'',caption:'',label:copy(sourcing,4,locale),ratio:'16/9'}},{type:'pillars',attrs:{items:[5,6,7,8].map(index=>copy(sourcing,index,locale))}}]},
    ]
    return [locale,{type:'doc',content} satisfies ContentDocument]
  })) as Record<CmsLocale,ContentDocument>
  const hero=sections.hero
  return {sectionVisibility:{hero:hero.enabled,body:value.sections.slice(1).some(section=>section.enabled)},hero:{kicker:Object.fromEntries(locales.map(locale=>[locale,copy(hero,0,locale)])),title:Object.fromEntries(locales.map(locale=>[locale,{type:'doc',content:[heading(copy(hero,1,locale),copy(hero,2,locale),'hero-heading')]}])),description:Object.fromEntries(locales.map(locale=>[locale,{type:'doc',content:[paragraph(copy(hero,3,locale))]}])),image:hero.assets[0]?.value??'',alt:Object.fromEntries(locales.map(locale=>[locale,copy(hero,0,locale)]))},body,seo:value.seo}
}

export default defineMigration({
  async up(){
    const row=await DB.table('website_settings').where('setting_key','quality').first()
    if(!row)return
    const stored=row.value
    const value=(typeof stored==='string'?JSON.parse(stored):stored) as LegacyQuality
    if(!Array.isArray(value.sections))return
    await DB.table('website_settings').where('id',Number(row.id)).update({value:JSON.stringify(convertQuality(value))})
  },
  async down(){},
})
