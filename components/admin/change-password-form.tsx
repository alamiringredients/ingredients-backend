'use client'
import { changePasswordAction } from '@/app/admin/change-password/actions'
import { useState } from 'react'
import {useRouter} from 'next/navigation'
import { AdminForm } from './admin-form'
import { CatalogButton } from './catalog-button'
import { CatalogField } from './catalog-layout'
import { AdminFormProvider,FormNotice,useAdminForm } from './form-feedback'

export function ChangePasswordForm(){
  const router = useRouter()
  const [values,setValues]=useState({currentPassword:'',password:'',passwordConfirmation:''})
  const form=useAdminForm(values)
  return <AdminFormProvider form={form}><AdminForm noValidate onChangeCapture={()=>form.change()} onSubmit={async event=>{
    event.preventDefault()
    const result=await form.run(()=>changePasswordAction(new FormData(event.currentTarget)))
    if(result?.ok){setValues({currentPassword:'',password:'',passwordConfirmation:''});router.replace('/login');router.refresh()}
  }} className="password-form" aria-busy={form.submitting}>
    <CatalogField name="currentPassword"><span>Current password</span><input value={values.currentPassword} onChange={event=>setValues({...values,currentPassword:event.target.value})} type="password" autoComplete="current-password" disabled={form.submitting}/></CatalogField>
    <CatalogField name="password"><span>New password</span><input value={values.password} onChange={event=>setValues({...values,password:event.target.value})} type="password" autoComplete="new-password" disabled={form.submitting}/><small>Use at least 8 characters.</small></CatalogField>
    <CatalogField name="passwordConfirmation"><span>Confirm new password</span><input value={values.passwordConfirmation} onChange={event=>setValues({...values,passwordConfirmation:event.target.value})} type="password" autoComplete="new-password" disabled={form.submitting}/></CatalogField>
    <FormNotice result={form.result}/><CatalogButton type="submit" variant="primary" disabled={form.submitting}>{form.submitting?'Updating password…':'Update password'}</CatalogButton>
  </AdminForm></AdminFormProvider>
}
