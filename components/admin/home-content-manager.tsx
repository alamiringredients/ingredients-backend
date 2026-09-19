'use client'
import { AdminForm } from './admin-form'
import { CatalogButton,CatalogTabButton } from './catalog-button'

import { CmsSectionTabs } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'

import { AdminFormProvider,FieldError,FormNotice,useAdminForm } from './form-feedback'

import { saveHomeSectionAction,saveHomeSeoAction } from '@/app/admin/actions'
import type { HomeCmsData,HomeSectionContent } from '@/lib/cms/contracts'
import { useState } from 'react'
import { AssetField,SeoFields,StatFields,TextContentFields } from './cms-fields'
import { ConfirmAction } from './confirm-action'
import { PageManagerShell } from './page-manager-shell'

type Panel = {kind: 'section'; key: string} | {kind: 'seo'; key: 'seo'}

export function HomeContentManager({initialData}: {initialData: HomeCmsData}) {
  const [data, setData] = useState(initialData)
  const [panel, setPanel] = useState<Panel>({kind: 'section', key: initialData.sections[0]?.key ?? 'hero'})
  const section = panel.kind === 'section' ? data.sections.find((item) => item.key === panel.key) : undefined
  const form=useAdminForm(section ?? data.seo)
  const saving=form.submitting

  const replaceSection = (next: HomeSectionContent) => setData((current) => ({...current, sections: current.sections.map((item) => item.key === next.key ? next : item)}))
  const saveSection = async () => {
    if (!section) return
    const formData = new FormData()
    formData.set('key', section.key)
    formData.set('payload', JSON.stringify(section))
    await form.run(()=>saveHomeSectionAction(formData))
  }
  const saveSeo = async () => {
    const formData = new FormData()
    formData.set('key', 'home_seo')
    formData.set('payload', JSON.stringify(data.seo))
    await form.run(()=>saveHomeSeoAction(formData))
  }

  return <AdminFormProvider form={form}><section onChangeCapture={()=>form.change()}><AdminForm noValidate onSubmit={event=>{event.preventDefault();void (panel.kind === 'seo' ? saveSeo() : saveSection())}}>
    <PageManagerShell title="Home page"  saving={saving} navigation={<CmsSectionTabs aria-label="Homepage sections">
        {data.sections.map((item) => <CatalogTabButton type="button" onClick={() => {setPanel({kind: 'section', key: item.key}); form.reset()}} key={item.key} active={panel.kind === 'section' && panel.key === item.key}>
          <span>{item.label}</span><i className={item.enabled ? 'is-visible' : ''}>{item.enabled ? 'Visible' : 'Hidden'}</i>
        </CatalogTabButton>)}
        <CatalogTabButton type="button" onClick={() => {setPanel({kind: 'seo', key: 'seo'}); form.reset()}} active={panel.kind === 'seo'}><span>SEO and sharing</span></CatalogTabButton>
      </CmsSectionTabs>}>
        <FormNotice result={form.result}/>
        {section && <>
          <div className="cms-editor-head">
            <div><p>Homepage section</p><h2>{section.label}</h2></div>
            <label className="cms-toggle"><input type="checkbox" checked={section.enabled} onChange={(event) => replaceSection({...section, enabled: event.target.checked})} /><span />Show section</label>
          </div>
          {section.key === 'certifications' && <p className="catalog-help">Names, logos, statuses and documents are managed in Certifications. This section controls the homepage introduction.</p>}
          {section.key === 'figures' && section.stats && <CatalogPanel title={<>Key figure numbers</>}><StatFields fields={section.stats} onChange={stats=>replaceSection({...section,stats})}/></CatalogPanel>}
          <CatalogPanel title={<>Text in all languages</>}><TextContentFields richTexts={section.richTexts} onRichChange={richTexts=>replaceSection({...section,richTexts})} fields={section.texts} onChange={(texts) => replaceSection({...section, texts})} /></CatalogPanel>
          {!!section.assets.length && <CatalogPanel title={<>Images and media</>}>{section.assets.map((asset, index) => <AssetField field={asset} owner={{type: 'home-section', key: section.key}} onChange={(value) => replaceSection({...section, assets: section.assets.map((item, current) => current === index ? {...item, value} : item)})} key={asset.id} />)}</CatalogPanel>}
          {section.videos && <CatalogPanel><div className="cms-block-title"><h3>Hero video sequence</h3><CatalogButton type="button" onClick={() => replaceSection({...section, videos: [...(section.videos ?? []), '']})} variant="secondary">Add video</CatalogButton></div><div className="cms-sort-list">{section.videos.map((video, index) => <div className="cms-sort-row" key={index}>
              <span>{index + 1}</span><input {...form.input(`videos.${index}`)} value={video} aria-label={`Video ${index+1} URL`} placeholder="/storage/cms/video.webm" onChange={(event) => replaceSection({...section, videos: section.videos?.map((item, current) => current === index ? event.target.value : item)})} /><FieldError name={`videos.${index}`}/>
              <CatalogButton type="button" disabled={index === 0} onClick={() => {const videos = [...(section.videos ?? [])]; [videos[index - 1], videos[index]] = [videos[index], videos[index - 1]]; replaceSection({...section, videos})}} variant="secondary">↑</CatalogButton>
              <CatalogButton type="button" disabled={index === section.videos!.length - 1} onClick={() => {const videos = [...(section.videos ?? [])]; [videos[index + 1], videos[index]] = [videos[index], videos[index + 1]]; replaceSection({...section, videos})}} variant="secondary">↓</CatalogButton>
              <ConfirmAction triggerClassName="is-delete" triggerLabel={`Remove video ${index + 1}`} title={`Remove video ${index + 1}?`} description="This video will be removed from the sequence. Save your changes to make the removal permanent." confirmLabel="Remove" onConfirm={() => replaceSection({...section, videos: section.videos?.filter((_, current) => current !== index)})}>×</ConfirmAction>
            </div>)}</div></CatalogPanel>}
        </>}
        {panel.kind === 'seo' && <>
          <div className="cms-editor-head"><div><p>Search and social</p><h2>Homepage SEO</h2></div></div>
          <CatalogPanel><SeoFields value={data.seo} owner={{type: 'website-setting', key: 'home_seo'}} onChange={seo => setData({...data, seo})}/></CatalogPanel>
        </>}
    </PageManagerShell>
  </AdminForm></section></AdminFormProvider>
}
