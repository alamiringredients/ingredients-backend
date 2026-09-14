import type {LocalizedDocument,HomeSeoContent,LocalizedValue} from '@/lib/cms/contracts'

export type DownloadsPageContent = {
  sectionVisibility:Record<'hero'|'products'|'company',boolean>
  heroHeading?:LocalizedDocument
  productHeading?:LocalizedDocument
  companyHeading?:LocalizedDocument
  seo:HomeSeoContent
  heroEyebrow: LocalizedValue
  heroTitle: LocalizedValue
  heroAccent: LocalizedValue
  heroDescription: LocalizedValue
  heroImage: string
  heroImageAlt: LocalizedValue
  productEyebrow: LocalizedValue
  productTitle: LocalizedValue
  productAccent: LocalizedValue
  companyEyebrow: LocalizedValue
  companyTitle: LocalizedValue
  companyAccent: LocalizedValue
  profileLabel: LocalizedValue
  noTds: LocalizedValue
  noCompany: LocalizedValue
}
