'use client'

import {useForm} from '@holo-js/adapter-next/client'
import {loginForm} from '@/app/admin/login/schema'
import {loginAdminAction} from './actions'

export function LoginForm({redirectTo}: {redirectTo: string}) {
  const form = useForm(loginForm, {
    initialValues: {email: '', password: '', remember: false},
    validateOn: 'submit',
    submitter: ({formData}) => loginAdminAction(formData, redirectTo),
  })
  const emailError = form.errors.first('email')
  const passwordError = form.errors.first('password')
  const formError = form.errors.first('_root')

  return <form method="post" noValidate onSubmit={event => {
    event.preventDefault()
    void form.submit()
  }} className="login-form" aria-busy={form.submitting}>
    {formError && <div className="login-error" role="alert">{formError}</div>}
    <label>
      <span>Email address</span>
      <input aria-describedby={emailError ? 'email-error' : undefined} aria-invalid={Boolean(emailError)} autoComplete="username" name="email" type="email" required value={form.values.email} onChange={event => form.fields.email.onInput(event.target.value)} />
      {emailError && <small id="email-error" role="alert">{emailError}</small>}
    </label>
    <label>
      <span>Password</span>
      <input aria-describedby={passwordError ? 'password-error' : undefined} aria-invalid={Boolean(passwordError)} autoComplete="current-password" name="password" type="password" required value={form.values.password} onChange={event => form.fields.password.onInput(event.target.value)} />
      {passwordError && <small id="password-error" role="alert">{passwordError}</small>}
    </label>
    <label className="login-remember">
      <input name="remember" type="checkbox" checked={form.values.remember} onChange={event => form.fields.remember.onInput(event.target.checked)} />
      <span>Keep me signed in</span>
    </label>
    <button disabled={form.submitting} type="submit">{form.submitting ? 'Signing in...' : 'Sign in'}</button>
  </form>
}
