import type {CmsFigureItem,HomeSectionContent,LocalizedValue} from '@/lib/cms/contracts'

const definitions = [
  {id:'founded',unit:'',label:'Founded',description:'Behera, Egypt'},
  {id:'export-markets',unit:'+',label:'Export markets',description:'Across four regions'},
  {id:'exported-yearly',unit:'K',label:'Exported / year',description:'Group-wide'},
  {id:'imported-yearly',unit:'K',label:'Imported / year',description:'Group-wide'},
  {id:'exhibitions-yearly',unit:'+',label:'Exhibitions / yr',description:'Global trade events'},
]

// Used only to upgrade stored content and seed snapshots, never as rendering defaults.
export function migrateHomeFigures(section:HomeSectionContent):HomeSectionContent {
  if(section.figures)return section
  const copy=(source:string):LocalizedValue=>structuredClone(section.texts.find(field=>field.source===source)?.values??{en:'',ar:'',fr:''})
  const figures:CmsFigureItem[]=definitions.flatMap(item=>{
    const stat=section.stats?.find(stat=>stat.id===item.id)
    return stat?[{id:item.id,value:stat.value,unit:item.unit,unitLabel:copy(item.unit==='K'?'MT':''),label:copy(item.label),description:copy(item.description)}]:[]
  })
  const sources=new Set(['MT',...definitions.flatMap(item=>[item.label,item.description])])
  const {stats,...content}=section
  void stats
  return {...content,figures,texts:section.texts.filter(field=>!sources.has(field.source))}
}
