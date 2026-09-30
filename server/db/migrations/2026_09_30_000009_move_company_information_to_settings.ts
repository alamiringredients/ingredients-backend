import {DB, defineMigration} from '@holo-js/db'
import {removeCompanyInformation} from '@/lib/cms/company-information'
import {companyInformationDefaults} from '../seed-data/company-information'
import type {HomeSectionContent, ManagedPageContent} from '@/lib/cms/contracts'

export default defineMigration({
  async up() {
    const settings = await DB.table('website_settings').get()
    const home = await DB.table('home_sections').get()
    const decode = (value: unknown) => typeof value === 'string' ? JSON.parse(value) : value
    const website = settings.find(row => row.setting_key === 'website')
    if (website) {
      const value = decode(website.value)
      const company = structuredClone(companyInformationDefaults)
      const contact = decode(settings.find(row => row.setting_key === 'contact')?.value) as ManagedPageContent | undefined
      const details = contact?.sections.find(section => section.key === 'section-2')
      const text = (source: string) => details?.texts.find(field => field.source === source)?.values.en
      const link = (source: string) => details?.links.find(field => field.source === source)?.value
      company.email = text('sales@alamiringredients.com') ?? company.email
      company.phone = text('(+20) 100 32 444 22') ?? company.phone
      company.website = link('https://www.alamiringredients.com') ?? company.website
      for (const key of ['facebook', 'instagram', 'linkedin', 'youtube', 'whatsapp'] as const) {
        const source = company.socialLinks[key]
        company.socialLinks[key] = link(source) ?? source
      }
      company.salesWhatsapp = details?.links.find(field => field.label === 'Link: Contact sales on WhatsApp')?.value ?? company.salesWhatsapp
      for (const locale of ['en', 'ar', 'fr'] as const) {
        const address = details?.richTexts?.find(field => field.sources.includes('Industrial Zone, Sadat City,'))
        if (address) {
          const plainText = (node: {text?: string; type?: string; content?: unknown[]}): string => node.text ?? (node.type === 'hardBreak' ? '\n' : (node.content ?? []).map(child => plainText(child as typeof node)).join(''))
          company.address[locale] = plainText(address.values[locale])
        } else if (details) company.address[locale] = ['Industrial Zone, Sadat City,', 'Menoufia, Egypt'].map(source => details.texts.find(field => field.source === source)?.values[locale] ?? '').filter(Boolean).join('\n')
      }
      const homeContact = decode(home.find(row => row.section_key === 'contact')?.content) as HomeSectionContent | undefined
      company.exportPhone = homeContact?.texts.find(field => field.source === '+20 100 550 5020')?.values.en ?? company.exportPhone
      const footer = decode(home.find(row => row.section_key === 'footer')?.content) as HomeSectionContent | undefined
      company.secondaryPhone = footer?.texts.find(field => field.source === '+20 122 157 7774')?.values.en ?? company.secondaryPhone
      await DB.table('website_settings').where('id', Number(website.id)).update({value: JSON.stringify({...value, company: value.company ?? company})})
    }
    for (const row of home) await DB.table('home_sections').where('id', Number(row.id)).update({content: JSON.stringify(removeCompanyInformation(decode(row.content)))})
    for (const row of settings.filter(row => row.setting_key !== 'website')) await DB.table('website_settings').where('id', Number(row.id)).update({value: JSON.stringify(removeCompanyInformation(decode(row.value)))})
  },
  async down() {},
})
