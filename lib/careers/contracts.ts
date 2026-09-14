import {emptyDocument,type ContentDocument} from '@/lib/editor/document'
import type {LocalizedValue,LocalizedDocument,HomeSeoContent,PageHeroContent,EditorialPageContent} from '@/lib/cms/contracts'
import type {CmsLocale} from '@/lib/cms/contracts'
export type JobLocale={title:string;summary:string;department:string;location:string;contract:string;experience:string;reportsTo:string;closing:string;hero:string;heroAlt:string;body:ContentDocument}
export type JobContent=Record<CmsLocale,JobLocale>
export type JobRecord={id:number;slug:string;code:string;status:'draft'|'open'|'closed';content:JobContent}
export type ApplicationStatus='pending'|'accepted'|'declined'
export type ApplicationRecord={id:number;job_id:number|null;job_title:string;name:string;email:string;phone:string;department:string;letter:string;locale:CmsLocale;status:ApplicationStatus;cv_path:string;cv_name:string;created_at:string}
export type ReplyRecord={id:number;application_id:number;subject:string;body:string;status:'sending'|'sent'|'failed';created_at:string}
export type PageHero=PageHeroContent
export const aboutSectionKeys=['hero','body'] as const
export const careersSectionKeys=['hero','news','jobs','apply'] as const
export type AboutContent=EditorialPageContent
export type CareersContent={sectionVisibility:Record<(typeof careersSectionKeys)[number],boolean>;hero:PageHero;newsTitle:LocalizedDocument;newsIntro:LocalizedDocument;newsKicker:LocalizedValue;newsIds:number[];newsImage:string;newsImageAlt:LocalizedValue;jobsTitle:LocalizedDocument;jobsIntro:LocalizedDocument;jobsKicker:LocalizedValue;empty:LocalizedValue;applyTitle:LocalizedDocument;applyIntro:LocalizedDocument;applyKicker:LocalizedValue;seo:HomeSeoContent}
export const blankJob=():JobRecord=>({id:0,slug:'',code:'',status:'draft',content:Object.fromEntries((['en','ar','fr'] as const).map(l=>[l,{title:'',summary:'',department:'',location:'',contract:'',experience:'',reportsTo:'',closing:'',hero:'',heroAlt:'',body:emptyDocument()}])) as JobContent})
