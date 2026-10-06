'use server'
import {storeMediaPaths} from '@/server/support/media-references'
import {createFailedSubmission, validate} from '@holo-js/forms'
import {DB} from '@holo-js/db'
import {redirect} from 'next/navigation'
import {goalForm} from './schema'
import {requireAdminPermission} from '@/server/admin/authorization'
import {adminActionError} from '@/server/admin/form-actions'
import {cmsLocales} from '@/lib/cms/contracts'
import {contentUrl} from '@/lib/editor/document'
import {decode} from '@/lib/news/contracts'
import SustainabilityGoal from '@/server/models/SustainabilityGoal'
import SustainabilityGoalTranslation from '@/server/models/SustainabilityGoalTranslation'

export async function saveGoal(id: number, data: Record<string, unknown>) {
  try {
    if (!Number.isSafeInteger(id) || id < 0) throw new Error('Invalid goal.')
    await requireAdminPermission('sustainability_goals', id ? 'edit' : 'create')
    const input = await validate(data, goalForm)
    const image = await storeMediaPaths(contentUrl(input.image, true))
    const savedId = await DB.writeTransaction(async () => {
      const attributes = {image, color: input.color, sort_order: input.sortOrder}
      const goal = id ? await SustainabilityGoal.findOrFail(id) : await SustainabilityGoal.create(attributes)
      if (id) await goal.update(attributes)
      for (const locale of cmsLocales) await SustainabilityGoalTranslation.upsert({goal_id: Number(goal.id), locale}, {name: input.name[locale], alt: input.alt[locale]})
      return Number(goal.id)
    })
    redirect(`/admin/sustainability-goals/${savedId}/edit?saved=1`)
  } catch (error) {
    const result = adminActionError(error)
    return createFailedSubmission(goalForm, {}, result.errors ?? {_root: [result.message]}).serialize()
  }
}

export async function deleteGoal(id: number) {
  try {
    await requireAdminPermission('sustainability_goals', 'delete')
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid goal.')
    await DB.writeTransaction(async () => {
      if (await DB.table('sustainability_article_goal').where('goal_id', id).first() || await DB.table('sustainability_articles').where('primary_goal_id', id).first()) throw new Error('Remove this goal from its articles before deleting it.')
      const publications = await DB.table('sustainability_publications').select('metadata').get()
      if (publications.some(row => decode<{goalIds: number[]}>(row.metadata).goalIds.includes(id))) throw new Error('Republish affected articles without this goal before deleting it.')
      await (await SustainabilityGoal.findOrFail(id)).delete()
    })
    return {ok: true, message: 'Goal deleted.'}
  } catch (error) {return adminActionError(error)}
}
