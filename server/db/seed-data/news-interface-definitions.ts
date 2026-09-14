import seed from './news.json'
import type {TranslationEntry} from '@/lib/translation-catalog'
export function getNewsInterfaceDefinitions():TranslationEntry[]{
  return Object.entries(seed.interfaceLabels).map(([key,value])=>({key:`news.interface.${key}`,page:'news-interface',...value}))
}
