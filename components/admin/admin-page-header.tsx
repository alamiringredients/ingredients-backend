import type {ReactNode} from 'react'
import {CatalogBackLink, CatalogButton, CatalogButtonLink} from './catalog-button'
import {Icon} from './catalog-icon'

type AdminPageHeaderProps = {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  backHref?: string
  creating?: boolean
  noun?: string
  submitting?: boolean
  canSave?: boolean
  disabled?: boolean
  sticky?: boolean
}

export function AdminPageHeader({
  title,
  eyebrow,
  description,
  actions,
  backHref,
  creating = false,
  noun = 'record',
  submitting,
  canSave = submitting !== undefined,
  disabled = false,
  sticky = false,
}: AdminPageHeaderProps) {
  const formActions = backHref || canSave
    ? <div className="catalog-form-actions">
        {backHref && <CatalogButtonLink href={backHref} variant="secondary">Cancel</CatalogButtonLink>}
        {canSave && <CatalogButton type="submit" variant="primary" disabled={Boolean(submitting) || disabled} aria-busy={submitting}>
          <Icon name="save"/>{submitting ? 'Saving…' : creating ? `Create ${noun}` : 'Save changes'}
        </CatalogButton>}
      </div>
    : null

  return <header className={sticky ? 'catalog-form-header' : 'catalog-page-header'}>
    <div className="catalog-form-title">
      {backHref && <CatalogBackLink href={backHref} aria-label="Back to list"><Icon name="arrow-left"/></CatalogBackLink>}
      <div>
        {eyebrow && <div className="catalog-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </div>
    {actions ?? formActions}
  </header>
}
