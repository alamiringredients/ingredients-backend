'use client'
import { AdminForm } from './admin-form'
import { CatalogButton,CatalogIconButton,CatalogTabButton } from './catalog-button'
import {Icon} from './catalog-icon'

import { CmsSectionTabs } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'

import { AdminFormProvider,FormNotice,useAdminForm } from './form-feedback'

import { saveHomeSectionAction,saveHomeSeoAction } from '@/app/admin/actions'
import type { HomeCmsData,HomeSectionContent } from '@/lib/cms/contracts'
import { useState } from 'react'
import { AssetField,LocalizedFields,SeoFields,TextContentFields,UrlField } from './cms-fields'
import { ConfirmAction } from './confirm-action'
import { PageManagerShell } from './page-manager-shell'
import {HomeFiguresRepeater} from './home-figures-repeater'

type Panel = {kind: 'section'; key: string} | {kind: 'seo'; key: 'seo'}

const homeSectionKeys = ['hero', 'figures', 'story', 'products', 'certifications', 'sourcing', 'process', 'quality', 'reach', 'contact']
const sharedSectionKeys = ['header', 'footer', 'overlays']

const headerGroups = [
  {title: 'Primary navigation · left', sources: ['Home', 'About us', 'Products', 'Quality', 'Sustainability']},
  {title: 'Secondary navigation · right', sources: ['Careers', 'News', 'Downloads', 'Contact', 'Get in touch']},
  {title: 'Mobile menu', sources: ['Sadat City, Egypt', 'Est. 1970']},
]

type SectionFieldGroup = {title:string;description:string;sources:string[];assets?:string[]}

const footerGroups:SectionFieldGroup[] = [
  {title:'Brand and introduction',description:'The first footer column: company introduction. Its logo comes from Website settings.',sources:['Alamir Ingredients','Tomato, fruit purees and concentrates, manufactured in Sadat City, Egypt.']},
  {title:'Parent company',description:'The Al Amir Group card below the introduction. Its logo comes from Website settings.',sources:['Part of','Visit site','Alamir Group']},
  {title:'Explore links',description:'The Explore column of the footer.',sources:['Explore','About us','Products','Quality & capability','Sustainability']},
  {title:'Company links',description:'The Company column of the footer.',sources:['Company','Careers','News','Events','Downloads','Contact','Al Amir Group']},
  {title:'Export team and contact details',description:'The contact column heading. Phone numbers, address and social links come from Website settings.',sources:['Export team']},
  {title:'Social media labels',description:'Accessible labels for the social icons under the export team details.',sources:['Facebook','Instagram','LinkedIn','YouTube','WhatsApp']},
  {title:'Copyright and tagline',description:'The text along the bottom of the footer.',sources:['(c) 2026 Alamir Ingredients','From Egyptian fields to global formulas.']},
  {title:'Legal links',description:'The privacy, terms, cookies and sitemap links in the bottom row.',sources:['Privacy policy','Terms of use','Cookie notice','Sitemap']},
]

const overlayGroups:SectionFieldGroup[] = [
  {title:'Event announcement',description:'Labels and buttons in the upcoming-event popup. The event title, dates, venue, stand and photo come from Events & appointments.',sources:['Upcoming event','Meet us at','Book a meeting','View all','Not right now','Close announcement']},
  {title:'Request a quote · introduction',description:'The quote popup heading, introductory paragraph and close-button label. Current form labels and validation messages are managed in Translations; product options come from Products.',sources:['Request a quote','Tell us what you','need.','Sealed 1 kg sample plus the technical data sheet within five business days. No obligation.','Close']},
  {title:'Cookie notice',description:'The cookie banner, policy link and consent buttons.',sources:['Cookie notice','cookie notice','Accept all','Essential only','We use essential cookies to run this site and optional analytics cookies to understand which pages buyers use. Read the']},
]

const homeImageFields: Record<string, {label: string; altSource: string}> = {
  '/assets/photos/magnific_exterior-of-a-large-moder_NZ917Pn6D9.webp': {label: 'Story image', altSource: 'Alamir Ingredients manufacturing facility in Sadat City'},
  '/assets/photos/origin-farmer-a.webp': {label: 'Sourcing image', altSource: 'An Egyptian grower standing among the tomato plants at sunrise, holding a crate of freshly picked fruit'},
  '/assets/photos/magnific_interior-of-a-modern-food_swLaKaNl8e.webp': {label: 'Quality image', altSource: 'Modern stainless steel food processing line'},
}

