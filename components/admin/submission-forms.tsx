'use client'
import { useRouter } from 'next/navigation'
import { useMemo,useState } from 'react'
import { CatalogButton } from './catalog-button'
import { CatalogField,CatalogForm } from './catalog-layout'
import { AdminFormProvider,FormNotice,useAdminForm,type AdminResult } from './form-feedback'

type SubmissionKind='application'|'enquiry'
type Action=(data:FormData)=>Promise<AdminResult>
export function SubmissionReplyForm({kind,id,email,initialSubject,action}:{kind:SubmissionKind;id:number;email:string;initialSubject:string;action:Action}){
  const router=useRouter()
  const [subject,setSubject]=useState(initialSubject),[body,setBody]=useState(''),[key,setKey]=useState(()=>crypto.randomUUID())
  const values=useMemo(()=>({[`${kind}Id`]:id,subject,body,key}),[kind,id,subject,body,key])
  const form=useAdminForm(values)
  return <AdminFormProvider form={form}><CatalogForm noValidate onChangeCapture={()=>form.change()} onSubmit={async event=>{
    event.preventDefault()
    const data=new FormData(event.currentTarget)
    data.set(`${kind}Id`,String(id));data.set('key',key)
    const result=await form.run(()=>action(data))
    if(result?.ok){setBody('');setKey(crypto.randomUUID());router.refresh()}
  }}><FormNotice result={form.result}/><CatalogField><span>To</span><input value={email} readOnly/></CatalogField>
    <CatalogField name="subject"><span>Subject</span><input value={subject} onChange={event=>setSubject(event.target.value)} disabled={form.submitting}/></CatalogField>
    <CatalogField name="body"><span>Message</span><textarea rows={8} value={body} onChange={event=>setBody(event.target.value)} disabled={form.submitting}/></CatalogField>
    <CatalogButton variant="primary" type="submit" disabled={form.submitting}>{form.submitting?'Sending…':'Send reply'}</CatalogButton>
  </CatalogForm></AdminFormProvider>
}
export function SubmissionStatusForm({kind,id,initialStatus,canEdit,action}:{kind:SubmissionKind;id:number;initialStatus:string;canEdit:boolean;action:Action}){
  const router=useRouter(),[status,setStatus]=useState(initialStatus)
  const values=useMemo(()=>({[`${kind}Id`]:id,status}),[kind,id,status]),form=useAdminForm(values)
  return <AdminFormProvider form={form}><CatalogForm noValidate onChangeCapture={()=>form.change()} onSubmit={async event=>{
    event.preventDefault();const data=new FormData(event.currentTarget);data.set(`${kind}Id`,String(id));const result=await form.run(()=>action(data));if(result?.ok)router.refresh()
  }}><FormNotice result={form.result}/><CatalogField name="status"><span>Status</span><select value={status} disabled={!canEdit||form.submitting} onChange={event=>setStatus(event.target.value)}>
    {(kind==='application'?['pending','accepted','declined']:['open','closed']).map(value=><option key={value} value={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}
  </select></CatalogField>{canEdit&&<CatalogButton type="submit" variant="primary" disabled={form.submitting}>{form.submitting?'Saving…':'Save status'}</CatalogButton>}</CatalogForm></AdminFormProvider>
}
