import type {TranslationEntry} from '@/lib/translation-catalog'
export function getSearchInterfaceDefinitions():TranslationEntry[] {
  return [{key:'search.interface.submit',page:'search-interface',source:'Search',translations:{en:'Search',ar:'بحث',fr:'Rechercher'}}]
}
