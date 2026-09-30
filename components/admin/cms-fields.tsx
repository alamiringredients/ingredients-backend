'use client'

import { uploadCmsFileAction } from '@/app/admin/actions'
import { MediaPicker } from '@/components/editor/media-picker'
import type { CmsCardItem,CmsRichText,CmsStatField } from '@/lib/cms/contracts'
import { cmsLocales,type CmsAssetField,type CmsTextField,type HomeSeoContent,type LocalizedValue } from '@/lib/cms/contracts'
import Image from 'next/image'
import { useId,useRef,useState } from 'react'
import { CatalogButton,CatalogIconButton } from './catalog-button'
import { Icon } from './catalog-icon'
import { ConfirmAction } from './confirm-action'
import { LocalizedEditor } from './localized-editor'

import { FieldError,FormNotice,RequiredMark,useAdminFields,type AdminResult } from './form-feedback'
import {cmsCardIds} from '@/lib/cms/card-ids'

export type CmsMediaOwner = {
  type: 'sustainability-goal' | 'career-job' | 'sustainability' | 'news' | 'event' | 'home-section' | 'website-setting' | 'product' | 'category' | 'certification' | 'certification-type'
  key: string
}

function PdfStatus({url}: {url: string}) {
  const icon = url
    ? <path d="m6.75 12.25 3.1 3.1 7.4-7.4" />
    : <><path d="m8 8 8 8" /><path d="m16 8-8 8" /></>

  const content = <>
    <span className="cms-pdf-status-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">{icon}</svg>
    </span>
    <span>{url ? 'Ready' : 'Missing'}</span>
  </>

  return url
    ? <a className="cms-pdf-status is-ready" href={url} target="_blank" rel="noreferrer" aria-label="PDF attached. Open PDF in a new tab." title="Open PDF">{content}</a>
    : <div className="cms-pdf-status is-missing" role="status" aria-label="No PDF attached">{content}</div>
}

export function LocalizedFields({label, value, onChange, multiline = false, name}: {label: string; value: LocalizedValue; onChange: (value: LocalizedValue) => void; multiline?: boolean; name?:string|((locale:string)=>string)}) {
  const form = useAdminFields()
  const path = name ?? form?.path(value)
  const id = useId()
  const required = Boolean(path && form?.input(typeof path==='function'?path('en'):`${path}.en`).required)
  return <fieldset className="cms-localized-field">
    <legend>{label}{required && <RequiredMark />}</legend>
    <div className="cms-locale-grid">
      {cmsLocales.map((locale) => {
        const fieldPath = path ? typeof path==='function'?path(locale):`${path}.${locale}` : undefined
        const props = {...form?.input(fieldPath), id:form?.input(fieldPath).id ?? `${id}-${locale}`}
        return <div className="admin-field" key={locale}>
          <label htmlFor={props.id}>{locale.toUpperCase()}{props.required && <RequiredMark />}</label>
          {multiline
            ? <textarea {...props} dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value[locale]} onChange={(event) => {form?.change(props['data-admin-field']);onChange({...value, [locale]: event.target.value})}} />
            : <input {...props} dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value[locale]} onChange={(event) => {form?.change(props['data-admin-field']);onChange({...value, [locale]: event.target.value})}} />}
          <FieldError name={fieldPath}/>
        </div>
      })}
    </div>
  </fieldset>
}

export function SeoFields({value, owner, onChange}: {
  value: HomeSeoContent
  owner: CmsMediaOwner
  onChange: (value: HomeSeoContent) => void
}) {
  const form=useAdminFields(),path=form?.path(value)
  return <>
    <LocalizedFields label="Page title" value={value.title} onChange={title => onChange({...value, title})}/>
    <LocalizedFields label="Meta description" value={value.description} multiline onChange={description => onChange({...value, description})}/>
    <LocalizedFields label="Social title" value={value.socialTitle} onChange={socialTitle => onChange({...value, socialTitle})}/>
    <LocalizedFields label="Social description" value={value.socialDescription} multiline onChange={socialDescription => onChange({...value, socialDescription})}/>
    <UrlField name={path?`${path}.socialImage`:"socialImage"} label="Social sharing image" value={value.socialImage} media owner={owner} onChange={socialImage => onChange({...value, socialImage})}/>
  </>
}

