import type {ContentDocument} from '@/lib/editor/document'
export const cmsLocales = ['en', 'ar', 'fr'] as const

export type CmsLocale = (typeof cmsLocales)[number]
export type LocalizedValue = Record<CmsLocale, string>
export type LocalizedDocument = Record<CmsLocale, ContentDocument>
export type CmsRichText = {id:string;label:string;source:string;sources:string[];values:LocalizedDocument}

export type CmsTextField = {
  id: string
  label: string
  source: string
  values: LocalizedValue
}

export type CmsAssetField = {
  id: string
  label: string
  kind: 'image' | 'video' | 'pdf'
  source: string
  value: string
}

export type CmsLinkField = {
  id: string
  label: string
  source: string
  value: string
}

export type CmsCardItem = {
  id: string
  title: LocalizedValue
  description: LocalizedValue
}

export type HomeSectionContent = {
  key: string
  label: string
  enabled: boolean
  texts: CmsTextField[]
  richTexts?: CmsRichText[]
  assets: CmsAssetField[]
  links: CmsLinkField[]
  cards?: CmsCardItem[]
  videos?: string[]
}

export type HomeSeoContent = {
  title: LocalizedValue
  description: LocalizedValue
  socialTitle: LocalizedValue
  socialDescription: LocalizedValue
  socialImage: string
}

export type PageHeroContent = {
  title: LocalizedDocument
  description: LocalizedDocument
  kicker: LocalizedValue
  image: string
  alt: LocalizedValue
}

export type EditorialPageContent = {
  sectionVisibility: Record<'hero' | 'body', boolean>
  hero: PageHeroContent
  body: LocalizedDocument
  seo: HomeSeoContent
}

export type WebsiteSettings = {
  companyProfile: LocalizedValue
  siteName: LocalizedValue
  logo: string
  icon: string
  defaultSeoTitle: LocalizedValue
  defaultSeoDescription: LocalizedValue
  socialImage: string
}

export type HomeCmsData = {
  sections: HomeSectionContent[]
  seo: HomeSeoContent
}

export type SectionPageContent = {
  sections: HomeSectionContent[]
  seo: HomeSeoContent
}

export type QualityPageContent = EditorialPageContent
export type ManagedPageContent = SectionPageContent
