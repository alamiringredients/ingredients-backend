import {ChangePasswordForm} from '@/components/admin/change-password-form'
import {AdminPageHeader} from '@/components/admin/admin-page-header'

export default function ChangePasswordPage() {
  return <>
    <AdminPageHeader title="Change password" eyebrow="Your account" description="Update the password you use to sign in."/>
    <ChangePasswordForm/>
  </>
}
