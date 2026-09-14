import {getSearchInterfaceDefinitions} from './search-interface-definitions'
import {canonicalizeTranslationDefinitions,getTranslationDefinitions,type TranslationEntry} from '@/lib/translation-catalog'
import {getCareersInterfaceDefinitions} from './careers-interface'
import {getCatalogSeedTranslationDefinitions} from './catalog-translation-definitions'
import {getCertificationTranslationDefinitions} from './certification-translation-definitions'
import {getEnquiryInterfaceDefinitions} from './enquiry-interface-definitions'
import {getEventInterfaceDefinitions} from './event-interface-definitions'
import {homeArabic,homeFrench} from './home-translations'
import {getNewsInterfaceDefinitions} from './news-interface-definitions'
import {getSustainabilityInterfaceDefinitions} from './sustainability-interface-definitions'

export function getContentTranslationDefinitions():TranslationEntry[]{
  const definitions=[
    ...getSearchInterfaceDefinitions(),
    ...getCatalogSeedTranslationDefinitions(),
    ...getEnquiryInterfaceDefinitions(),
    ...getEventInterfaceDefinitions(),
    ...getCareersInterfaceDefinitions(),
    ...getNewsInterfaceDefinitions(),
    ...getSustainabilityInterfaceDefinitions(),
    ...getCertificationTranslationDefinitions(),
    ...getTranslationDefinitions(),
  ].map(entry=>entry.page==='contact'?{...entry,translations:{...entry.translations,ar:entry.translations.ar===entry.translations.en?(homeArabic[entry.source]??entry.translations.ar):entry.translations.ar,fr:entry.translations.fr===entry.translations.en?(homeFrench[entry.source]??entry.translations.fr):entry.translations.fr}}:entry)
  return canonicalizeTranslationDefinitions(definitions)
}
