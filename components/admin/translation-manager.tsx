'use client'
import {useCrudNavigation} from './use-crud-navigation'
import {CrudPagination} from './crud-pagination'
import type {SubmissionPagination} from '@/lib/admin/submission-list'
import { AdminForm } from './admin-form'
import { CatalogTabButton } from './catalog-button'
import {AdminPageHeader} from './admin-page-header'


import { AdminFormProvider,FieldError,FormNotice,RequiredMark,useAdminForm } from './form-feedback'

import { saveTranslationsAction } from '@/app/admin/translation-actions'
import { useRouter } from 'next/navigation'
import { useMemo,useState } from 'react'

type Locale = 'en' | 'ar' | 'fr'
type TranslationEntry = {key: string; page: string; source: string; translations: Record<Locale, string>}
type Values = Record<string, Partial<Record<Locale, string>>>
const locales = ['en','ar','fr'] as const

export function TranslationManager({entries, pagination, pages}: {entries: TranslationEntry[]; pagination: SubmissionPagination; pages: string[]}) {
  const router=useRouter()
  const {query, selected, change, href, pending, changePageSize} = useCrudNavigation(pagination)
  const locale = (selected.locale || 'ar') as Locale
  const page = selected.section || ''
  const setLocale = (locale: Locale) => change(query, {...selected, locale})
  const setPage = (section: string) => change(query, {...selected, section})
  const setQuery = (query: string) => change(query, selected, 600)
  const [values, setValues] = useState<Values>({})
  const formValues=useMemo(()=>Object.entries(values).flatMap(([key,translations])=>locales.flatMap(locale=>translations[locale]===undefined?[]:[{key,locale,value:translations[locale]!}])),[values])
  const form=useAdminForm(formValues)
  const busy=form.submitting

  const update = (key: string, value: string) => {
    form.change()
    setValues((current) => ({...current, [key]: {...current[key], [locale]: value}}))
  }
  const save = async () => {
    const result=await form.run(()=>saveTranslationsAction(JSON.stringify(formValues)))
    if(result?.ok) {setValues({});router.refresh()}
  }

  return <AdminFormProvider form={form} reveal={name=>{const row=formValues[Number(name.split('.')[1])];if(!row)return;change('', {...selected, section: entries.find(entry=>entry.key===row.key)?.page??page, locale: row.locale})}}><section onChangeCapture={()=>form.change()}><AdminForm noValidate onSubmit={event=>{event.preventDefault();void (save())}}>
    <AdminPageHeader title={<>Translations</>} submitting={busy} disabled={!Object.keys(values).length} sticky/>
    <FormNotice result={form.result}/>
    <div className="translation-tools" aria-busy={pending}>
      <label>Page<select value={page} onChange={(event) => setPage(event.target.value)}><option value="">All pages</option>{pages.map((item) => <option value={item} key={item}>{item === 'home' ? 'Home' : `/${item}`}</option>)}</select></label>
      <label>Search translations<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by key or text" /></label>
      <div className="locale-tabs" role="group" aria-label="Translation language">
        {locales.map((item) => <CatalogTabButton type="button" onClick={() => setLocale(item)} key={item} active={locale === item}>{item.toUpperCase()}</CatalogTabButton>)}
      </div>
    </div>
    <div className="translation-table">
      <div className="translation-row translation-head"><span>Key</span><span>English source</span><span>{locale.toUpperCase()} translation<RequiredMark/></span></div>
      {entries.map(entry => {
        const index=formValues.findIndex(row=>row.key===entry.key&&row.locale===locale)
        const name=index<0?undefined:`translations.${index}.value`
        return <div className="translation-row" key={entry.key}>
          <code>{entry.key}</code><p>{entry.source}</p><div><textarea {...form.input(name)} required dir={locale === 'ar' ? 'rtl' : 'ltr'} value={values[entry.key]?.[locale] ?? entry.translations[locale]} onChange={(event) => update(entry.key, event.target.value)} aria-label={`${entry.key} ${locale} translation (required)`} /><FieldError name={name}/></div>
        </div>
      })}
    <CrudPagination meta={pagination.meta} href={href} onPageSizeChange={changePageSize} pending={pending}/>
    </div>
  </AdminForm></section></AdminFormProvider>
}
