'use client'

import Link from 'next/link'
import {useEffect, useId, useRef, useState} from 'react'
import {useForm} from '@holo-js/adapter-next/client'
import {logoutForm} from '@/app/login/schema'
import {logoutAdminAction} from '@/app/admin/auth-actions'

function AccountIcon({name}: {name: 'website' | 'password' | 'logout' | 'settings'}) {
  const paths = {
    website: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></>,
    password: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/></>,
    logout: <><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4m7-14 5 5-5 5m-9-5h14"/></>,
    settings: <><path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function LogoutForm() {
  const form = useForm(logoutForm, {submitter: ({formData}) => logoutAdminAction(formData)})
  return <form method="post" onSubmit={event => {
    event.preventDefault()
    void form.submit()
  }}>
    <button className="account-menu-item account-menu-logout" type="submit" disabled={form.submitting} aria-busy={form.submitting}><AccountIcon name="logout"/>{form.submitting ? 'Logging out…' : 'Log out'}</button>
    {form.errors.first('_root') && <p role="alert">{form.errors.first('_root')}</p>}
  </form>
}

export function AccountMenu({adminName, canViewSettings}: {adminName: string; canViewSettings: boolean}) {
  const [open, setOpen] = useState(false)
  const [keyboard, setKeyboard] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const initials = adminName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()

  useEffect(() => {
    if (!open) return
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  return <div className="admin-account" ref={container} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={event => {
    setKeyboard(true)
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      trigger.current?.focus()
    }
  }}>
    <button ref={trigger} className="account-trigger" type="button" aria-expanded={open} aria-controls={panelId} aria-label={`${adminName}, account menu`} onClick={event => {
      setKeyboard(event.detail === 0)
      setOpen(!open)
    }}>
      <span className="account-avatar" aria-hidden="true">{initials}</span>
      <span className="account-trigger-name">{adminName}</span>
      <svg className="account-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 12 4-4 4 4"/></svg>
    </button>
    <div id={panelId} className="account-menu-panel" hidden={!open} data-keyboard={keyboard}>
      <div className="account-menu-heading"><span>Signed in as</span><strong>{adminName}</strong></div>
      <Link className="account-menu-item" href="/" onClick={() => setOpen(false)}><AccountIcon name="website"/>View website</Link>
      <Link className="account-menu-item" href="/admin/change-password" onClick={() => setOpen(false)}><AccountIcon name="password"/>Change password</Link>
      <LogoutForm/>
    </div>
    {canViewSettings && <Link className="account-settings" href="/admin/settings" aria-label="Website settings" title="Website settings" onClick={() => setOpen(false)}><AccountIcon name="settings"/></Link>}
  </div>
}
