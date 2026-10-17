export type SearchResult = {href:string;title:string;description:string;section:string;text:string}

function normalizeSearch(value:string) {
  return value.normalize('NFKD').replace(/\p{M}/gu,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()
}

export function searchResults(records:SearchResult[],query:string):SearchResult[] {
  const terms=normalizeSearch(query).split(' ').filter(Boolean)
  if(!terms.length)return []
  return records.map(record=>{
    const title=normalizeSearch(record.title)
    const text=normalizeSearch([record.title,record.description,record.section,record.text].join(' '))
    return {record,score:terms.every(term=>text.includes(term))?1+terms.filter(term=>title.includes(term)).length:0}
  }).filter(hit=>hit.score>0).sort((a,b)=>b.score-a.score).map(hit=>hit.record)
}

// Read visible localized content, excluding media paths, links and editor metadata.
export function searchableText(value:unknown,locale:string):string {
  if(typeof value==='string')return value
  if(Array.isArray(value))return value.map(item=>searchableText(item,locale)).join(' ')
  if(!value||typeof value!=='object')return ''
  const record=value as Record<string,unknown>
  if(locale in record)return searchableText(record[locale],locale)
  if(record.enabled===false)return ''
  if(typeof record.type==='string')return [record.text,record.content].map(item=>searchableText(item,locale)).join(' ')
  return Object.entries(record).filter(([key])=>!['source','sources','id','key','label','assets','links','image','hero','heroAlt','logo','badge','tds','seo','icon'].includes(key)).map(([,item])=>searchableText(item,locale)).join(' ')
}
