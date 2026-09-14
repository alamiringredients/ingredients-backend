'use client'
import { fieldName } from './form-feedback'
import { CatalogField } from './catalog-layout'
import { FieldError,useAdminFields } from './form-feedback'

import { newsLocales } from '@/lib/news/contracts'
import type { CmsLocale } from '@/lib/cms/contracts'
import type { ReactNode } from 'react'
import { CatalogButton } from './catalog-button'
import { Icon } from './catalog-icon'
export function ArticleLanguages({locale,onChange,label="Article language"}:{locale:CmsLocale;onChange:(locale:CmsLocale)=>void;label?:string}){
 return <div className="news-editor-languages" role="group" aria-label={label}>{newsLocales.map(l=><CatalogButton type="button" key={l} aria-pressed={locale===l} variant={locale===l?'primary':'secondary'} onClick={()=>onChange(l)}>{l==='en'?'English':l==='ar'?'العربية':'Français'}</CatalogButton>)}</div>
}
export function ArticleTextField({name,label,value,onChange,locale,multiline=false}:{name:string;label:string;value:string;onChange:(value:string)=>void;locale:CmsLocale;multiline?:boolean}){
 const props={value,dir:locale==='ar'?'rtl' as const:'ltr' as const,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(e.target.value)}
 return <CatalogField name={name}><span>{label}</span>{multiline?<textarea {...props}/>:<input {...props}/>}</CatalogField>
}
export function EditorField({name,label,children}:{name:string;label:string;children:ReactNode}){const form=useAdminFields();return <div className="catalog-field" data-admin-field={fieldName(name)} tabIndex={-1} aria-invalid={form?.error(name)?true:undefined}><span>{label}</span>{children}<FieldError name={name}/></div>}
export function ArticleRevisionHistory<T extends {id:number;date:string}>({revisions,onOpen,onRestore}:{revisions:T[];onOpen:()=>void;onRestore:(revision:T)=>void}){
 return <div className="catalog-panel"><details className="catalog-section" onToggle={e=>{if(e.currentTarget.open)onOpen()}}><summary>Revision history</summary><div className="catalog-section-body"><p className="catalog-help">The latest 10 snapshots are kept. Older snapshots are deleted automatically.</p><div className="news-revision-list">{revisions.map(r=><div className="news-revision-row" key={r.id}><time dateTime={r.date}>{new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(r.date))}</time><CatalogButton type="button" variant="secondary" onClick={()=>onRestore(r)}><Icon name="arrow-left"/>Restore draft</CatalogButton></div>)}</div>{!revisions.length&&<p className="catalog-muted">Revisions appear after saving changes.</p>}</div></details></div>
}
