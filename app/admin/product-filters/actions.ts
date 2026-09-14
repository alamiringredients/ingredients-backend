'use server'
import cache from '@holo-js/cache'
import {searchCacheKeys, catalogCacheKeys} from '@/server/support/cache-keys'
import {DB} from '@holo-js/db'
import {validate} from '@holo-js/forms'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {requireAdminPermission} from '@/server/admin/authorization'
import {adminActionError} from '@/server/admin/form-actions'
import {productFilterForm} from '@/app/admin/product-filters/schema'

import {cmsLocales} from '@/lib/cms/contracts'
import ProductApplication from '@/server/models/ProductApplication'
import ProductApplicationTranslation from '@/server/models/ProductApplicationTranslation'
import ConcentrationRange from '@/server/models/ConcentrationRange'
import ConcentrationRangeTranslation from '@/server/models/ConcentrationRangeTranslation'

export async function saveProductFilter(data: FormData) {
  let destination = '/admin/product-filters'
  try {
    const input = await validate(data, productFilterForm)
    await requireAdminPermission('product_filters', input.id ? 'edit' : 'create')
    destination = `/admin/product-filters/${input.group}`
    const Model = input.group === 'applications' ? ProductApplication : ConcentrationRange
    await DB.writeTransaction(async () => {
      const duplicate = await Model.where('slug', input.slug).first()
      if (duplicate && Number(duplicate.id) !== input.id) throw new Error('This filter slug already exists.')
      const values = {slug: input.slug, is_active: input.is_active, sort_order: input.sort_order}
      const record = input.id
        ? await Model.where('id', input.id).firstOrFail()
        : await Model.create(values)
      if (input.id) await record.update(values)
      for (const locale of cmsLocales) {
        if (input.group === 'applications') {
          await ProductApplicationTranslation.upsert({application_id: Number(record.id), locale}, {name: input[locale]})
        } else {
          await ConcentrationRangeTranslation.upsert({concentration_id: Number(record.id), locale}, {name: input[locale]})
        }
      }
    })
    await Promise.all([...searchCacheKeys, ...catalogCacheKeys].map(key => cache.forget(key)))
    
    revalidatePath('/admin', 'layout')
  } catch (error) {return adminActionError(error)}
  redirect(destination)
}
