import {Icon,type IconName} from './catalog-icon'
export function CatalogStat({icon='box',label,value}:{icon?:IconName;label:string;value:number}){return <div className="catalog-stat"><span><Icon name={icon}/></span><div><b>{value}</b><small>{label}</small></div></div>}
