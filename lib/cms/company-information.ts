import type {LocalizedValue} from './contracts'

export type CompanyInformation = {
  email: string
  phone: string
  exportPhone: string
  secondaryPhone: string
  website: string
  address: LocalizedValue
  socialLinks: {facebook: string; instagram: string; linkedin: string; youtube: string; whatsapp: string}
  salesWhatsapp: string
}

const companySources = new Set([
  'sales@alamiringredients.com', '(+20) 100 32 444 22', '+20 100 550 5020', '+20 122 157 7774',
  'www.alamiringredients.com', 'Industrial Zone, Sadat City,', 'Menoufia, Egypt', 'Sadat City, Menoufia, Egypt',
])
const companyLinkSources = new Set([
  'https://www.alamiringredients.com', 'https://www.facebook.com/', 'https://www.instagram.com/',
  'https://www.linkedin.com/', 'https://www.youtube.com/', 'https://wa.me/201005505020',
  'tel:+201005505020', 'tel:+201221577774', 'Contact sales on WhatsApp',
])

export function removeCompanyInformation<T>(content: T): T {
  if (Array.isArray(content)) return content.map(removeCompanyInformation) as T
  if (!content || typeof content !== 'object') return content
  return Object.fromEntries(Object.entries(content).map(([key, value]) => {
    if (Array.isArray(value) && key === 'texts') return [key, value.filter(field => !companySources.has(field.source))]
    if (Array.isArray(value) && key === 'richTexts') return [key, value.filter(field => !(field.sources?.length && field.sources.every((source: string) => companySources.has(source))))]
    if (Array.isArray(value) && key === 'links') return [key, value.filter(field => !companyLinkSources.has(field.source) && !field.source?.startsWith('https://wa.me/201005505020?'))]
    return [key, removeCompanyInformation(value)]
  })) as T
}
