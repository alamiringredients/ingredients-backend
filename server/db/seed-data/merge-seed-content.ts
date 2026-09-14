import type {LocalizedValue} from '@/lib/cms/contracts'

const isObject=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
const identityKeys=['seedKey','key','id','source','slug'] as const

function isLocalizedSeed(value:unknown):value is LocalizedValue {
  return isObject(value)&&typeof value.en==='string'&&typeof value.ar==='string'&&typeof value.fr==='string'
}

function backfillLocalized(current:Partial<LocalizedValue>|undefined,seed:LocalizedValue):LocalizedValue {
  const en=current?.en||seed.en
  const missing=(value:string|undefined)=>!value||value===en||value===seed.en
  return {en,ar:missing(current?.ar)?seed.ar:current!.ar!,fr:missing(current?.fr)?seed.fr:current!.fr!}
}

function matchingSeed(current:unknown,index:number,seeds:unknown[]) {
  if(isObject(current)) {
    let identified=false
    for(const key of identityKeys) {
      if(current[key]===undefined) continue
      identified=true
      const match=seeds.find(item=>isObject(item)&&item[key]===current[key])
      if(match!==undefined) return match
    }
    if(identified) return undefined
  }
  return seeds[index]
}

export function mergeSeedContent<T>(current:unknown,seed:T):T {
  if(isObject(seed)&&seed.type==='doc')return structuredClone(isObject(current)&&current.type==='doc'?current:seed) as T
  if(isLocalizedSeed(seed)) return backfillLocalized(isObject(current)?current:{},seed) as T
  if(Array.isArray(seed)) {
    if(!Array.isArray(current)) return structuredClone(seed)
    const merged=current.map((item,index)=>mergeSeedContent(item,matchingSeed(item,index,seed)))
    const identities=new Set(current.flatMap(item=>isObject(item)?identityKeys.flatMap(key=>item[key]===undefined?[]:[`${key}:${String(item[key])}`]):[]))
    for(const [index,item] of seed.entries()) {
      const identifiable=isObject(item)&&identityKeys.some(key=>item[key]!==undefined)
      const known=identifiable&&identityKeys.some(key=>item[key]!==undefined&&identities.has(`${key}:${String(item[key])}`))
      if((identifiable&&!known)||(!identifiable&&index>=current.length)) merged.push(structuredClone(item))
    }
    return merged as T
  }
  if(isObject(seed)) {
    const saved=isObject(current)?current:{}
    return Object.fromEntries(Object.entries(seed).map(([key,value])=>[key,mergeSeedContent(saved[key],value)]).concat(Object.entries(saved).filter(([key])=>!(key in seed)))) as T
  }
  return (current===undefined||current===null?seed:current) as T
}

export function upgradeSeedContent<T>(
  current: unknown,
  previousSeed: unknown,
  nextSeed: T,
): T {
  if (JSON.stringify(current) === JSON.stringify(previousSeed))
    return structuredClone(nextSeed);
  if (isObject(nextSeed)) {
    if (!isObject(current) || !isObject(previousSeed))
      return mergeSeedContent(current, nextSeed);
    if (nextSeed.type === "doc") return current as T;
    return Object.fromEntries(
      Object.entries(nextSeed).map(([key, value]) => [
        key,
        upgradeSeedContent(current[key], previousSeed[key], value),
      ]),
    ) as T;
  }
  if (Array.isArray(nextSeed)) return current as T;
  return (current === undefined || current === previousSeed
    ? nextSeed
    : current) as T;
}
