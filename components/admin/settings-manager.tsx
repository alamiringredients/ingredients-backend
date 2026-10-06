'use client'
import { AdminForm } from './admin-form'
import { CatalogTabButton } from './catalog-button'
import {AdminPageHeader} from './admin-page-header'

import { CmsSectionTabs } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'

import { LocalizedPdfFields } from './catalog-fields'
import { AdminFormProvider,FormNotice,useAdminForm } from './form-feedback'

import { saveWebsiteSettingsAction } from '@/app/admin/actions'
import type { WebsiteSettings } from '@/lib/cms/contracts'
import { useState } from 'react'
import { LocalizedFields,UrlField } from './cms-fields'

type Panel = 'company' | 'brand' | 'company-profile' | 'seo'

const panels: {key: Panel; label: string; eyebrow: string}[] = [
  {key: 'company', label: 'Company information', eyebrow: 'Shared contact details'},
  {key: 'brand', label: 'Brand', eyebrow: 'Website identity'},
  {key: 'company-profile', label: 'Company profile', eyebrow: 'Shared document'},
  {key: 'seo', label: 'Default SEO', eyebrow: 'Search and social'},
]

export function SettingsManager({initialSettings,canEdit}: {initialSettings: WebsiteSettings;canEdit:boolean}) {
  const [settings, setSettings] = useState(initialSettings)
  const [panel, setPanel] = useState<Panel>('brand')
  const form=useAdminForm(settings)
  const saving=form.submitting
  const activePanel=panels.find(item=>item.key===panel)??panels[0]

  const save = async () => {
    const formData = new FormData()
    formData.set('key', 'website')
    formData.set('payload', JSON.stringify(settings))
    await form.run(()=>saveWebsiteSettingsAction(formData))
  }

  return <AdminFormProvider form={form} reveal={name=>setPanel(name.startsWith('company.')?'company':name.startsWith('companyProfile')?'company-profile':name.startsWith('defaultSeo')||name==='socialImage'?'seo':'brand')}><section onChangeCapture={()=>form.change()}><AdminForm noValidate onSubmit={event=>{event.preventDefault();if(canEdit)void (save())}}>
    <AdminPageHeader canSave={canEdit} title={<>Website settings</>} submitting={saving} sticky/>
    <div className="cms-layout">
      <CmsSectionTabs aria-label="Website settings sections">
        {panels.map(item=><CatalogTabButton type="button" onClick={()=>{setPanel(item.key);form.reset()}} key={item.key} active={panel===item.key}><span>{item.label}</span></CatalogTabButton>)}
      </CmsSectionTabs>
      <fieldset className="cms-editor news-crud-fields" disabled={!canEdit || saving}>
        <FormNotice result={form.result}/>
        <div className="cms-editor-head"><div><p>{activePanel.eyebrow}</p><h2>{activePanel.label}</h2></div></div>
        {panel==='company'&&<>
          <CatalogPanel title="Contact details" description="Used by the Contact page, homepage enquiry section and footer.">
            {(['email','phone','exportPhone','secondaryPhone','website'] as const).map(key=><UrlField key={key} name={`company.${key}`} label={{email:'Sales email',phone:'Main phone',exportPhone:'Export desk phone',secondaryPhone:'Secondary export phone',website:'Company website'}[key]} value={settings.company[key]} onChange={value=>setSettings({...settings,company:{...settings.company,[key]:value}})}/>)}
            <LocalizedFields label="Company address" name="company.address" value={settings.company.address} multiline onChange={address=>setSettings({...settings,company:{...settings.company,address}})}/>
          </CatalogPanel>
          <CatalogPanel title="Social media and WhatsApp">
            {(['facebook','instagram','linkedin','youtube','whatsapp'] as const).map(key=><UrlField key={key} name={`company.socialLinks.${key}`} label={key==='whatsapp'?'WhatsApp':key.charAt(0).toUpperCase()+key.slice(1)} value={settings.company.socialLinks[key]} onChange={value=>setSettings({...settings,company:{...settings.company,socialLinks:{...settings.company.socialLinks,[key]:value}}})}/>)}
            <UrlField name="company.salesWhatsapp" label="Contact sales on WhatsApp" value={settings.company.salesWhatsapp} onChange={salesWhatsapp=>setSettings({...settings,company:{...settings.company,salesWhatsapp}})}/>
          </CatalogPanel>
        </>}
        {panel==='brand'&&<CatalogPanel title={<>Identity and brand files</>}><LocalizedFields label="Website name" value={settings.siteName} onChange={(siteName) => setSettings({...settings, siteName})} /><UrlField name="logo" label="Main logo" value={settings.logo} media owner={{type: 'website-setting', key: 'website'}} onChange={(logo) => setSettings({...settings, logo})} /><UrlField name="groupLogo" label="Al Amir Group logo" value={settings.groupLogo} media owner={{type: 'website-setting', key: 'website'}} onChange={(groupLogo) => setSettings({...settings, groupLogo})} /><UrlField name="icon" label="Browser icon" value={settings.icon} media owner={{type: 'website-setting', key: 'website'}} onChange={(icon) => setSettings({...settings, icon})} /></CatalogPanel>}
        {panel==='company-profile'&&<CatalogPanel title={<>Documents in all languages</>}><LocalizedPdfFields label="Shared company profile" value={settings.companyProfile} owner={{type: 'website-setting', key: 'website'}} onChange={(companyProfile) => setSettings({...settings, companyProfile})} /></CatalogPanel>}
        {panel==='seo'&&<CatalogPanel title={<>Defaults for search and sharing</>}><LocalizedFields label="Default page title" value={settings.defaultSeoTitle} onChange={(defaultSeoTitle) => setSettings({...settings, defaultSeoTitle})} /><LocalizedFields label="Default meta description" value={settings.defaultSeoDescription} multiline onChange={(defaultSeoDescription) => setSettings({...settings, defaultSeoDescription})} /><UrlField name="socialImage" label="Default social image" value={settings.socialImage} media owner={{type: 'website-setting', key: 'website'}} onChange={(socialImage) => setSettings({...settings, socialImage})} /></CatalogPanel>}
      </fieldset>
    </div>
  </AdminForm></section></AdminFormProvider>
}
