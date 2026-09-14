'use client'

import { saveProductFilter } from '@/app/admin/product-filters/actions'
import type { AdminCapabilities } from '@/lib/admin/access'
import type {getProductFilters} from '@/server/services/catalog/product-filters'
import { useState } from 'react'
import { AdminForm } from './admin-form'
import { AdminPageHeader } from './admin-page-header'
import { CatalogField,CatalogFormGrid,CatalogFormMain,CatalogFormSidebar } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'
import { LocalizedFields,UrlField } from './cms-fields'
import { AdminFormProvider,FormNotice,useAdminForm } from './form-feedback'

const groups = [{value: 'applications', label: 'Applications'}, {value: 'concentrations', label: 'Concentrations'}] as const
type ProductFilter=Awaited<ReturnType<typeof getProductFilters>>[number]
const groupLabel = (group: ProductFilter['group']) => groups.find(option => option.value === group)!.label

export function ProductFilterEditor({record, capabilities}: {record: ProductFilter; capabilities: AdminCapabilities}) {
  const [values, setValues] = useState(record)
  const form = useAdminForm(values)
  const creating = !record.id
  const basePath = `/admin/product-filters/${record.group}`
  const noun = record.group === 'applications' ? 'application' : 'concentration'
  return <AdminFormProvider form={form}><section className="catalog-admin-page catalog-edit-page">
    <AdminForm noValidate onChangeCapture={() => form.change()} onSubmit={event => {
      event.preventDefault()
      const data=new FormData(event.currentTarget)
      data.set('id',String(values.id));data.set('group',values.group);data.set('is_active',String(values.is_active))
      void form.run(() => saveProductFilter(data))
    }}>
      <AdminPageHeader title={creating ? `Add ${noun}` : `Edit ${record.en}`} eyebrow={`Catalog / ${groupLabel(record.group)}`} backHref={basePath} creating={creating} noun={noun} submitting={form.submitting} canSave={creating ? capabilities.create : capabilities.edit} sticky/>
      <FormNotice result={form.result}/>
      <CatalogFormGrid>
        <CatalogFormMain>
          <CatalogPanel title="Basic information" description="Enter the customer-facing name in all three languages.">
            <LocalizedFields name={locale => locale} label="Name" value={{en: values.en, ar: values.ar, fr: values.fr}} onChange={names => setValues({...values, ...names})}/>
          </CatalogPanel>
        </CatalogFormMain>
        <CatalogFormSidebar>
          <CatalogPanel title="Availability">
            <label className="catalog-switch"><input type="checkbox" checked={values.is_active} onChange={event => setValues({...values, is_active: event.target.checked})}/><span aria-hidden="true"/><b>{values.is_active ? 'Active' : 'Inactive'}</b></label>
            <p className="catalog-help">Inactive filters are hidden from the website. Product assignments are preserved.</p>
          </CatalogPanel>
          <CatalogPanel title="Organization">
            <UrlField name="slug" label="URL slug" value={values.slug} onChange={slug => setValues({...values, slug})}/>
            <CatalogField name="sort_order"><span>Display order</span><input type="number" min={0} value={Number.isNaN(values.sort_order) ? '' : values.sort_order} onChange={event => setValues({...values, sort_order: event.target.value === '' ? Number.NaN : Number(event.target.value)})}/></CatalogField>
          </CatalogPanel>
        </CatalogFormSidebar>
      </CatalogFormGrid>
    </AdminForm>
  </section></AdminFormProvider>
}
