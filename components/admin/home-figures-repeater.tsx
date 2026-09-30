'use client'

import type {CmsFigureItem} from '@/lib/cms/contracts'
import {CatalogButton,CatalogIconButton} from './catalog-button'
import {Icon} from './catalog-icon'
import {LocalizedFields} from './cms-fields'
import {ConfirmAction} from './confirm-action'
import {FieldError,useAdminFields} from './form-feedback'

export function HomeFiguresRepeater({items,onChange}:{items:CmsFigureItem[];onChange:(items:CmsFigureItem[])=>void}) {
  const form=useAdminFields()
  const update=(index:number,patch:Partial<CmsFigureItem>)=>onChange(items.map((item,current)=>current===index?{...item,...patch}:item))
  const move=(index:number,direction:-1|1)=>{
    const next=[...items]
    ;[next[index],next[index+direction]]=[next[index+direction],next[index]]
    onChange(next)
  }
  return <div className="catalog-items">
    <p className="catalog-help">Each figure owns its number, units, label and description. Items appear on the homepage in this order.</p>
    {items.map((item,index)=><div className="catalog-item" key={item.id}>
      <div className="catalog-item-head"><b>Figure {String(index+1).padStart(2,'0')}</b><div className="catalog-item-actions">
        <CatalogIconButton disabled={index===0} onClick={()=>move(index,-1)} aria-label={`Move figure ${index+1} up`}><Icon name="up"/></CatalogIconButton>
        <CatalogIconButton disabled={index===items.length-1} onClick={()=>move(index,1)} aria-label={`Move figure ${index+1} down`}><Icon name="down"/></CatalogIconButton>
        <ConfirmAction triggerClassName="is-delete" triggerLabel={`Remove figure ${index+1}`} title={`Remove figure ${index+1}?`} description="Save your changes to remove this figure from the homepage." onConfirm={()=>onChange(items.filter((_,current)=>current!==index))}><Icon name="delete"/></ConfirmAction>
      </div></div>
      <div className="cms-locale-grid">
        <div className="admin-field"><label htmlFor={form?.input(`figures.${index}.value`).id}>Number</label><input {...form?.input(`figures.${index}.value`)} type="number" min="0" step="any" required value={Number.isFinite(item.value)?item.value:''} onChange={event=>update(index,{value:event.target.value===''?NaN:Number(event.target.value)})}/><FieldError name={`figures.${index}.value`}/></div>
        <div className="admin-field"><label htmlFor={form?.input(`figures.${index}.unit`).id}>Unit (optional)</label><input {...form?.input(`figures.${index}.unit`)} value={item.unit} placeholder="K, +, …" onChange={event=>update(index,{unit:event.target.value})}/><FieldError name={`figures.${index}.unit`}/></div>
      </div>
      <LocalizedFields name={`figures.${index}.unitLabel`} label="Small unit text (optional, e.g. MT)" value={item.unitLabel} onChange={unitLabel=>update(index,{unitLabel})}/>
      <LocalizedFields name={`figures.${index}.label`} label="Label" value={item.label} onChange={label=>update(index,{label})}/>
      <LocalizedFields name={`figures.${index}.description`} label="Description" value={item.description} onChange={description=>update(index,{description})}/>
    </div>)}
    {!items.length&&<p className="catalog-muted">No figures yet.</p>}
    <FieldError name="figures"/>
    <CatalogButton disabled={items.length>=30} onClick={()=>onChange([...items,{id:crypto.randomUUID(),value:0,unit:'',unitLabel:{en:'',ar:'',fr:''},label:{en:'',ar:'',fr:''},description:{en:'',ar:'',fr:''}}])}><Icon name="add"/>Add figure</CatalogButton>
  </div>
}
