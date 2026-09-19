import {getCurrentAdmin} from '@/server/admin/session'
import {redirect} from 'next/navigation'
import {LoginForm} from './login-form'
import {adminRedirectPath} from './redirect'
import './login.css'

export default async function LoginPage({searchParams}: {searchParams: Promise<{redirect?: string | string[]}>}) {
  const redirectTo = adminRedirectPath((await searchParams).redirect)
  if (await getCurrentAdmin()) redirect(redirectTo)

  return <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-mark">A</div>
      <p className="login-kicker">Alamir admin</p>
      <h1 id="login-title">Welcome back</h1>
      <p className="login-intro">Sign in to manage the website.</p>
      <LoginForm redirectTo={redirectTo} />
      <a className="login-site-link" href="/">Return to the website</a>
    </section>
  </main>
}
