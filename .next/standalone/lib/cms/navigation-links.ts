export function isInternalNavigationUrl(value:unknown):boolean {
  if(typeof value!=='string'||!value.trim())return false
  const url=value.trim()
  if(/^(?:https?:\/\/|mailto:|tel:|\/\/)/i.test(url))return false
  if(/^\/(?:assets|storage)\//.test(url))return false
  return true
}

export function removeInternalNavigationLinks<T>(content:T):T {
  if(Array.isArray(content))return content.map(removeInternalNavigationLinks) as T
  if(!content||typeof content!=='object')return content
  return Object.fromEntries(Object.entries(content).map(([key,value])=>[
    key,
    key==='links'&&Array.isArray(value)
      ? value.filter(link=>!isInternalNavigationUrl(link.source)&&!isInternalNavigationUrl(link.value))
      : removeInternalNavigationLinks(value),
  ])) as T
}