function HomeSectionFields({section,onChange}: {section:HomeSectionContent;onChange:(section:HomeSectionContent)=>void}) {
  const imageTextSources = section.assets.flatMap(asset => homeImageFields[asset.source]?.altSource ?? [])
  const textFields = (sources?:string[]) => <TextContentFields
    fields={section.texts.filter(field=>!imageTextSources.includes(field.source) && (!sources || sources.includes(field.source)))}
    richTexts={sources ? section.richTexts?.filter(field=>field.sources.some(source=>sources.includes(source))) : section.richTexts}
    onChange={texts=>onChange({...section,texts:section.texts.map(field=>texts.find(next=>next.id===field.id)??field)})}
    onRichChange={richTexts=>onChange({...section,richTexts:section.richTexts?.map(field=>richTexts.find(next=>next.id===field.id)??field)})}
  />
  const media = section.assets.map(asset => {
    const image = homeImageFields[asset.source]
    const alt = section.texts.find(field => field.source === image?.altSource)
    return <CatalogPanel key={asset.id} title={image ? 'Image and accessibility' : 'Images and media'}>
      <AssetField field={image ? {...asset,label:image.label} : asset} owner={{type:'home-section',key:section.key}} onChange={value=>onChange({...section,assets:section.assets.map(field=>field.id===asset.id?{...field,value}:field)})}/>
      {alt && <LocalizedFields label="Alternative text" value={alt.values} multiline onChange={values=>onChange({...section,texts:section.texts.map(field=>field.id===alt.id?{...field,values}:field)})}/>}
    </CatalogPanel>
  })

  if(section.key==='header') {
    const groupedSources=headerGroups.flatMap(group=>group.sources)
    return <>
      <p className="catalog-help">Groups follow the frontend header. Product dropdown content is managed in Products and Product categories. The site-wide logo is managed in Website settings.</p>
      {headerGroups.map(group=><CatalogPanel title={group.title} key={group.title}>{textFields(group.sources)}</CatalogPanel>)}
      <CatalogPanel title="Navigation accessibility and brand labels">{textFields(section.texts.filter(field=>!groupedSources.includes(field.source)).map(field=>field.source))}</CatalogPanel>
      {media}
    </>
  }
  if(section.key==='figures') {
    return <>
      <CatalogPanel title="Section heading and group link">{textFields()}</CatalogPanel>
      {media}
      <CatalogPanel title="Figures"><HomeFiguresRepeater items={section.figures??[]} onChange={figures=>onChange({...section,figures})}/></CatalogPanel>
    </>
  }
  if(section.key==='contact') {
    const intro=['Start a conversation',"Let's",'get in touch.','Send us the product, the volume, the target Brix and the destination port. Our export desk comes back with specification, lead time and pricing.','Contact the team']
    const heading=['Export desk','Start with four details.','Enquiry details','Industrial and export enquiries']
    const labels=['Full name','Company','Work email','Country','Select a country','Product','Select a product','Tomato concentrate','Fruit concentrate','Fruit puree','Chilli concentrate','Volume','Target Brix','Destination','Send enquiry']
    const remaining=section.texts.filter(field=>![...intro,...heading,...labels].includes(field.source)).map(field=>field.source)
    return <>
      <p className="catalog-help">Company contact details are managed in <a href="/admin/settings">Website settings</a>. Country names are managed in <a href="/admin/translations?section=countries">Translations · Countries</a> and shared across forms.</p>
      <CatalogPanel title="Contact introduction">{textFields(intro)}</CatalogPanel>
      <CatalogPanel title="Enquiry panel headings and contact details">{textFields(heading)}</CatalogPanel>
      <CatalogPanel title="Form labels and product options">{textFields(labels)}</CatalogPanel>
      <CatalogPanel title="Placeholders and validation messages">{textFields(remaining)}</CatalogPanel>
      {media}
    </>
  }
  if(section.key==='footer'||section.key==='overlays') {
    const groups=section.key==='footer'?footerGroups:overlayGroups
    const groupedSources=groups.flatMap(group=>group.sources)
    const groupedAssets=groups.flatMap(group=>group.assets??[])
    const remainingSources=section.texts.filter(field=>!groupedSources.includes(field.source)).map(field=>field.source)
    const remainingAssets=section.assets.filter(asset=>!groupedAssets.includes(asset.source))
    const assetFields=(assets:typeof section.assets)=>assets.map(asset=><AssetField key={asset.id} field={asset} owner={{type:'home-section',key:section.key}} onChange={value=>onChange({...section,assets:section.assets.map(field=>field.id===asset.id?{...field,value}:field)})}/>)
    return <>
      {groups.map(group=><CatalogPanel key={group.title} title={group.title} description={group.description}>
        {textFields(group.sources)}
        {assetFields(section.assets.filter(asset=>group.assets?.includes(asset.source)))}
      </CatalogPanel>)}
      {!!remainingSources.length&&<CatalogPanel title={section.key==='overlays'?'Other popup content':'Other footer content'}>{textFields(remainingSources)}</CatalogPanel>}
      {!!remainingAssets.length&&<CatalogPanel title="Other images and media">{assetFields(remainingAssets)}</CatalogPanel>}
    </>
  }
  return <>
    <CatalogPanel title="Text in all languages">{textFields()}</CatalogPanel>
    {media}
  </>
}

