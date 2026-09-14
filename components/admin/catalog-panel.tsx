import type {ReactNode} from 'react'
export function CatalogPanel({title,description,children,bodyClassName='catalog-panel-body'}:{title?:ReactNode;description?:ReactNode;children:ReactNode;bodyClassName?:string|null}){
 return <div className="catalog-panel">{title&&<div className="catalog-panel-heading"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div></div>}{bodyClassName?<div className={bodyClassName}>{children}</div>:children}</div>
}
