import type {TranslationEntry} from '@/lib/translation-catalog'
import seed from './sustainability.json'
export function getSustainabilityInterfaceDefinitions():TranslationEntry[]{return Object.entries(seed.interfaceLabels).map(([key,value])=>({key:`sustainability.interface.${key}`,page:'sustainability-interface',...value}))}
