'use client'
import { AdminForm } from './admin-form'

import { saveNewsPage } from '@/app/admin/news/actions'
import { newsLocales,type Localized,type NewsPageContent,type NewsPageLocale } from '@/lib/news/contracts'
import { useState } from 'react'
import { CatalogTabButton } from './catalog-button'
import { CmsSectionTabs } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'
import { AssetField,LocalizedFields } from './cms-fields'
import { AdminFormProvider,FormNotice,useAdminForm } from './form-feedback'
import { LocalizedEditor } from './localized-editor'
import { PageManagerShell } from './page-manager-shell'

const sections = [
  {key:'hero',label:'Hero'},
  {key:'related',label:'Related stories'},
  {key:'contact',label:'Contact'},
  {key:'events',label:'Events'},
  {key:'seo',label:'SEO and sharing'},
] as const

type TextKey = {[K in keyof NewsPageLocale]:NewsPageLocale[K] extends string ? K : never}[keyof NewsPageLocale]
type HeadingKey = Exclude<keyof NewsPageLocale,TextKey>

export function NewsPageManager({initial,canEdit}:{initial:NewsPageContent;canEdit:boolean}){
  const [content,setContent]=useState(initial)
  const [tab,setTab]=useState<(typeof sections)[number]['key']>('hero')
  const form=useAdminForm(content),busy=form.submitting
  const section=sections.find(section=>section.key===tab)!
  const localized=<K extends keyof NewsPageLocale>(key:K):Localized<NewsPageLocale[K]>=>({en:content.en[key],ar:content.ar[key],fr:content.fr[key]})
  const update=<K extends keyof NewsPageLocale>(key:K,values:Localized<NewsPageLocale[K]>)=>{
    setContent(previous=>({...previous,...Object.fromEntries(newsLocales.map(locale=>[locale,{...previous[locale],[key]:values[locale]}]))}))
    form.change()
  }
  const updateVisibility=(enabled:boolean)=>{setContent(previous=>({...previous,sectionVisibility:{...previous.sectionVisibility,[tab]:enabled}}));form.change()}
  const text=(key:TextKey,label:string,multiline=false)=><LocalizedFields name={(locale)=>`${locale}.${key}`} label={label} value={localized(key)} multiline={multiline} onChange={values=>update(key,values)}/>
  const heading=(key:HeadingKey)=><LocalizedEditor name={(locale)=>`${locale}.${key}`} key={key} editable={canEdit&&!busy} label="Heading" value={localized(key)} onChange={values=>update(key,values)}/>

  return <AdminFormProvider form={form} reveal={name=>{const key=name.split('.')[1]??'';setTab(key.startsWith('seo')?'seo':key.startsWith('related')?'related':key.startsWith('contact')?'contact':key.startsWith('events')?'events':'hero')}}><section onChangeCapture={()=>form.change()}><AdminForm noValidate onSubmit={async event=>{
    event.preventDefault()
    await form.run(()=>saveNewsPage(JSON.stringify(content)))
  }}>
    <fieldset disabled={!canEdit||busy} className="news-crud-fields">
      <PageManagerShell title="News page"  saving={busy} canSave={canEdit} navigation={<CmsSectionTabs aria-label="News page sections">{sections.map(section=><CatalogTabButton key={section.key} active={tab===section.key} onClick={()=>setTab(section.key)}>{section.label}</CatalogTabButton>)}</CmsSectionTabs>}>
        <FormNotice result={form.result}/>
        <div className="cms-editor-head"><div><p>News page section</p><h2>{section.label}</h2></div>{tab!=='seo'&&<label className="cms-toggle"><input type="checkbox" checked={content.sectionVisibility[tab]} onChange={event=>updateVisibility(event.target.checked)}/><span/>Show section</label>}</div>
        <CatalogPanel title={tab==='seo'?'Search engines':'Text in all languages'}>
          {tab==='hero'&&<>{heading('title')}{text('kicker','Eyebrow')}{text('description','Introduction',true)}{text('empty','Empty state',true)}</>}
          {tab==='related'&&<>{heading('relatedTitle')}{text('relatedKicker','Eyebrow')}</>}
          {tab==='contact'&&<>{heading('contactTitle')}{text('contactKicker','Eyebrow')}{text('contactDescription','Description',true)}</>}
          {tab==='events'&&<>{heading('eventsTitle')}{text('eventsKicker','Eyebrow')}{text('eventsDescription','Description',true)}</>}
          {tab==='seo'&&<>{text('seoTitle','Page title')}{text('seoDescription','Meta description',true)}</>}
        </CatalogPanel>
        {tab==='hero'&&<CatalogPanel title="Images and media">
          {newsLocales.map(locale=><AssetField name={`content.${locale}.hero`} key={locale} field={{id:`hero-${locale}`,label:`Hero image · ${locale.toUpperCase()}`,kind:'image',source:'',value:content[locale].hero}} owner={{type:'website-setting',key:'news'}} onChange={value=>update('hero',{...localized('hero'),[locale]:value})}/>)}
          {text('heroAlt','Alternative text')}
        </CatalogPanel>}
      </PageManagerShell>
    </fieldset>
  </AdminForm></section></AdminFormProvider>
}
