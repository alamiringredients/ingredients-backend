import {managedPageKeys, type ManagedPageKey} from '@/lib/cms/managed-pages'
import type {CmsLocale} from '@/lib/cms/contracts'

export const contentCacheKeys = {
  certifications: 'cms:certifications:v2',
  homeSections: 'cms:home-sections:v12',
  homeSeo: 'cms:home-seo:v1',
  websiteSettings: 'cms:website-settings:v3',
  downloadsPage: 'cms:downloads-page:v1',
  qualityPage: 'cms:quality-page:v2',
  products: 'cms:products:v3',
  productCategories: 'cms:product-categories:v3',
  catalogSettings: 'cms:catalog-settings:v3',
  catalogTranslations: 'cms:catalog-translations:v2',
  contentTranslations: 'cms:content-translations:v3',
  events: 'cms:events:v1',
  eventSlots: 'cms:event-slots:v1',
} as const

export const contentCacheKeyForSetting=(key:string)=>`cms:page:${key}:v9`

export const contentCacheKeyForPage = (page: 'layout' | 'homepage' | 'about' | 'catalog' | 'catalog-labels' | 'certifications' | 'quality' | 'downloads' | 'news' | 'sustainability' | 'careers' | 'careers-search' | 'events' | 'search' | 'search-page' | `managed:${ManagedPageKey}`, locale: CmsLocale) => `cms:${page}:${locale}:v${page==='layout'?12:page==='homepage'?11:12}`

export const layoutCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('layout', locale))
export const homepageCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('homepage', locale))
const aboutCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('about', locale))
export const catalogCacheKeys = (['en', 'fr', 'ar'] as const).flatMap(locale => [contentCacheKeyForPage('catalog', locale), contentCacheKeyForPage('catalog-labels', locale)])
export const certificationCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('certifications', locale))

export const qualityCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('quality', locale))
export const downloadsCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('downloads', locale))
export const newsCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('news', locale))
export const sustainabilityCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('sustainability', locale))
export const careersCacheKeys = (['en', 'fr', 'ar'] as const).flatMap(locale => [contentCacheKeyForPage('careers', locale), contentCacheKeyForPage('careers-search', locale)])
export const eventsCacheKeys = (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage('events', locale))

const managedCacheKeys = managedPageKeys.flatMap(page => (['en', 'fr', 'ar'] as const).map(locale => contentCacheKeyForPage(`managed:${page}`, locale)))

export const searchCacheKeys = (['en', 'fr', 'ar'] as const).flatMap(locale => [contentCacheKeyForPage('search', locale), contentCacheKeyForPage('search-page', locale)])

export const pageCacheKeys = [...layoutCacheKeys, ...homepageCacheKeys, ...aboutCacheKeys, ...catalogCacheKeys, ...certificationCacheKeys, ...qualityCacheKeys, ...downloadsCacheKeys, ...newsCacheKeys, ...sustainabilityCacheKeys, ...careersCacheKeys, ...eventsCacheKeys, ...managedCacheKeys, ...searchCacheKeys]