export function TextContentFields({fields, onChange,richTexts=[],onRichChange,editable=true}: {fields: CmsTextField[]; onChange: (fields: CmsTextField[]) => void;richTexts?:CmsRichText[];editable?:boolean;onRichChange?:(fields:CmsRichText[])=>void}) {
  const update = (index: number, values: LocalizedValue) => onChange(fields.map((field, current) => current === index ? {...field, values} : field))
  return <div className="cms-field-list">
    {richTexts.map((field,index)=><LocalizedEditor editable={editable} appearance={field.label.startsWith('Paragraph:')?'body':'heading'} key={field.id} label={field.label} value={field.values} onChange={values=>onRichChange?.(richTexts.map((f,i)=>i===index?{...f,values}:f))}/>)}
    {fields.map((field, index) => richTexts.some(r=>r.sources.includes(field.source))?null:<LocalizedFields label={field.label} value={field.values} multiline={field.source.length > 64} onChange={(values) => update(index, values)} key={field.id} />)}
    {!fields.length && <p className="cms-empty">This section has no editable text.</p>}
  </div>
}

export function StatFields({fields,onChange}:{fields:CmsStatField[];onChange:(fields:CmsStatField[])=>void}) {
  const form=useAdminFields()
  const path=form?.path(fields)??'stats'
  return <div className="cms-locale-grid">
    {fields.map((field,index)=>{
      const name=`${form?.path(field)??`${path}.${index}`}.value`
      const props=form?.input(name)
      return <div className="admin-field" key={field.id}>
        <label htmlFor={props?.id}>{field.label}</label>
        <input {...props} type="number" min="0" step="1" required value={field.value} onChange={event=>{form?.change(props?.['data-admin-field']);onChange(fields.map((item,current)=>current===index?{...item,value:Number(event.target.value)}:item))}}/>
        <FieldError name={name}/>
      </div>
    })}
  </div>
}

const emptyLocalized=():LocalizedValue=>({en:'',ar:'',fr:''})

export function CmsCardRepeater({cards,onChange}: {cards:CmsCardItem[];onChange:(cards:CmsCardItem[])=>void}) {
  const form=useAdminFields()
  const name=form?.path(cards)??'cards'
  const move=(index:number,direction:-1|1)=>{
    const target=index+direction
    if(target<0||target>=cards.length)return
    const next=[...cards]
    ;[next[index],next[target]]=[next[target],next[index]]
    onChange(next)
  }
  const update=(index:number,patch:Partial<CmsCardItem>)=>onChange(cards.map((card,current)=>current===index?{...card,...patch}:card))
  return <div className="catalog-items">
    {cards.map((card,index)=><div className="catalog-item" key={card.id}>
      <div className="catalog-item-head"><b>Card {index+1}</b><div className="catalog-item-actions">
        <CatalogIconButton disabled={index===0} onClick={()=>move(index,-1)} aria-label={`Move card ${index+1} up`}><Icon name="up"/></CatalogIconButton>
        <CatalogIconButton disabled={index===cards.length-1} onClick={()=>move(index,1)} aria-label={`Move card ${index+1} down`}><Icon name="down"/></CatalogIconButton>
        <ConfirmAction triggerClassName="is-delete" triggerLabel={`Delete card ${index+1}`} title={`Delete card ${index+1}?`} description="This card will be removed from the draft. Save your changes to make the deletion permanent." onConfirm={()=>onChange(cards.filter((_,current)=>current!==index))}><Icon name="delete"/></ConfirmAction>
      </div></div>
      <LocalizedFields name={`${name}.${index}.title`} label="Title" value={card.title} onChange={title=>update(index,{title})}/>
      <LocalizedFields name={`${name}.${index}.description`} label="Description" value={card.description} multiline onChange={description=>update(index,{description})}/>
    </div>)}
    {!cards.length&&<p className="catalog-muted">No cards yet.</p>}
    <CatalogButton type="button" disabled={cards.length>=cmsCardIds.length} onClick={()=>{const id=cmsCardIds.find(item=>!cards.some(card=>card.id===item));if(id)onChange([...cards,{id,title:emptyLocalized(),description:emptyLocalized()}])}} variant="secondary"><Icon name="add"/>{cards.length>=cmsCardIds.length?'All cards added':'Add card'}</CatalogButton>
  </div>
}

