'use client'
import { AdminForm } from './admin-form'
import { CatalogTabButton } from './catalog-button'

import { CmsSectionTabs } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'


import { saveDownloadsPageAction } from '@/app/admin/actions'
import type { DownloadsPageContent } from '@/lib/downloads/contracts'
import { useState } from 'react'
import { AssetField,LocalizedFields,SeoFields } from './cms-fields'
import { AdminFormProvider,FormNotice,useAdminForm } from './form-feedback'
import { LocalizedEditor } from './localized-editor'
import { PageManagerShell } from './page-manager-shell'

type Panel = 'hero' | 'products' | 'company' | 'seo'

const panels: {key: Panel; label: string; eyebrow: string}[] = [
  {key: 'hero', label: 'Hero', eyebrow: 'Page introduction'},
  {key: 'products', label: 'Product documents', eyebrow: 'Downloads section'},
  {key: 'company', label: 'Company documents', eyebrow: 'Downloads section'},
  {key:'seo',label:'SEO and sharing',eyebrow:'Search and social'},
]

export function DownloadsManager({initialContent,canEdit}: {initialContent: DownloadsPageContent;canEdit:boolean}) {
  const [content, setContent] = useState(initialContent)
  const [panel, setPanel] = useState<Panel>('hero')
  const form = useAdminForm(content)
  const activePanel = panels.find(item => item.key === panel) ?? panels[0]

  const save = async () => {
    const formData = new FormData()
    formData.set('key', 'downloads')
    formData.set('payload', JSON.stringify(content))
    await form.run(() => saveDownloadsPageAction(formData))
  }

  return <AdminFormProvider form={form} reveal={name=>setPanel(name.startsWith('seo')?'seo':name.startsWith('hero')?'hero':name.startsWith('product')||name==='noTds'?'products':'company')}><section onChangeCapture={() => form.change()}><AdminForm noValidate onSubmit={event => {event.preventDefault(); if(canEdit)void save()}}>
    <PageManagerShell canSave={canEdit} title="Downloads page"  saving={form.submitting} navigation={<CmsSectionTabs aria-label="Downloads page sections">
        {panels.map(item => <CatalogTabButton type="button" onClick={() => {setPanel(item.key); form.reset()}} key={item.key} active={panel === item.key}><span>{item.label}</span></CatalogTabButton>)}
      </CmsSectionTabs>}>
        <FormNotice result={form.result}/>
        <div className="cms-editor-head"><div><p>{activePanel.eyebrow}</p><h2>{activePanel.label}</h2></div>{panel!=='seo'&&<label className="cms-toggle"><input type="checkbox" checked={content.sectionVisibility[panel]} onChange={event=>setContent({...content,sectionVisibility:{...content.sectionVisibility,[panel]:event.target.checked}})}/><span/>Show section</label>}</div>
        {panel === 'hero' && <>
          <CatalogPanel title={<>Text in all languages</>}><LocalizedFields label="Eyebrow" value={content.heroEyebrow} onChange={heroEyebrow => setContent({...content, heroEyebrow})}/>{content.heroHeading&&<LocalizedEditor editable={canEdit} label="Heading" value={content.heroHeading} onChange={heroHeading=>setContent({...content,heroHeading})}/>}<LocalizedFields label="Description" value={content.heroDescription} multiline onChange={heroDescription => setContent({...content, heroDescription})}/></CatalogPanel>
          <CatalogPanel title={<>Image and accessibility</>}><AssetField name="heroImage" field={{id: 'hero-image', label: 'Hero image', kind: 'image', source: '', value: content.heroImage}} owner={{type: 'website-setting', key: 'downloads'}} conversion="gallery" onChange={heroImage => setContent({...content, heroImage})}/><LocalizedFields label="Hero image alternative text" value={content.heroImageAlt} onChange={heroImageAlt => setContent({...content, heroImageAlt})}/></CatalogPanel>
        </>}
        {panel === 'products' && <CatalogPanel title={<>Text in all languages</>}><LocalizedFields label="Eyebrow" value={content.productEyebrow} onChange={productEyebrow => setContent({...content, productEyebrow})}/>{content.productHeading&&<LocalizedEditor editable={canEdit} label="Heading" value={content.productHeading} onChange={productHeading=>setContent({...content,productHeading})}/>}<LocalizedFields label="Empty message" value={content.noTds} multiline onChange={noTds => setContent({...content, noTds})}/></CatalogPanel>}
        {panel === 'company' && <CatalogPanel title={<>Text in all languages</>}><LocalizedFields label="Eyebrow" value={content.companyEyebrow} onChange={companyEyebrow => setContent({...content, companyEyebrow})}/>{content.companyHeading&&<LocalizedEditor editable={canEdit} label="Heading" value={content.companyHeading} onChange={companyHeading=>setContent({...content,companyHeading})}/>}<LocalizedFields label="Company profile label" value={content.profileLabel} onChange={profileLabel => setContent({...content, profileLabel})}/><LocalizedFields label="Empty message" value={content.noCompany} multiline onChange={noCompany => setContent({...content, noCompany})}/></CatalogPanel>}
        {panel==='seo'&&<CatalogPanel title={<>Search and social content</>}><SeoFields value={content.seo} owner={{type:'website-setting',key:'downloads'}} onChange={seo=>setContent({...content,seo})}/></CatalogPanel>}
    </PageManagerShell>
  </AdminForm></section></AdminFormProvider>
}
