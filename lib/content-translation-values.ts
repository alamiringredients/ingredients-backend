import arabic from '@/messages/content/ar.json'
import english from '@/messages/content/en.json'
import french from '@/messages/content/fr.json'
import type {CmsLocale} from './cms/contracts'

type Dictionary = Record<string, string>

const dictionaries: Record<CmsLocale, Dictionary> = {
  en: english,
  ar: arabic,
  fr: french,
}

const editorialOverrides: Record<Exclude<CmsLocale, 'en'>, Dictionary> = {
  ar: {
    'Ingredients': 'المكونات',
    'BRCGS': 'BRCGS',
    'CFT': 'CFT',
    'FDA': 'FDA',
    'FSSC 22000': 'FSSC 22000',
    'NFSA': 'NFSA',
    'SEDEX': 'SEDEX',
    'ISO 14001': 'ISO 14001',
    'ISO 22000': 'ISO 22000',
    'ISO 45001': 'ISO 45001',
    'PDF ↓': 'PDF ↓',
    '240 T': '240 طن',
    "Cote d'Ivoire": 'ساحل العاج',
    'Turkey': 'تركيا',
    'Philippines': 'الفلبين',
    'Select': 'اختيار',
    'Prepare': 'تحضير',
    'Transform': 'تحويل',
    'Protect': 'حماية',
    'Two breaks, one standard.': 'طريقتا معالجة، معيار واحد.',
    'Under 20 °Bx': 'أقل من 20 °Bx',
    '20–30 °Bx': '20–30 °Bx',
    '30 °Bx and above': '30 °Bx فأكثر',
    "Let's": 'هيا بنا',
    'get in touch.': 'نتواصل.',
    'Tomato concentrates': 'مركزات الطماطم',
    'Tomato concentrates.': 'مركزات الطماطم.',
    'Tomato Concentrates': 'مركزات الطماطم',
    'Tomato concentrate': 'مركز الطماطم',
    'Fruit concentrates': 'مركزات الفاكهة',
    'Fruit Concentrates': 'مركزات الفاكهة',
    'Fruit concentrate': 'مركز الفاكهة',
    'Fruit purees': 'مهروسات الفاكهة',
    'Fruit Purees': 'مهروسات الفاكهة',
    'Fruit puree': 'مهروس الفاكهة',
    'Chilli concentrate': 'مركز الفلفل الحار',
    'Chilli Concentrate': 'مركز الفلفل الحار',
    'Cold Break': 'الكسر البارد',
    'Hot Break': 'الكسر الساخن',
    'Cold Break Tomato Concentrate': 'مركز طماطم بالكسر البارد',
    'Hot Break Tomato Concentrate': 'مركز طماطم بالكسر الساخن',
  },
  fr: {
    'Ingredients': 'Ingrédients',
    'BRCGS': 'BRCGS',
    'CFT': 'CFT',
    'FDA': 'FDA',
    'FSSC 22000': 'FSSC 22000',
    'NFSA': 'NFSA',
    'SEDEX': 'SEDEX',
    'Tomato concentrates': 'Concentrés de tomate',
    'Tomato concentrates.': 'Concentrés de tomate.',
    'Fruit concentrates': 'Concentrés de fruits',
    'Fruit purees': 'Purées de fruits',
    'Chilli concentrate': 'Concentré de piment',
    'Cold Break': 'Cold Break',
    'Hot Break': 'Hot Break',
  },
}

function normalizeTranslationSource(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function contentTranslation(locale: CmsLocale, source: string) {
  const normalized = normalizeTranslationSource(source)
  return (locale==='en'?undefined:editorialOverrides[locale][normalized]) ?? dictionaries[locale][normalized] ?? source
}
