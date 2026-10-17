import type {AdminResource} from '@/lib/admin/access'

export const managedPageDefinitions = {
  products: {label:'Products page', resource:'products_page'},
  events: {label:'Events page', resource:'events_page'},
  contact: {label:'Contact page', resource:'contact_page'},
  'book-a-meeting': {label:'Book a meeting page', resource:'book_meeting_page'},
  privacy: {label:'Privacy page', resource:'privacy_page'},
  terms: {label:'Terms page', resource:'terms_page'},
  cookies: {label:'Cookies page', resource:'cookies_page'},
  search: {label:'Search page', resource:'search_page'},
  'thank-you': {label:'Thank-you page', resource:'thank_you_page'},
  '404': {label:'404 page', resource:'not_found_page'},
} as const satisfies Record<string,{label:string;resource:AdminResource}>

export type ManagedPageKey = keyof typeof managedPageDefinitions
export const managedPageKeys = Object.keys(managedPageDefinitions) as ManagedPageKey[]
export function isManagedPageKey(value:string):value is ManagedPageKey{return value in managedPageDefinitions}
