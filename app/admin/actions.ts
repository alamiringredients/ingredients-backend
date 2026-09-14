'use server'
import {adminActionError} from '@/server/admin/form-actions'
import CareerJob from '@/server/models/CareerJob'
import SustainabilityArticle from '@/server/models/SustainabilityArticle'
import {safeUrl} from '@/lib/catalog/validation'
import {sectionVisibility} from '@/lib/cms/section-visibility'

import {validate} from '@holo-js/forms'
import {revalidatePath} from 'next/cache'

import {saveCmsPayload, uploadCmsFile} from '@/app/admin/cms-schema'
import {persistHomeSection, persistHomeSeo, persistWebsiteSettings} from '@/server/services/cms/content'
import {persistDownloadsPageContent} from '@/server/services/downloads/content'
import type {HomeSectionContent, HomeSeoContent, WebsiteSettings} from '@/lib/cms/contracts'
import type {DownloadsPageContent} from '@/lib/downloads/contracts'
import HomeSection from '@/server/models/HomeSection'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import NewsArticle from '@/server/models/NewsArticle'
import Certification from '@/server/models/Certification'
import CertificationType from '@/server/models/CertificationType'
import Product from '@/server/models/Product'
import ProductCategory from '@/server/models/ProductCategory'
import Event from '@/server/models/Event'
import {requireAdminPermission} from '@/server/admin/authorization'
import {isManagedPageKey,managedPageDefinitions} from '@/lib/cms/managed-pages'

import {validateCmsUpload, type UploadFile} from '@/server/security/uploads'
import {getCurrentAdmin} from '@/server/admin/session'

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'media'
}

const convertibleImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const originalImageTypes = new Set(['image/x-icon', 'image/vnd.microsoft.icon'])
type CmsUploadFile = UploadFile
type CmsImageConversion = 'optimized'|'gallery'|'artwork'
type CmsMediaResult = {readonly error: {readonly message: string} | null; getUrl(conversion?: CmsImageConversion): string | null}
type CmsMediaAdder = {
  usingFileName(fileName: string): CmsMediaAdder
  toMediaCollection(collection: 'images' | 'files' | 'videos'): Promise<CmsMediaResult>
}
type CmsMediaOwner = {addMedia(source: unknown): CmsMediaAdder}

async function storeCmsMedia(model:unknown,file:CmsUploadFile,conversion:CmsImageConversion) {
  // defineMediaModel augments entities at runtime; this boundary keeps the package's
  // unaugmented firstOrCreate return type from leaking through the action.
  await validateCmsUpload(file)
  const owner = model as CmsMediaOwner
  const collection = ['video/webm','video/mp4'].includes(file.type)
    ? 'videos'
    : convertibleImageTypes.has(file.type)
      ? 'images'
      : (originalImageTypes.has(file.type) || file.type === 'application/pdf')
        ? 'files'
        : null

  if (!collection) return {ok: false, message: 'Upload a JPEG, PNG, WebP, AVIF, icon, PDF, or WebM file.'}

  const media = await owner
    .addMedia(file)
    .usingFileName(safeFileName(file.name ?? 'media'))
    .toMediaCollection(collection)

  if (media.error) return {ok: false, message: media.error.message}

  const url = collection === 'images' ? media.getUrl(conversion) : media.getUrl()
  if (!url) return {ok: false, message: 'The file was stored but its public URL could not be generated.'}

  return {ok: true, message: collection === 'images' ? 'Image uploaded and optimized.' : 'File uploaded.', url}
}

export async function saveHomeSectionAction(formData:FormData) {
  try {
    await requireAdminPermission('home_sections','edit')

    const data = await validate(formData, saveCmsPayload)
    const section = JSON.parse(data.payload) as HomeSectionContent
    if (section.key !== data.key || !Array.isArray(section.texts) || !Array.isArray(section.assets) || !Array.isArray(section.links)) {
      return {ok: false, message: 'The section content is not valid.'}
    }
    await persistHomeSection(section)
    
    revalidatePath('/admin/home')
    return {ok: true, message: `${section.label} saved.`}
  } catch (error) {
    return adminActionError(error)
  }
}

export async function saveHomeSeoAction(formData:FormData) {
  try {
    await requireAdminPermission('home_sections','edit')

    const data = await validate(formData, saveCmsPayload)
    if (data.key !== 'home_seo') return {ok: false, message: 'The SEO key is not valid.'}
    const value = JSON.parse(data.payload) as HomeSeoContent
    await persistHomeSeo(value)
    
    return {ok: true, message: 'Homepage SEO saved.'}
  } catch (error) {
    return adminActionError(error)
  }
}

export async function saveWebsiteSettingsAction(formData:FormData) {
  try {
    await requireAdminPermission('website_settings','edit')

    const data = await validate(formData, saveCmsPayload)
    if (data.key !== 'website') return {ok: false, message: 'The settings key is not valid.'}
    const value = JSON.parse(data.payload) as WebsiteSettings
    value.companyProfile = {en:safeUrl(value.companyProfile?.en ?? ''), ar:safeUrl(value.companyProfile?.ar ?? ''), fr:safeUrl(value.companyProfile?.fr ?? '')}
    await persistWebsiteSettings(value)
    
    revalidatePath('/admin/settings')
    return {ok: true, message: 'Website settings saved.'}
  } catch (error) {
    return adminActionError(error)
  }
}

