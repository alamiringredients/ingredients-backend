'use client'

import {CatalogButton,CatalogIconButton} from './catalog-button'
import {useId, useRef, type ReactNode} from 'react'

type ConfirmActionProps = {
  children: ReactNode
  confirmLabel?: string
  description: string
  disabled?: boolean
  onConfirm: () => void
  title: string
  triggerClassName?: string
  triggerLabel: string
  triggerTitle?: string
}

export function ConfirmAction({
  children,
  confirmLabel = 'Delete',
  description,
  disabled = false,
  onConfirm,
  title,
  triggerClassName,
  triggerLabel,
  triggerTitle,
}: ConfirmActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const descriptionId = useId()

  const close = () => dialogRef.current?.close()
  const confirm = () => {
    close()
    onConfirm()
  }

  return <>
    <CatalogIconButton className={triggerClassName} type="button" disabled={disabled} aria-label={triggerLabel} title={triggerTitle} onClick={() => dialogRef.current?.showModal()}>{children}</CatalogIconButton>
    <dialog className="admin-confirm" ref={dialogRef} aria-labelledby={headingId} aria-describedby={descriptionId} onClick={(event) => {if (event.target === event.currentTarget) close()}}>
      <div className="admin-confirm-card">
        <div className="admin-confirm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div className="admin-confirm-copy">
          <h2 id={headingId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        <div className="admin-confirm-actions">
          <CatalogButton onClick={close}>Cancel</CatalogButton>
          <CatalogButton variant="danger" onClick={confirm}>{confirmLabel}</CatalogButton>
        </div>
      </div>
    </dialog>
  </>
}
