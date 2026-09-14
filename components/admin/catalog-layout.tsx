'use client'
import type { FormHTMLAttributes,HTMLAttributes,ReactNode } from 'react';
import { Children,cloneElement,isValidElement,type ReactElement } from 'react';
import { AdminForm } from './admin-form';
import { FieldError,RequiredMark,useAdminFields } from './form-feedback';
export function CatalogList({title,description,children}:{title:ReactNode;description?:ReactNode;children:ReactNode}){return <div className="catalog-list-card"><div className="catalog-list-heading"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div></div>{children}</div>}
export function CatalogTable({head,children}:{head:ReactNode;children:ReactNode}){return <div className="catalog-table-wrap"><table className="catalog-table"><thead>{head}</thead><tbody>{children}</tbody></table></div>}
export function CatalogField({className,name,children,...props}:HTMLAttributes<HTMLLabelElement>&{name?:string}){
 const form=useAdminFields()
 return <label {...props} className={`catalog-field${className?` ${className}`:''}`}>{Children.map(children,child=>{
  if(!name||!isValidElement(child))return child
  if(['input','select','textarea'].includes(String(child.type)))return cloneElement(child as ReactElement<Record<string,unknown>>,{...form?.input(name),...child.props as object})
  if(child.type==='span'&&form?.input(name).required){
   const label=child as ReactElement<{children?:ReactNode}>
   return cloneElement(label,undefined,label.props.children,<RequiredMark/>)
  }
  return child
 })}{name&&<FieldError name={name}/>}</label>
}
export function CatalogForm({className,...props}:FormHTMLAttributes<HTMLFormElement>){return <AdminForm {...props} className={`catalog-form${className?` ${className}`:''}`}/>}
export function CatalogFormGrid({children}:{children:ReactNode}){return <div className="catalog-form-grid">{children}</div>}
export function CatalogFormMain({children}:{children:ReactNode}){return <div className="catalog-form-main">{children}</div>}
export function CatalogFormSidebar({children}:{children:ReactNode}){return <aside className="catalog-form-sidebar">{children}</aside>}
export function CatalogActions({children}:{children:ReactNode}){return <div className="catalog-form-actions">{children}</div>}
export function CatalogRowActions({children}:{children:ReactNode}){return <div className="catalog-row-actions">{children}</div>}
export function CatalogStats({children}:{children:ReactNode}){return <div className="catalog-stats">{children}</div>}
export function CmsSectionTabs({children,...props}:HTMLAttributes<HTMLElement>){return <nav {...props} className="cms-tabs">{children}</nav>}

export function CmsPageLayout({navigation,children}:{navigation:ReactNode;children:ReactNode}){return <div className="cms-layout">{navigation}<div className="cms-editor">{children}</div></div>}
