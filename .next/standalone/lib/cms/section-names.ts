import type {ManagedPageContent} from './contracts'
import type {ManagedPageKey} from './managed-pages'

export const managedSectionNames: Partial<Record<ManagedPageKey, Record<string, string>>> = {
  products: {collection: 'Product catalogue', deep: 'Certifications and documentation'},
  events: {'section-2': 'Upcoming events', 'section-3': 'Past events', 'section-4': 'Event gallery'},
  contact: {'section-2': 'Contact details and enquiry form'},
  'book-a-meeting': {'bk-band': 'Meeting booking and confirmation'},
  privacy: {'section-2': 'Privacy policy'},
  terms: {'section-2': 'Terms and conditions'},
  cookies: {'section-2': 'Cookie policy'},
  search: {'section-2': 'Search results'},
  'thank-you': {'section-2': 'Recommended next steps'},
  '404': {'section-2': 'Page recovery links'},
}

export function nameManagedSections(page: ManagedPageKey, content: ManagedPageContent): ManagedPageContent {
  const names = managedSectionNames[page]
  return {...content, sections: content.sections.map(section => ({...section, label: names?.[section.key] ?? section.label}))}
}
