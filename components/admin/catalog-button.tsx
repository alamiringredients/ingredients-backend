import Link from 'next/link'
import type {ButtonHTMLAttributes,ComponentProps} from 'react'
const classes=(variant:'primary'|'secondary'|'danger'|'view',className?:string)=>`catalog-button catalog-button-${variant}${className?` ${className}`:''}`
export function CatalogButton({variant='secondary',className,type='button',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'danger'|'view'}){
 return <button {...props} type={type} className={classes(variant,className)}/>
}
export function CatalogButtonLink({variant='secondary',className,...props}:ComponentProps<typeof Link>&{variant?:'primary'|'secondary'|'danger'|'view'}){
 return <Link {...props} className={classes(variant,className)}/>
}
export function CatalogIconButton({className,...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button {...props} type="button" className={`catalog-icon-button${className?` ${className}`:''}`}/>}
export function CatalogIconLink({className,...props}:ComponentProps<typeof Link>){return <Link {...props} className={`catalog-icon-button${className?` ${className}`:''}`}/>}
export function CatalogBackLink({className,...props}:ComponentProps<typeof Link>){return <Link {...props} className={`catalog-back${className?` ${className}`:''}`}/>}
export function CatalogTabButton({active,className,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{active:boolean}){return <button {...props} type="button" aria-pressed={active} className={`${active?'active':''}${className?` ${className}`:''}`}/>}
