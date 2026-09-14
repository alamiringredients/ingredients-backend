'use client'

import {useRouter} from 'next/navigation'
import type {AdminCapabilities} from '@/lib/admin/access'
import type {CrudIndexData} from '@/lib/admin/crud-index'
import {CrudIdentity, CrudList, CrudStatus} from './crud-list'
import {CatalogButtonLink} from './catalog-button'
import {FormNotice,useAdminForm,type AdminResult} from './form-feedback'

export function CrudIndex({data, capabilities, remove}: {data: CrudIndexData; capabilities: AdminCapabilities; remove?: (id: number) => Promise<AdminResult>}) {
  const router = useRouter()
  const form = useAdminForm(null)
  return <section className="catalog-admin-page"><CrudList
    title={data.title} section={data.section} description={`Manage your ${data.title.toLowerCase()}.`}
    create={capabilities.create ? {href: `${data.basePath}/create`, label: `Add ${data.noun}`} : undefined}
    pagination={data.pagination} stats={data.stats} filters={data.filters} columns={data.columns}
    empty={`No ${data.title.toLowerCase()} yet.`} busy={form.submitting} notice={<FormNotice result={form.result}/>}
    rows={data.rows.map(row => {
      const editHref = capabilities.edit ? `${data.basePath}/${row.id}/edit` : undefined
      return {id: row.id, name: row.name, editHref, cells: [
        <CrudIdentity key="identity" name={row.name} subtitle={row.subtitle} image={row.image} href={editHref}/>,
        ...row.cells.map((cell, index) => typeof cell !== 'object' ? cell : 'href' in cell
          ? <CatalogButtonLink key={index} href={cell.href} target="_blank" rel="noreferrer">{cell.label}</CatalogButtonLink>
          : <span key={index}><CrudStatus label={cell.label} active={cell.active}/>{cell.detail && <small className="news-published-locales">{cell.detail}</small>}</span>),
      ], deletion: capabilities.delete && remove ? {
        description: `This ${data.noun} will be permanently deleted.`,
        onConfirm: async () => {const result = await form.run(() => remove(row.id)); if (result?.ok) router.refresh()},
      } : undefined}
    })}
  /></section>
}