export function AssetField({field, owner, onChange, conversion='optimized', name}: {name?:string; field: CmsAssetField; owner: CmsMediaOwner; onChange: (value: string) => void; conversion?:'optimized'|'gallery'|'artwork'}) {
  const form = useAdminFields()
  const path = name ?? form?.assetPath(field)
  const generatedId = useId()
  const props = {...form?.input(path),id:form?.input(path).id ?? generatedId}
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<AdminResult | null>(null)

  const upload = async (file?: File) => {
    if (!file) return
    setUploading(true)
    setResult(null)
    const formData = new FormData()
    formData.set('ownerType', owner.type)
    formData.set('ownerKey', owner.key)
    formData.set('conversion', conversion)
    formData.set('file', file)
    try {
      const result = await uploadCmsFileAction(formData)
      setResult(result)
      if(result.ok&&'url' in result&&result.url){form?.change(props?.['data-admin-field']);onChange(result.url)}
    } catch {setResult({ok:false,message:'Upload failed. Please try again.'})}
    finally {setUploading(false);if (input.current) input.current.value = ''}

  }

  return <div className="cms-media-row">
    <div className="cms-media-preview">
      {field.kind === 'pdf' ? <PdfStatus url={field.value} /> : field.kind === 'video'
        ? field.value ? <video src={field.value} muted playsInline preload="metadata" /> : <span>No video</span>
        : field.value ? <Image src={field.value} alt="" width={176} height={124} unoptimized /> : <span>No image</span>}
    </div>
    <div className="cms-media-field">
      <label htmlFor={props.id}>{field.label}{props.required&&<RequiredMark/>}</label>
      <input {...props} value={field.value} onChange={(event) => {form?.change(props?.['data-admin-field']);onChange(event.target.value)}} />
      <div className="cms-media-actions">
        <input ref={input} className="cms-file-input" type="file" accept={field.kind === 'pdf' ? 'application/pdf' : field.kind === 'video' ? 'video/webm' : 'image/jpeg,image/png,image/webp,image/avif,image/x-icon,image/vnd.microsoft.icon'} onChange={(event) => void upload(event.target.files?.[0])} />
        <CatalogButton disabled={uploading} onClick={() => input.current?.click()}>{uploading ? 'Uploading...' : 'Upload'}</CatalogButton>
        {field.kind!=='pdf'&&<MediaPicker kind={field.kind} disabled={uploading} onSelect={url=>{form?.change(props?.['data-admin-field']);setResult(null);onChange(url)}}/>}
      </div>
      <FieldError name={path}/>
    </div>
    <FormNotice result={result}/>
  </div>
}

export function UrlField({label, value, onChange, media = false, owner, name}: {name:string; label: string; value: string; onChange: (value: string) => void; media?: boolean; owner?: CmsMediaOwner}) {
  const form = useAdminFields()
  const generatedId = useId()
  const props = {...form?.input(name),id:form?.input(name).id ?? generatedId}
  const field: CmsAssetField = {id: label, label, kind: value.endsWith('.webm') ? 'video' : 'image', source: value, value}
  if (media && owner) return <AssetField name={name} field={field} owner={owner} onChange={onChange} />
  return <div className="cms-url-field"><label htmlFor={props.id}>{label}{props.required&&<RequiredMark/>}</label><input {...props} value={value} onChange={(event) => {form?.change(props?.['data-admin-field']);onChange(event.target.value)}} /><FieldError name={name}/></div>
}
