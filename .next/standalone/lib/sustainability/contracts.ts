import type {ContentDocument} from '@/lib/editor/document'
import {emptyDocument} from '@/lib/editor/document'
import type {LocalizedValue,HomeSectionContent} from '@/lib/cms/contracts'
import type {Localized} from '@/lib/news/contracts'
export type SustainabilityVersion={kicker:string;title:ContentDocument;summary:string;cardTitle:ContentDocument;cardSummary:string;badge:string;railIntro:string;note:string;gallery:{src:string;alt:string;caption:string}[];body:ContentDocument;seoTitle:string;seoDescription:string}
export type SustainabilityContent={date:string;updatedDate:string;sortOrder:number;featured:boolean;goalIds:number[];primaryGoal:number;locales:Localized<SustainabilityVersion>}
export type SustainabilityRecord={id:number;slug:string;revision:number;content:SustainabilityContent;published:Partial<Localized<SustainabilityVersion>>}
export type SustainabilityGoal={id:number;sortOrder?:number;color:string;image:string;name:LocalizedValue;alt:LocalizedValue}
export type SustainabilityPageContent={sectionVisibility:Record<'related',boolean>;relatedKicker:LocalizedValue;relatedTitle:Localized<ContentDocument>;sections:HomeSectionContent[];goals:SustainabilityGoal[];seo:{title:LocalizedValue;description:LocalizedValue}}
const blankSustainabilityVersion=():SustainabilityVersion=>({kicker:'',title:emptyDocument(),summary:'',cardTitle:emptyDocument(),cardSummary:'',badge:'',railIntro:'',note:'',gallery:[],body:emptyDocument(),seoTitle:'',seoDescription:''})
export const newSustainabilityArticle=():SustainabilityRecord=>({id:0,slug:'',revision:0,published:{},content:{updatedDate:new Date().toISOString().slice(0,10),date:new Date().toISOString().slice(0,10),sortOrder:0,featured:false,goalIds:[],primaryGoal:0,locales:{en:blankSustainabilityVersion(),ar:blankSustainabilityVersion(),fr:blankSustainabilityVersion()}}})
