import {SettingsManager} from '@/components/admin/settings-manager'
import {getWebsiteSettings} from '@/server/services/cms/content'
import {requireAdminPagePermission} from '@/server/admin/authorization'

export default async function SettingsPage() {
  await requireAdminPagePermission('website_settings','view')
  return <SettingsManager initialSettings={await getWebsiteSettings()} />
}