export function HomeContentManager({initialData}: {initialData: HomeCmsData}) {
  const [data, setData] = useState(initialData)
  const [panel, setPanel] = useState<Panel>({kind: 'section', key: initialData.sections.find(section=>section.key==='hero')?.key ?? initialData.sections[0]?.key ?? 'hero'})
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
        {[{label:'Homepage sections',keys:homeSectionKeys},{label:'Shared site sections',keys:sharedSectionKeys},{label:'Other sections',keys:data.sections.filter(item=>![...homeSectionKeys,...sharedSectionKeys].includes(item.key)).map(item=>item.key)}].filter(group=>group.keys.some(key=>data.sections.some(item=>item.key===key))).map(group=><div className="home-menu-group" key={group.label}><h2>{group.label}</h2>{group.keys.flatMap(key=>data.sections.filter(item=>item.key===key)).map((item) => <CatalogTabButton type="button" onClick={() => {setPanel({kind: 'section', key: item.key}); form.reset()}} key={item.key} active={panel.kind === 'section' && panel.key === item.key}>
          <span>{item.label}</span><i className={item.enabled ? 'is-visible' : ''}>{item.enabled ? 'Visible' : 'Hidden'}</i>
        </CatalogTabButton>)}</div>)}
        <CatalogTabButton type="button" onClick={() => {setPanel({kind: 'seo', key: 'seo'}); form.reset()}} active={panel.kind === 'seo'}><span>SEO and sharing</span></CatalogTabButton>
      </CmsSectionTabs>}>
        <FormNotice result={form.result}/>
        {section && <>
          <div className="cms-editor-head">
            <div><p>{sharedSectionKeys.includes(section.key)?'Shared site section':'Homepage section'}</p><h2>{section.label}</h2></div>
            <label className="cms-toggle"><input type="checkbox" checked={section.enabled} onChange={(event) => replaceSection({...section, enabled: event.target.checked})} /><span />Show section</label>
          </div>
          {section.key === 'certifications' && <p className="catalog-help">Names, logos, statuses and documents are managed in Certifications. This section controls the homepage introduction.</p>}
          <HomeSectionFields section={section} onChange={replaceSection}/>
          {!!section.links.length&&<CatalogPanel title="Links and contact details">{section.links.map((link,index)=><UrlField key={link.id} name={`links.${index}.value`} label={link.label} value={link.value} onChange={value=>replaceSection({...section,links:section.links.map(field=>field.id===link.id?{...field,value}:field)})}/>)}</CatalogPanel>}
          {section.videos && <CatalogPanel><div className="cms-block-title"><h3>Hero video sequence</h3><CatalogButton type="button" onClick={() => replaceSection({...section, videos: [...(section.videos ?? []), '']})} variant="secondary">Add video</CatalogButton></div><div className="cms-sort-list">{section.videos.map((video, index) => <div className="cms-video-row" key={index}>
              <span>{index + 1}</span><AssetField name={`videos.${index}`} field={{id:`video-${index}`,label:`Video ${index+1} · WebM`,kind:'video',source:'',value:video}} owner={{type:'home-section',key:section.key}} onChange={value=>replaceSection({...section,videos:section.videos?.map((item,current)=>current===index?value:item)})}/>
              <div className="cms-video-actions">
                <CatalogIconButton aria-label={`Move video ${index+1} up`} disabled={index === 0} onClick={() => {const videos = [...(section.videos ?? [])]; [videos[index - 1], videos[index]] = [videos[index], videos[index - 1]]; replaceSection({...section, videos})}}><Icon name="up"/></CatalogIconButton>
                <CatalogIconButton aria-label={`Move video ${index+1} down`} disabled={index === section.videos!.length - 1} onClick={() => {const videos = [...(section.videos ?? [])]; [videos[index + 1], videos[index]] = [videos[index], videos[index + 1]]; replaceSection({...section, videos})}}><Icon name="down"/></CatalogIconButton>
                <ConfirmAction triggerClassName="is-delete" triggerLabel={`Remove video ${index + 1}`} title={`Remove video ${index + 1}?`} description="This video will be removed from the sequence. Save your changes to make the removal permanent." confirmLabel="Remove" onConfirm={() => replaceSection({...section, videos: section.videos?.filter((_, current) => current !== index)})}><Icon name="delete"/></ConfirmAction>
              </div>
            </div>)}</div></CatalogPanel>}
        </>}
        {panel.kind === 'seo' && <>
          <div className="cms-editor-head"><div><p>Search and social</p><h2>Homepage SEO</h2></div></div>
          <CatalogPanel><SeoFields value={data.seo} owner={{type: 'website-setting', key: 'home_seo'}} onChange={seo => setData({...data, seo})}/></CatalogPanel>
        </>}
    </PageManagerShell>
  </AdminForm></section></AdminFormProvider>
}
