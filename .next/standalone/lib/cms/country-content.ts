import countryNames from './country-names.json'
import type {HomeSectionContent} from './contracts'

export function removeHomeCountryFields(section: HomeSectionContent): HomeSectionContent {
  if (section.key !== 'contact') return section
  return {...section, texts: section.texts.filter(field => !countryNames.includes(field.source))}
}