export async function saveDownloadsPageAction(formData:FormData) {
  try {
    await requireAdminPermission('downloads_page', 'edit')
    const data = await validate(formData, saveCmsPayload)
    if (data.key !== 'downloads') return {ok: false, message: 'The downloads page key is not valid.'}
    const value = JSON.parse(data.payload) as DownloadsPageContent
    value.sectionVisibility=sectionVisibility(value.sectionVisibility,['hero','products','company'] as const)
    value.heroImage = safeUrl(value.heroImage)
    value.seo.socialImage=safeUrl(value.seo.socialImage)
    await persistDownloadsPageContent(value)
    
    revalidatePath('/admin/downloads')
    return {ok: true, message: 'Downloads page saved.'}
  } catch (error) {
    return adminActionError(error)
  }
}

export async function uploadCmsFileAction(formData:FormData) {
  try {
    if (!await getCurrentAdmin()) throw new Error('Sign in before uploading media.')
    const data = await validate(formData, uploadCmsFile)
    const file = data.file
    if (data.conversion!=='optimized'&&data.conversion!=='gallery'&&data.conversion!=='artwork') return {ok:false,message:'The image conversion is not valid.'}
    if (data.conversion==='artwork'&&data.ownerType!=='category') return {ok:false,message:'The artwork conversion is only available for product categories.'}
    const conversion:CmsImageConversion=data.conversion

    if(data.ownerType==='career-job'){
      await requireAdminPermission('career_jobs',Number(data.ownerKey)?'edit':'create')
      const owner=await CareerJob.where('id',Number(data.ownerKey)).first()
      if(!owner)return {ok:false,message:'Save the job before uploading media.'}
      return storeCmsMedia(owner,file,conversion)
    }
    if(data.ownerType==='sustainability'){
      await requireAdminPermission('sustainability','edit')
      const owner=await SustainabilityArticle.where('id',Number(data.ownerKey)).first()
      if(!owner)return {ok:false,message:'Save the article before uploading media.'}
      return storeCmsMedia(owner,file,conversion)
    }
    if (data.ownerType === 'news') {
      await requireAdminPermission('news','edit')
      const owner=await NewsArticle.where('id',Number(data.ownerKey)).first()
      if(!owner)return {ok:false,message:'Save the article before uploading media.'}
      return storeCmsMedia(owner,file,conversion)
    }

    if(data.ownerType==='event'){
      await requireAdminPermission('events','edit')
      const owner=await Event.where('id',Number(data.ownerKey)).first()
      if(!owner)return {ok:false,message:'Create the event before uploading media.'}
      return storeCmsMedia(owner,file,conversion)
    }

    if (data.ownerType === 'certification' || data.ownerType === 'certification-type') {
      await requireAdminPermission(data.ownerType === 'certification' ? 'certifications' : 'certification_types', 'edit')
      const id = Number(data.ownerKey)
      if (!Number.isSafeInteger(id) || id < 1) return {ok: false, message: 'Save the record before uploading files.'}
      if (data.ownerType === 'certification' && file.type !== 'application/pdf') return {ok: false, message: 'Choose a PDF certificate.'}
      if (data.ownerType === 'certification-type' && !convertibleImageTypes.has(file.type)) return {ok: false, message: 'Choose a JPEG, PNG, WebP or AVIF logo.'}
      const owner = data.ownerType === 'certification' ? await Certification.where('id', id).first() : await CertificationType.where('id', id).first()
      if (!owner) return {ok: false, message: 'Save the record before uploading files.'}
      return storeCmsMedia(owner, file, conversion)
    }

    if (data.ownerType === 'product' || data.ownerType === 'category') {
      await requireAdminPermission(data.ownerType === 'product' ? 'products' : 'product_categories','edit')
      const model = data.ownerType === 'product' ? Product : ProductCategory
      const owner = await model.where('id', Number(data.ownerKey)).first()
      if (!owner) return {ok: false, message: 'Save the record before uploading files.'}
      return storeCmsMedia(owner, file, conversion)
    }

    if (data.ownerType === 'home-section') {
      await requireAdminPermission('home_sections','edit')
      const owner = await HomeSection.where('section_key',data.ownerKey).first()
      if (!owner) return {ok: false, message: 'The homepage section is missing. Run the home_page seeder.'}
      return storeCmsMedia(owner, file, conversion)
    }

    if (data.ownerType === 'website-setting') {
      if (data.ownerKey !== 'website' && data.ownerKey !== 'home_seo' && data.ownerKey !== 'catalog' && data.ownerKey !== 'downloads' && data.ownerKey !== 'quality' && data.ownerKey !== 'news' && data.ownerKey !== 'sustainability' && data.ownerKey !== 'about' && data.ownerKey !== 'careers' && !isManagedPageKey(data.ownerKey)) {
        return {ok: false, message: 'The website setting is not valid.'}
      }
      await requireAdminPermission(isManagedPageKey(data.ownerKey)?managedPageDefinitions[data.ownerKey].resource:data.ownerKey === 'about' ? 'about_page' : data.ownerKey === 'careers' ? 'careers_page' : data.ownerKey === 'sustainability' ? 'sustainability_page' : data.ownerKey === 'news' ? 'news_page' : data.ownerKey === 'downloads' ? 'downloads_page' : data.ownerKey === 'quality' ? 'quality_page' : 'website_settings', 'edit')

      if (data.ownerKey === 'catalog') {
        const owner = await WebsiteSetting.where('setting_key', 'catalog').first()
        if (!owner) return {ok:false, message:'Seed the catalog before uploading files.'}
        return storeCmsMedia(owner, file, conversion)
      }
      const owner = await WebsiteSetting.where('setting_key',data.ownerKey).first()
      if(!owner) return {ok:false,message:`The ${data.ownerKey} content is missing. Run its seeder.`}
      return storeCmsMedia(owner, file, conversion)
    }

    return {ok: false, message: 'The media owner type is not valid.'}
  } catch (error) {
    return adminActionError(error)
  }
}
