import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>
type Stat={id:string;label:string;value:number}

const defaults:Stat[]=[
  {id:'founded',label:'Founded year',value:1970},
  {id:'export-markets',label:'Export markets',value:60},
  {id:'exported-yearly',label:'Exported per year (thousand MT)',value:140},
  {id:'imported-yearly',label:'Imported per year (thousand MT)',value:140},
  {id:'exhibitions-yearly',label:'Exhibitions per year',value:14},
]

export default defineMigration({
  async up(){
    const row=await DB.table('home_sections').where('section_key','figures').first()
    if(!row)return
    const content=(typeof row.content==='string'?JSON.parse(row.content):row.content) as Json
    const current=Array.isArray(content.stats)?content.stats as Stat[]:[]
    const ids=new Set(current.map(stat=>stat.id))
    content.stats=[...current,...defaults.filter(stat=>!ids.has(stat.id))]
    await DB.table('home_sections').where('id',Number(row.id)).update({content:JSON.stringify(content)})
  },
  async down(){},
})
