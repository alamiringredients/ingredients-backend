'use client'

import {flushSync} from 'react-dom'
import {createContext,useContext,useEffect,useId,useMemo,useRef,useState,type ReactNode} from 'react'

export type AdminErrors=Record<string,readonly string[]>
export type AdminResult={ok:boolean;message:string;errors?:AdminErrors;url?:string}
export const fieldName=(path:string)=>path.replaceAll('.','__')

export function useAdminForm(data:unknown){
  const id=useId()
  const scope=useRef<HTMLFieldSetElement>(null)
  const [result,setResult]=useState<AdminResult|null>(null)
  const [submitting,setSubmitting]=useState(false)
  const [focusRequest,setFocusRequest]=useState<string|null>(null)
  const [focusRevision,setFocusRevision]=useState(0)
  const paths=useMemo(()=>{
    const index=new Map<object,string>()
    const visit=(value:unknown,path='')=>{
      if(!value||typeof value!=='object')return
      index.set(value,path)
      if(Array.isArray(value))value.forEach((child,childIndex)=>visit(child,path?`${path}.${childIndex}`:String(childIndex)))
      else for(const [key,child] of Object.entries(value))visit(child,path?`${path}.${key}`:key)
    }
    visit(data)
    return index
  },[data])
  const errors=result?.errors??{}
  const requestFocus=(nextErrors:AdminErrors=errors)=>{
    const names=Object.entries(nextErrors).filter(([,messages])=>messages.length).map(([name])=>name)
    const visible=Array.from(scope.current?.querySelectorAll<HTMLElement>('[data-admin-field]')??[]).find(element=>element.closest('[data-admin-form]')===scope.current&&names.some(name=>fieldName(name)===element.dataset.adminField)&&element.getClientRects().length>0)
    const first=names.find(name=>fieldName(name)===visible?.dataset.adminField)??names[0]
    if(first){setFocusRequest(first);setFocusRevision(value=>value+1)}
  }
  const apply=(next:AdminResult)=>{setResult(next);requestFocus(next.errors)}
  const change=(path?:string)=>{void path;setResult(null)}
  const error=(path:string)=>errors[path]?.[0]??errors[fieldName(path)]?.[0]
  const input=(path?:string)=>{
    const name=path?fieldName(path):undefined,message=path?error(path):undefined
    return {name,'data-admin-field':name,id:name?`admin-${id}-${name}`:undefined,required:false,'aria-invalid':message?true as const:undefined,'aria-describedby':message?`error-${id}-${name}`:undefined}
  }
  const run=async(submit:()=>Promise<AdminResult>):Promise<AdminResult|null>=>{
    if(submitting)return null
    setSubmitting(true)
    try{
      const next=await submit()
      apply(next)
      return next
    }catch(error){
      if(error instanceof Error&&'digest' in error&&String(error.digest).startsWith('NEXT_REDIRECT'))throw error
      setResult({ok:false,message:'The request failed. Please try again.'})
      return null
    }finally{setSubmitting(false)}
  }
  const path=(value:object)=>paths.get(value)
  const assetPath=(field:{id:string;source:string})=>{
    for(const [value,valuePath] of paths){const candidate=value as {id?:unknown;source?:unknown};if(candidate.id===field.id&&candidate.source===field.source)return `${valuePath}.value`}
  }
  return {scope,values:data,errors,result,apply,change,path,assetPath,input,error,run,submitting,reset:()=>setResult(null),required:new Set<string>(),focusRequest,focusRevision,clearFocus:()=>setFocusRequest(null)}
}

type AdminForm=ReturnType<typeof useAdminForm>
const FormContext=createContext<AdminForm|null>(null)
export function AdminFormProvider({form,children,reveal}:{form:AdminForm;children:ReactNode;reveal?:(name:string)=>void}){
  const scope=form.scope
  const revealRef=useRef(reveal)
  revealRef.current=reveal
  useEffect(()=>{
    if(!form.focusRequest)return
    let nextFrame=0
    const frame=requestAnimationFrame(()=>{
      flushSync(()=>revealRef.current?.(form.focusRequest!.replaceAll('__','.')))
      nextFrame=requestAnimationFrame(()=>{
        const target=Array.from(scope.current?.querySelectorAll<HTMLElement>('[data-admin-field]')??[]).find(element=>element.closest('[data-admin-form]')===scope.current&&(element.getAttribute('name')===fieldName(form.focusRequest!)||element.dataset.adminField===fieldName(form.focusRequest!)))??scope.current?.querySelector<HTMLElement>('[role=alert]')
        if(!target)return
        for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent instanceof HTMLDetailsElement)parent.open=true
        const control=target.querySelector<HTMLElement>('[contenteditable="true"],input,select,textarea')??target
        control.focus({preventScroll:true});control.scrollIntoView({block:'center',behavior:'instant'});form.clearFocus()
      })
    })
    return ()=>{cancelAnimationFrame(frame);cancelAnimationFrame(nextFrame)}
  },[form.focusRequest,form.focusRevision])
  return <FormContext.Provider value={form}><fieldset ref={scope} data-admin-form disabled={form.submitting} style={{display:'contents'}}>{children}</fieldset></FormContext.Provider>
}
export const useAdminFields=()=>useContext(FormContext)
export const RequiredMark=()=> <span className="admin-required" aria-hidden="true"> *</span>
export function FieldError({name}:{name?:string}){
  const form=useAdminFields(),message=name?form?.error(name):undefined
  return message?<span id={form?.input(name)['aria-describedby']} className="admin-field-error">{message}</span>:null
}
export function FormNotice({result}:{result:AdminResult|null}){
  return result?.message?<div className={`admin-notice ${result.ok?'is-success':'is-error'}`} tabIndex={-1} role={result.ok?'status':'alert'}><span aria-hidden="true">{result.ok?'\u2713':'!'}</span><div>{result.message}</div></div>:null
}
export function FieldGroup({name,children}:{name:string;children:ReactNode}){
  return <div data-admin-field={fieldName(name)} tabIndex={-1}>{children}<FieldError name={name}/></div>
}
