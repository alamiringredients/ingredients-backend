'use client'
import { AdminForm } from './admin-form'
import { AdminPageHeader } from './admin-page-header'

import { CatalogField,CatalogFormGrid,CatalogFormMain,CatalogFormSidebar } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'

import { saveCertificationRecord } from '@/app/admin/certification-actions'
import type { AdminCapabilities } from '@/lib/admin/access'
import { certificationKinds,certificationStatuses,type Certification,type CertificationData,type CertificationType } from '@/lib/certifications/contracts'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AssetField,LocalizedFields,UrlField } from './cms-fields'
import { AdminFormProvider,FormNotice,useAdminForm,type AdminResult } from './form-feedback'

const holders = {'group': 'Al Amir Group', 'sadat-city': 'Alamir Ingredients · Sadat City'}
const statuses = {'planned': 'Planned', 'in-progress': 'In progress', 'held': 'Held', 'suspended': 'Suspended', 'expired': 'Expired'}
type Props = {data: CertificationData; kind: 'certification' | 'certification-type'; capabilities: AdminCapabilities; initialRecord?: Certification | CertificationType}

export function CertificationManager({data, kind, capabilities, initialRecord}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(initialRecord ?? null)
  const form = useAdminForm(selected)
  const busy=form.submitting
  const isType = kind === 'certification-type'
  const basePath = isType ? '/admin/certification-types' : '/admin/certifications'
  const title = isType ? 'Certification types' : 'Certifications'
  const singular = isType ? 'certification type' : 'certification'
  const record = selected && 'type_id' in selected ? selected : null
  const type = selected && 'slug' in selected ? selected : null
  const linkedType = record ? data.types.find(type => type.id === record.type_id) : type
  const name = linkedType?.content.name.en || singular
  const updateRecord = (patch: Partial<Certification>) => record && setSelected({...record, ...patch})
  const updateType = (patch: Partial<CertificationType>) => type && setSelected({...type, ...patch})
  const run=async(action:()=>Promise<AdminResult>)=>{
    const result=await form.run(action)
    if(result?.ok)router.refresh()
  }

  if (!selected) throw new Error('An editor record is required.')

  return <AdminFormProvider form={form}><section className="catalog-admin-page catalog-edit-page"><AdminForm noValidate onChangeCapture={() => form.change()} onSubmit={event => {event.preventDefault(); void run(() => saveCertificationRecord(kind, selected.id, JSON.stringify(selected)))}}>
    <AdminPageHeader title={<>{selected.id ? `Edit ${name}` : `Add ${singular}`}</>} eyebrow={<>Quality / {title}</>} backHref={basePath} creating={!selected.id} noun={singular} submitting={busy} canSave={selected.id ? capabilities.edit : capabilities.create} sticky/>
    <FormNotice result={form.result}/>
    <CatalogFormGrid><CatalogFormMain>
      {type && <>
        <CatalogPanel title={<>Basic information</>} description={<>These details are shared by all holders.</>} bodyClassName="catalog-panel-body"><LocalizedFields name="content.name" label="Name" value={type.content.name} onChange={name => updateType({content: {...type.content, name}})}/><LocalizedFields label="Description" value={type.content.description} multiline onChange={description => updateType({content: {...type.content, description}})}/></CatalogPanel>
        <CatalogPanel title={<>Badge</>} bodyClassName="catalog-panel-body">{selected.id ? <AssetField name="content.logo" field={{id: 'logo', label: 'Logo', source: '', kind: 'image', value: type.content.logo}} owner={{type: kind, key: String(selected.id)}} onChange={logo => updateType({content: {...type.content, logo}})}/> : <><UrlField name="content.logo" label="Logo URL" value={type.content.logo} onChange={logo => updateType({content: {...type.content, logo}})}/><p className="catalog-help">Create this type to upload a logo. You can start with a text badge.</p></>}<UrlField name="content.badge" label="Text badge" value={type.content.badge} onChange={badge => updateType({content: {...type.content, badge}})}/><p className="catalog-help">The text badge is used when no logo is attached.</p></CatalogPanel>
      </>}
      {record && <>
        <CatalogPanel title={<>Certification details</>} description={<>Status and dates apply only to the selected holder.</>} bodyClassName="catalog-panel-body"><CatalogField name="type_id"><span>Certification type</span><select  value={record.type_id} onChange={event => updateRecord({type_id: Number(event.target.value)})}><option value={0}>Choose a certification type</option>{data.types.map(type => <option key={type.id} value={type.id}>{type.content.name.en}</option>)}</select></CatalogField><CatalogField name="holder"><span>Holder</span><select value={record.holder} onChange={event => updateRecord({holder: event.target.value as Certification['holder']})}>{Object.entries(holders).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CatalogField><LocalizedFields label="Scope or holder-specific description" value={record.content.scope} multiline onChange={scope => updateRecord({content: {...record.content, scope}})}/><UrlField name="content.certificate_number" label="Certificate number" value={record.content.certificate_number} onChange={certificate_number => updateRecord({content: {...record.content, certificate_number}})}/></CatalogPanel>
        <CatalogPanel title={<>Dates</>} bodyClassName="catalog-panel-body"><div className="cms-locale-grid">{(['target_date', 'issue_date', 'expiry_date'] as const).map(key => <CatalogField name={`content.${key}`} key={key}><span>{{target_date: 'Target date', issue_date: 'Issue date', expiry_date: 'Expiry date'}[key]}</span><input type="date" value={record.content[key]} onChange={event => updateRecord({content: {...record.content, [key]: event.target.value}})}/></CatalogField>)}</div><p className="catalog-help">Leave unknown dates empty. Held records show as expired after their expiry date.</p></CatalogPanel>
        <CatalogPanel title={<>Certificate document</>} description={<>Optional PDF. Published, held certificates appear in Downloads when a file is attached.</>} bodyClassName="catalog-panel-body">{selected.id ? <AssetField name="content.document" field={{id: 'document', label: 'Certificate PDF', source: '', kind: 'pdf', value: record.content.document}} owner={{type: kind, key: String(selected.id)}} onChange={document => updateRecord({content: {...record.content, document}})}/> : <><UrlField name="content.document" label="PDF URL" value={record.content.document} onChange={document => updateRecord({content: {...record.content, document}})}/><p className="catalog-help">Create this certification to upload its PDF.</p></>}</CatalogPanel>
      </>}
    </CatalogFormMain><CatalogFormSidebar><CatalogPanel title={<>{record ? 'Publishing' : 'Organization'}</>} bodyClassName="catalog-panel-body">
      {record && <><label className="catalog-switch"><input type="checkbox" checked={record.published} onChange={event => updateRecord({published: event.target.checked})}/><span aria-hidden="true"/><b>{record.published ? 'Published' : 'Draft'}</b></label><CatalogField name="status"><span>Status</span><select value={record.status} onChange={event => updateRecord({status: event.target.value as Certification['status']})}>{certificationStatuses.map(status => <option key={status} value={status}>{statuses[status]}</option>)}</select></CatalogField><CatalogField name="sort_order"><span>Display order</span><input  type="number" value={Number.isNaN(record.sort_order) ? '' : record.sort_order} onChange={event => updateRecord({sort_order: event.target.value === '' ? Number.NaN : Number(event.target.value)})}/></CatalogField><p className="catalog-help">Drafts are hidden everywhere. Sadat City entries also appear on the homepage and products page.</p></>}
      {type && <><UrlField name="slug" label="Slug" value={type.slug} onChange={slug => updateType({slug})}/><CatalogField name="content.kind"><span>Kind</span><select value={type.content.kind} onChange={event => updateType({content: {...type.content, kind: event.target.value as CertificationType['content']['kind']}})}>{certificationKinds.map(kind => <option key={kind} value={kind}>{kind[0].toUpperCase() + kind.slice(1)}</option>)}</select></CatalogField></>}
    </CatalogPanel></CatalogFormSidebar></CatalogFormGrid>
  </AdminForm></section></AdminFormProvider>
}
