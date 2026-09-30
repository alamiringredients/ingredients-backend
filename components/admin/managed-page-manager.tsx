'use client'
import { saveManagedPageAction } from '@/app/admin/managed-page-actions'
import { managedPageDefinitions,type ManagedPageKey } from '@/lib/cms/managed-pages'
import type { HomeSectionContent,ManagedPageContent } from '@/lib/cms/contracts'
import { useState } from 'react'
import { AdminForm } from './admin-form'
import { CatalogTabButton } from './catalog-button'
import { CmsSectionTabs } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'
import { AssetField,CmsCardRepeater,SeoFields,TextContentFields,UrlField } from './cms-fields'
import { AdminFormProvider,FormNotice,useAdminForm } from './form-feedback'
import { PageManagerShell } from './page-manager-shell'

type Panel={kind:'section';key:string}|{kind:'seo'}

export function ManagedPageManager({page,initialContent}:{page:ManagedPageKey;initialContent:ManagedPageContent}){
  const definition=managedPageDefinitions[page]
  const [content,setContent]=useState(initialContent)
  const [panel,setPanel]=useState<Panel>({kind:'section',key:content.sections[0]?.key??'hero'})
  const section=panel.kind==='section'?content.sections.find(item=>item.key===panel.key):undefined
  const form=useAdminForm(content)
  const replace=(next:HomeSectionContent)=>setContent(current=>({...current,sections:current.sections.map(item=>item.key===next.key?next:item)}))
  const save=async()=>{const data=new FormData();data.set('key',page);data.set('payload',JSON.stringify(content));await form.run(()=>saveManagedPageAction(data))}
  return <AdminFormProvider form={form} reveal={name=>{const [key,index]=name.split('.');setPanel(key==='seo'?{kind:'seo'}:{kind:'section',key:content.sections[Number(index)]?.key??'hero'})}}><section onChangeCapture={()=>form.change()}><AdminForm noValidate onSubmit={event=>{event.preventDefault();void save()}}><PageManagerShell title={definition.label}  saving={form.submitting} navigation={<CmsSectionTabs aria-label={`${definition.label} sections`}>
    {content.sections.map(item=><CatalogTabButton type="button" key={item.key} active={panel.kind==='section'&&panel.key===item.key} onClick={()=>{setPanel({kind:'section',key:item.key});form.reset()}}><span>{item.label}</span><i className={item.enabled?'is-visible':''}>{item.enabled?'Visible':'Hidden'}</i></CatalogTabButton>)}
    <CatalogTabButton type="button" active={panel.kind==='seo'} onClick={()=>{setPanel({kind:'seo'});form.reset()}}><span>SEO and sharing</span></CatalogTabButton>
  </CmsSectionTabs>}><FormNotice result={form.result}/>{section&&<><div className="cms-editor-head"><div><p>{definition.label} section</p><h2>{section.label}</h2></div><label className="cms-toggle"><input type="checkbox" checked={section.enabled} onChange={event=>replace({...section,enabled:event.target.checked})}/><span/>Show section</label></div>{section.cards?<CatalogPanel title="Navigation cards" description="Titles and descriptions stay together. Card numbers and destinations are fixed automatically."><CmsCardRepeater cards={section.cards} onChange={cards=>replace({...section,cards})}/></CatalogPanel>:<CatalogPanel title="Text in all languages" description={page==='contact'?<>Company contact details and social links are managed in <a href="/admin/settings">Website settings</a>.</>:undefined}><TextContentFields richTexts={section.richTexts} onRichChange={richTexts=>replace({...section,richTexts})} fields={section.texts} onChange={texts=>replace({...section,texts})}/></CatalogPanel>}{section.assets.length>0&&<CatalogPanel title="Images and media">{section.assets.map((asset,index)=>{const onChange=(value:string)=>replace({...section,assets:section.assets.map((item,current)=>current===index?{...item,value}:item)});return asset.kind==='video'&&asset.source.startsWith('http')?<UrlField name={`sections.${content.sections.indexOf(section)}.assets.${index}.value`} key={asset.id} label="Embedded video URL" value={asset.value} onChange={onChange}/>:<AssetField key={asset.id} field={asset} owner={{type:'website-setting',key:page}} conversion="gallery" onChange={onChange}/>})}</CatalogPanel>}{section.links.length>0&&<CatalogPanel title="Links">{section.links.map((link,index)=><UrlField name={`sections.${content.sections.indexOf(section)}.links.${index}.value`} key={link.id} label={link.label} value={link.value} onChange={value=>replace({...section,links:section.links.map((item,current)=>current===index?{...item,value}:item)})}/>)}</CatalogPanel>}</>}{panel.kind==='seo'&&<><div className="cms-editor-head"><div><p>Search and social</p><h2>{definition.label} SEO</h2></div></div><CatalogPanel><SeoFields value={content.seo} owner={{type:'website-setting',key:page}} onChange={seo=>setContent({...content,seo})}/></CatalogPanel></>}</PageManagerShell></AdminForm></section></AdminFormProvider>
}
