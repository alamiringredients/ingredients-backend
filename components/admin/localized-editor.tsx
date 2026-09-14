'use client'
import { ContentEditor } from '@/components/editor/content-editor'
import { cmsLocales,type LocalizedDocument } from '@/lib/cms/contracts'
import { fieldName } from './form-feedback'
import { useEffect,useState } from 'react'
import { FieldError,RequiredMark,useAdminFields } from './form-feedback'

export function LocalizedEditor({name,label,value,onChange,appearance='heading',editable=true}:{name?:string|((locale:string)=>string);editable?:boolean;appearance?:'heading'|'body';label:string;value:LocalizedDocument;onChange:(value:LocalizedDocument)=>void}) {
  const [locale,setLocale]=useState<(typeof cmsLocales)[number]>('en')
  const form=useAdminFields(),path=name??form?.path(value)
  const nameFor=(language:string)=>typeof path==='function'?path(language):path?`${path}.${language}`:undefined
  useEffect(()=>{
    const language=cmsLocales.find(language=>{const name=nameFor(language);return name&&fieldName(name)===form?.focusRequest})
    if(language)setLocale(language)
  },[form?.focusRequest,path])
  const activeName=nameFor(locale)
  return <fieldset className={`cms-localized-field cms-rich-field cms-rich-field--${appearance}`} data-admin-field={activeName?fieldName(activeName):undefined} tabIndex={-1}><legend>{label}{form?.input(activeName).required&&<RequiredMark/>}</legend>
    <div className="cms-rich-languages" role="group" aria-label={`${label} language`}>{cmsLocales.map(l=><button type="button" key={l} aria-pressed={locale===l} onClick={()=>setLocale(l)}>{l==='en'?'English':l==='ar'?'العربية':'Français'}</button>)}</div>
    <ContentEditor editable={editable} key={locale} label={label} compact value={value[locale]} locale={locale} upload={async()=>{throw new Error('This field contains text only.')}} onChange={document=>{form?.change(activeName);onChange({...value,[locale]:document})}}/>
    <FieldError name={activeName}/>
  </fieldset>
}
