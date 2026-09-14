import type {LocalizedDocument,HomeSectionContent, LocalizedValue} from '@/lib/cms/contracts'

export const MAX_CATEGORY_ARTWORK_IMAGES = 6

export type CatalogItem = {label?: LocalizedValue; value: LocalizedValue;document?:LocalizedDocument}
export type CatalogBlock = HomeSectionContent & {items?: CatalogItem[]}
export type ProductGalleryItem = {image: string; caption: LocalizedValue}
export type CatalogPageContent = {blocks: CatalogBlock[]}
export type CatalogSeo = {title: LocalizedValue; description: LocalizedValue}
export type CategoryPageCopy = {
  heroHeading?:LocalizedDocument
  introHeading?:LocalizedDocument
  heroTitle: LocalizedValue
  heroAccent: LocalizedValue
  heroDescription: LocalizedValue
  introTitle: LocalizedValue
  introAccent: LocalizedValue
  introDescription: LocalizedValue
}
export type CatalogCard = {seedKey?:string;name: LocalizedValue; description: LocalizedValue; seo: CatalogSeo; artwork: CatalogBlock}
export type CategoryContent = CatalogCard & {page: CatalogPageContent; pageCopy:CategoryPageCopy; icon: string; gallery: ProductGalleryItem[]}
export type ProductContent = CatalogCard & {
  page: CatalogPageContent
  applications: string[]
  concentrations: string[]
  gallery: ProductGalleryItem[]
  tds: LocalizedValue
}
export type Category = {id: number; slug: string; published: boolean; sort_order: number; content: CategoryContent}
export type Product = {id: number; category_id: number; slug: string; published: boolean; sort_order: number; content: ProductContent}
export type FilterOption = {id: string; label: LocalizedValue}
export type CatalogLabels = {
  viewProduct: LocalizedValue
  exploreRange: LocalizedValue
  allProducts: LocalizedValue
  allApplications: LocalizedValue
  anyConcentration: LocalizedValue
  home: LocalizedValue
  products: LocalizedValue
  productSingular: LocalizedValue
  productCategory: LocalizedValue
  requestQuote: LocalizedValue
  downloadTds: LocalizedValue
  companyProfile: LocalizedValue
  previousPhoto: LocalizedValue
  nextPhoto: LocalizedValue
  showPhoto: LocalizedValue
}
export type CatalogSettings = CatalogPageContent & {seo: {title:LocalizedValue; description:LocalizedValue}; labels:CatalogLabels; applications: FilterOption[]; concentrations: FilterOption[]}
export type Catalog = {categories: Category[]; products: Product[]; settings: CatalogSettings}
export const emptyLocalized = (): LocalizedValue => ({en: '', ar: '', fr: ''})
export function productPath(product: Product, category: Category) {
  return `/products/${category.slug}/${product.slug}`
}
export function categoryPath(category: Category, products: Product[]) {
  const children = products.filter((product) => product.category_id === category.id)
  // Retain the established category URL, resolving its body directly for a single product.
  return children.length === 1 ? productPath(children[0], category) : `/products/${category.slug}`
}
export function productHeroImage(product: Product) {
  return product.content.gallery?.[0]?.image ?? ''
}
