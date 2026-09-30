'use client'
import {useForm} from '@holo-js/adapter-next/client'
import {goalForm} from '@/app/admin/sustainability-goals/schema'
import {saveGoal} from '@/app/admin/sustainability-goals/actions'
import type {SustainabilityGoal} from '@/lib/sustainability/contracts'
import {AdminPageHeader} from './admin-page-header'
import {CatalogPanel} from './catalog-panel'
import {CatalogField} from './catalog-layout'
import {AssetField, LocalizedFields} from './cms-fields'
import {AdminForm} from './admin-form'
import {AdminFormProvider, FormNotice, useAdminForm, type AdminErrors} from './form-feedback'

export function SustainabilityGoalManager({initial, saved = false, canEdit}: {initial: SustainabilityGoal; saved?: boolean; canEdit: boolean}) {
  const form = useForm(goalForm, {
    initialValues: {...initial, sortOrder: initial.sortOrder ?? 0},
    validateOn: 'submit',
    submitter: ({values}) => saveGoal(initial.id, values),
  })
  const values = form.values
  const feedback = useAdminForm(values)
  const fields = {...feedback, submitting: form.submitting, input: (path?: string) => ({...feedback.input(path), name: path})}
  const submit = async () => {
    const result = await form.submit()
    if ('errors' in result) {
      const errors = typeof result.errors.flatten === 'function' ? result.errors.flatten() : result.errors as AdminErrors
      if (Object.values(errors).some(messages => messages.length)) feedback.apply({ok: false, message: 'Please correct the highlighted fields.', errors})
    }
  }
  return <AdminFormProvider form={fields}><AdminForm onChangeCapture={() => feedback.change()} onSubmit={event => {event.preventDefault(); void submit()}}>
    <AdminPageHeader title={initial.id ? `Edit ${initial.name.en}` : 'Create sustainability goal'} eyebrow="Sustainability / Goals" backHref="/admin/sustainability-goals" submitting={form.submitting} canSave={canEdit}/>
    {saved && <p role="status">Goal saved.</p>}
    <FormNotice result={feedback.result}/>
    <fieldset className="news-crud-fields" disabled={!canEdit || form.submitting}>
      <CatalogPanel title="Goal identity">
        <LocalizedFields name="name" label="Name" value={values.name} onChange={name => void form.setValue('name', name)}/>
        <AssetField name="image" field={{id:'goal-image',kind:'image',label:'Goal image',source:'',value:values.image}} owner={{type:'sustainability-goal',key:String(initial.id)}} onChange={image => void form.setValue('image', image)}/>
        <LocalizedFields name="alt" label="Alternative text" value={values.alt} onChange={alt => void form.setValue('alt', alt)}/>
        <CatalogField name="color"><span>Accent color</span><input type="color" value={values.color} onChange={event => void form.setValue('color', event.target.value)}/></CatalogField>
        <CatalogField name="sortOrder"><span>Display order</span><input type="number" min="0" step="1" value={values.sortOrder} onChange={event => void form.setValue('sortOrder', Number(event.target.value))}/></CatalogField>
      </CatalogPanel>
    </fieldset>
  </AdminForm></AdminFormProvider>
}
