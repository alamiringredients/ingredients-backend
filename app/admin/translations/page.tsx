import {TranslationManager} from '@/components/admin/translation-manager'
import {getTranslationList} from '@/server/admin/translation-list'
import {requireAdminPagePermission} from '@/server/admin/authorization'
import type {ListSearchParams} from '@/lib/admin/submission-list'

export default async function TranslationsPage({searchParams}: {searchParams: Promise<ListSearchParams>}) {
  await requireAdminPagePermission('content_translations', 'view')
  return <TranslationManager {...await getTranslationList(await searchParams)}/>
}
