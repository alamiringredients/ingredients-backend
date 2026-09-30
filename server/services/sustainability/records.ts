import 'server-only'
import {databaseDate} from '@/server/support/database-date'
import {decode} from '@/lib/news/contracts'
import type {CmsLocale} from '@/lib/cms/contracts'
import type {SustainabilityContent, SustainabilityGoal as SustainabilityGoalData, SustainabilityRecord, SustainabilityVersion} from '@/lib/sustainability/contracts'
import SustainabilityArticle from '@/server/models/SustainabilityArticle'
import SustainabilityGoal from '@/server/models/SustainabilityGoal'

export async function getSustainabilityGoals(locale?: CmsLocale): Promise<SustainabilityGoalData[]> {
  const goals = await SustainabilityGoal
    .with({translations: query => locale ? query.where('locale', locale) : query})
    .orderBy('sort_order')
    .getJson() as unknown as Record<string, unknown>[]

  return goals.map(goal => {
    const translations = goal.translations as Record<string, unknown>[]
    return {
      id: Number(goal.id),
      sortOrder: Number(goal.sort_order),
      color: String(goal.color),
      image: String(goal.image),
      name: Object.fromEntries(translations.map(row => [String(row.locale), String(row.name)])) as SustainabilityGoalData['name'],
      alt: Object.fromEntries(translations.map(row => [String(row.locale), String(row.alt)])) as SustainabilityGoalData['alt'],
    }
  })
}

export async function getSustainabilityRecords(articleId?: number): Promise<SustainabilityRecord[]> {
  let query = SustainabilityArticle
    .with('translations', 'publications', 'goals')
    .orderBy('id')
  if (articleId !== undefined) query = query.where('id', articleId)
  const articles = await query.getJson() as unknown as Record<string, unknown>[]

  return articles.map(row => {
    const translations = row.translations as Record<string, unknown>[]
    const publications = row.publications as Record<string, unknown>[]
    const goals = row.goals as Record<string, unknown>[]
    const content: SustainabilityContent = {
      date: databaseDate(row.article_date),
      updatedDate: databaseDate(row.updated_date),
      sortOrder: Number(row.sort_order),
      featured: Boolean(row.featured),
      primaryGoal: Number(row.primary_goal_id ?? 0),
      goalIds: goals.map(goal => Number(goal.id)),
      locales: Object.fromEntries(translations.map(item => [
        String(item.locale),
        decode<SustainabilityVersion>(item.content),
      ])) as Record<CmsLocale, SustainabilityVersion>,
    }
    return {
      id: Number(row.id),
      slug: String(row.slug),
      revision: Number(row.revision),
      content,
      published: Object.fromEntries(publications.map(item => [
        String(item.locale),
        decode<SustainabilityVersion>(item.content),
      ])),
    }
  })
}
