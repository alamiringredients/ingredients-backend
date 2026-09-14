'use client'

import type {ReactNode} from 'react'
import {useCrudNavigation} from './use-crud-navigation'
import {CrudPagination} from './crud-pagination'
import {CrudToolbar} from './crud-toolbar'
import type {SubmissionPagination} from '@/lib/admin/submission-list'
import Image from 'next/image'
import Link from 'next/link'
import {AdminPageHeader} from './admin-page-header'
import {CatalogStats,CatalogList,CatalogTable,CatalogRowActions} from './catalog-layout'
import {CatalogButtonLink,CatalogIconLink} from './catalog-button'
import {CatalogStat} from './catalog-stat'
import {ConfirmAction} from './confirm-action'
import {Icon,type IconName} from './catalog-icon'

export type CrudRow = {
 id:number|string
 name:string
 searchText?:string
 filterValues?:Record<string,string>
 cells:ReactNode[]
 editHref?:string
 viewHref?:string
 deletion?:{description:string;onConfirm:()=>void}
}
export function CrudStatus({label,active=false}:{label:string;active?:boolean}){
 return <span className={`catalog-status${active?' is-published':''}`}><i/>{label}</span>
}
export function CrudIdentity({name,subtitle,image,icon='box',href}:{name:string;subtitle?:string;image?:string;icon?:IconName;href?:string}){
 const content=<><span className="catalog-record-thumb">{image?<Image src={image} alt="" width={40} height={40} unoptimized/>:<Icon name={icon}/>}</span><span><b>{name}</b>{subtitle&&<small>{subtitle}</small>}</span></>
 return href?<Link className="catalog-record-name" href={href}>{content}</Link>:<span className="catalog-record-name">{content}</span>
}
/** Owns the complete list presentation. Consumers supply data and permitted actions, never button markup. */
export function CrudList({title,section,description,icon='box',create,stats,columns,rows,empty,notice,filters=[],busy=false,pagination}:{
 pagination:SubmissionPagination
 title:string;section:string;description:string;icon?:IconName
 create?:{href:string;label:string}
 stats?:{label:string;value:number;icon?:IconName}[]
 columns:string[];rows:CrudRow[];empty:string;notice?:ReactNode;filters?:{key:string;label:string;options:{value:string;label:string}[]}[];busy?:boolean
}){
 const navigation=useCrudNavigation(pagination)
 const {query,selected,href}=navigation
 const visible=rows
 const narrowed=Boolean(query)||Object.values(selected).some(Boolean)
 const hasActions=rows.some(row=>row.editHref||row.viewHref||row.deletion)
 return <>
  <AdminPageHeader title={title} eyebrow={<><Icon name={icon}/>{section}</>} description={description} actions={create&&<CatalogButtonLink variant="primary" href={create.href}><Icon name="add"/>{create.label}</CatalogButtonLink>}/>
  {notice}
  {stats&&<CatalogStats>{stats.map(stat=><CatalogStat key={stat.label} {...stat}/>)}</CatalogStats>}
  <CatalogList title={title} description={`${pagination.meta.total} records`}><CrudToolbar title={title} filters={filters} navigation={navigation}/><div className="sr-only" role="status">{pagination.meta.total} matching records</div><CatalogTable head={<tr>{columns.map(column=><th key={column} scope="col">{column}</th>)}{hasActions&&<th scope="col"><span className="sr-only">Actions</span></th>}</tr>}>
   {visible.map(row=><tr key={row.id}>{row.cells.map((cell,index)=><td key={columns[index]}>{cell}</td>)}{hasActions&&<td><CatalogRowActions>{(row.editHref||row.viewHref)&&<CatalogIconLink className="is-edit" href={(row.editHref||row.viewHref)!} aria-label={`${row.editHref?'Edit':'View'} ${row.name}`} title={row.editHref?'Edit':'View'}><Icon name={row.editHref?'edit':'external'}/></CatalogIconLink>}{row.deletion&&<ConfirmAction triggerClassName="catalog-icon-button is-delete" triggerLabel={`Delete ${row.name}`} triggerTitle="Delete" title={`Delete ${row.name}?`} description={row.deletion.description} disabled={busy} onConfirm={row.deletion.onConfirm}><Icon name="delete"/></ConfirmAction>}</CatalogRowActions></td>}</tr>)}
   {!visible.length&&<tr><td className="catalog-empty" colSpan={columns.length+(hasActions?1:0)}>{narrowed?'No records match your search or filters.':empty}</td></tr>}
  </CatalogTable><CrudPagination meta={pagination.meta} href={href} onPageSizeChange={navigation.changePageSize} pending={navigation.pending}/></CatalogList>
 </>
}
