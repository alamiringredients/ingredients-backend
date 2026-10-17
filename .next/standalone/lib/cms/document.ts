import {validateDocument,emptyDocument} from '@/lib/editor/document'
import {cmsLocales,type LocalizedDocument} from './contracts'
export const emptyLocalizedDocument=():LocalizedDocument=>({en:emptyDocument(),ar:emptyDocument(),fr:emptyDocument()})
export function localizedDocument(input:unknown):LocalizedDocument {
  if(!input||typeof input!=='object')throw new Error('Formatted text is missing.')
  return Object.fromEntries(cmsLocales.map(locale=>{
    const doc=validateDocument((input as Record<string,unknown>)[locale])
    if(doc.content.some(n=>n.type!=='paragraph'||n.content?.some(c=>c.type!=='text'&&c.type!=='hardBreak')))throw new Error('Only inline formatting is allowed in this field.')
    return [locale,doc]
  })) as LocalizedDocument
}
