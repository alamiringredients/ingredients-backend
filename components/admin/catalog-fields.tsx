'use client'
import {useAdminFields} from './form-feedback'
import {cmsLocales, type LocalizedValue} from '@/lib/cms/contracts'
import {AssetField, type CmsMediaOwner} from './cms-fields'
export function LocalizedPdfFields({label,value,onChange,owner}:{label:string;value:LocalizedValue;onChange:(value:LocalizedValue)=>void;owner:CmsMediaOwner}) {
  const form=useAdminFields()
  const path=form?.path(value)
  return <fieldset className="cms-localized-field"><legend>{label}</legend>{cmsLocales.map(locale => <AssetField name={path?`${path}.${locale}`:undefined} key={locale} owner={owner} field={{id:locale,label:`${locale.toUpperCase()} PDF`,kind:'pdf',source:'',value:value[locale]}} onChange={url=>onChange({...value,[locale]:url})} />)}<small>Upload a PDF for each locale. The same file can be selected for all three.</small></fieldset>
}
