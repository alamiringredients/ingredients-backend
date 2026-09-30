import {validateDocument,contentUrl,textContent} from '@/lib/editor/document'
import {newsLocales} from '@/lib/news/contracts'
import type {SustainabilityContent,SustainabilityVersion} from './contracts'
const text=(v:unknown,max=30000)=>{if(typeof v!=='string'||v.length>max)throw new Error('Invalid content text.');return v}
export function validateSustainabilityVersion(input:unknown,publish=false):SustainabilityVersion{
 if(!input||typeof input!=='object')throw new Error('Article content is required.')
 const v=input as SustainabilityVersion
 if(!Array.isArray(v.gallery)||v.gallery.length>12)throw new Error('Choose up to twelve hero images.')
 const result={kicker:text(v.kicker,300),title:validateDocument(v.title),summary:text(v.summary),cardTitle:validateDocument(v.cardTitle),cardSummary:text(v.cardSummary),badge:text(v.badge,200),railIntro:text(v.railIntro),note:text(v.note),body:validateDocument(v.body),seoTitle:text(v.seoTitle,300),seoDescription:text(v.seoDescription,2000),gallery:v.gallery.map(i=>({src:contentUrl(i.src,true),alt:text(i.alt,2000),caption:text(i.caption,2000)}))}
 if(publish&&(!textContent(result.title).trim()||!textContent(result.body).trim()||!result.gallery[0]?.src||result.gallery.some(i=>!i.alt.trim())))throw new Error('Add a title, article body, and hero images with alternative text before publishing.')
 return result
}
export function validateSustainabilityContent(input:unknown):SustainabilityContent{
 const c=input as SustainabilityContent
 if(!c||!/^\d{4}-\d{2}-\d{2}$/.test(c.date)||!Number.isFinite(Date.parse(c.date))||!/^\d{4}-\d{2}-\d{2}$/.test(c.updatedDate)||!Number.isFinite(Date.parse(c.updatedDate))||!Number.isSafeInteger(c.sortOrder)||!Array.isArray(c.goalIds)||c.goalIds.some(id=>!Number.isSafeInteger(id)||id<1)||!Number.isInteger(c.primaryGoal)||c.primaryGoal!==0&&!c.goalIds.includes(c.primaryGoal))throw new Error('Check the date, display order, and sustainability goals.')
 return {date:c.date,updatedDate:c.updatedDate,sortOrder:c.sortOrder,featured:Boolean(c.featured),goalIds:[...new Set(c.goalIds)],primaryGoal:c.primaryGoal,locales:Object.fromEntries(newsLocales.map(l=>[l,validateSustainabilityVersion(c.locales?.[l])])) as SustainabilityContent['locales']}
}
