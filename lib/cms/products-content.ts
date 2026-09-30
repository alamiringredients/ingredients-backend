import type {ManagedPageContent} from './contracts'

const certificationNames = new Set(['ISO 45001', 'ISO 14001', 'BRCGS', 'FSSC 22000', 'NFSA', 'Halal', 'Kosher', 'FDA', 'SEDEX'])

export function removeProductsCertificationFields(content: ManagedPageContent): ManagedPageContent {
  return {...content, sections: content.sections.map(section => section.key === 'deep' ? {
    ...section,
    texts: section.texts.filter(field => !certificationNames.has(field.source)),
    assets: section.assets.filter(asset => !asset.source.startsWith('/assets/certs/')),
  } : section)}
}
