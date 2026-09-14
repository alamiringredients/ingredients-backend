import {emptyDocument, type ContentDocument} from '@/lib/editor/document'
import type {CmsLocale} from '@/lib/cms/contracts'
import {decodeStoredJson} from '@/lib/cms/stored-json'
export const newsLocales = ['en','ar','fr'] as const
export type Localized<T> = Record<CmsLocale,T>
export type NewsTaxonomy = {id:number;kind:'category'|'tag';slug:string;sort_order:number;content:Localized<{name:string;description:string}>}
export type NewsVersion = {
  title:ContentDocument;summary:string;cardTitle:ContentDocument;cardSummary:string;body:ContentDocument;hero:string;heroAlt:string;heroCaption:string;
  seoTitle:string;seoDescription:string
}
export type NewsContent = {categoryId:number;tagIds:number[];featured:boolean;date:string;previousSlug:string;nextSlug:string;relatedSlugs:string[];locales:Localized<NewsVersion>}
export type NewsRecord = {id:number;slug:string;revision:number;content:NewsContent;published:Partial<Localized<NewsVersion>>}
export type NewsPageLocale = {kicker:string;title:ContentDocument;description:string;hero:string;heroAlt:string;empty:string;relatedKicker:string;relatedTitle:ContentDocument;contactKicker:string;contactTitle:ContentDocument;contactDescription:string;eventsKicker:string;eventsTitle:ContentDocument;eventsDescription:string;seoTitle:string;seoDescription:string}
export const newsPageSectionKeys=['hero','related','contact','events'] as const
export type NewsPageContent = Localized<NewsPageLocale>&{sectionVisibility:Record<(typeof newsPageSectionKeys)[number],boolean>}
const blankVersion = ():NewsVersion => ({title:emptyDocument(),summary:'',cardTitle:emptyDocument(),cardSummary:'',body:emptyDocument(),hero:'',heroAlt:'',heroCaption:'',seoTitle:'',seoDescription:''})
export const newArticle = ():NewsRecord => ({id:0,slug:'',revision:0,published:{},content:{categoryId:0,tagIds:[],featured:false,date:new Date().toISOString().slice(0,10),previousSlug:'',nextSlug:'',relatedSlugs:[],locales:{en:blankVersion(),ar:blankVersion(),fr:blankVersion()}}})
export const decode = decodeStoredJson
