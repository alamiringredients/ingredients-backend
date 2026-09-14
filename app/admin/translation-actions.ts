'use server'
import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'

import {validate} from '@holo-js/forms'
import {translationsForm} from '@/app/admin/translation-schema'
import {pageCacheKeys, contentCacheKeys} from '@/server/support/cache-keys'
import {requireAdminPermission} from '@/server/admin/authorization'
import {adminActionError} from '@/server/admin/form-actions'
import ContentTranslation from '@/server/models/ContentTranslation'
import ContentTranslationValue from '@/server/models/ContentTranslationValue'

export async function saveTranslationsAction(payload:string) {
  try {
    await requireAdminPermission('content_translations', 'edit')
    if (payload.length > 2000000) throw new Error('Translation changes are too large.')
    const input=await validate({translations:JSON.parse(payload)},translationsForm)
    await DB.transaction(async () => {
      for (const change of input.translations) {
        const current = await ContentTranslation.where('translation_key', change.key).first()
        if (!current) throw new Error('This translation was removed. Refresh the page before editing.')
        // Existing shared strings with the same source retain their synchronized editing behavior.
        const siblings = await ContentTranslation.where('source', current.source).select('id').get()
        for (const row of siblings) {
          await ContentTranslationValue.upsert(
            {translation_id: Number(row.id), locale: change.locale},
            {value: change.value.trim()},
          )
        }
      }
    })
    await Promise.all([contentCacheKeys.contentTranslations, contentCacheKeys.catalogTranslations, ...pageCacheKeys].map(key => cache.forget(key)))
    
    return {ok: true, message: 'Translations saved to the database.'}
  } catch (error) {return adminActionError(error)}
}
