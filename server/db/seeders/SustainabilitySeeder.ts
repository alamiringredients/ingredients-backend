import {DB, defineSeeder} from '@holo-js/db'
import {cmsLocales} from '@/lib/cms/contracts'
import type {SustainabilityPageContent, SustainabilityRecord} from '@/lib/sustainability/contracts'
import source from '../seed-data/site-content.json'
import SustainabilityArticle from '@/server/models/SustainabilityArticle'
import SustainabilityArticleTranslation from '@/server/models/SustainabilityArticleTranslation'
import SustainabilityGoal from '@/server/models/SustainabilityGoal'
import SustainabilityGoalTranslation from '@/server/models/SustainabilityGoalTranslation'
import SustainabilityPublication from '@/server/models/SustainabilityPublication'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export default defineSeeder({
  name: 'sustainability',
  async run() {
    const page = source.website_settings.find(row => row.setting_key === 'sustainability')!.value as SustainabilityPageContent
    const {goals, ...pageContent} = page
    await WebsiteSetting.firstOrCreate({setting_key: 'sustainability'}, {value: pageContent})
    await SustainabilityGoal.unguarded(async () => {
      for (const [sortOrder, goal] of goals.entries()) {
        if (await SustainabilityGoal.find(goal.id)) continue
        await DB.table('sustainability_goals').insert({id: goal.id, color: goal.color, image: goal.image, sort_order: sortOrder})
        const record = await SustainabilityGoal.findOrFail(goal.id)
        for (const locale of cmsLocales) {
          await SustainabilityGoalTranslation.create({goal_id: Number(record.id), locale, name: goal.name[locale], alt: goal.alt[locale]})
        }
      }
    })

    await SustainabilityArticle.unguarded(async () => {
      for (const row of source.sustainability_articles as SustainabilityRecord[]) {
        if (await SustainabilityArticle.find(row.id)) continue
        const {locales: versions, ...metadata} = row.content
        await DB.table('sustainability_articles').insert({
          id: row.id,
          slug: row.slug,
          revision: row.revision,
          article_date: new Date(`${metadata.date}T00:00:00.000Z`),
          updated_date: new Date(`${metadata.updatedDate}T00:00:00.000Z`),
          sort_order: metadata.sortOrder,
          featured: metadata.featured,
          primary_goal_id: metadata.primaryGoal || null,
        })
        const article = await SustainabilityArticle.findOrFail(row.id)
        for (const locale of cmsLocales) {
          await SustainabilityArticleTranslation.create({article_id: Number(article.id), locale, content: versions[locale]})
          if (row.published[locale]) {
            await SustainabilityPublication.create({
              article_id: Number(article.id),
              locale,
              revision: row.revision,
              article_date: new Date(`${metadata.date}T00:00:00.000Z`),
              sort_order: metadata.sortOrder,
              featured: metadata.featured,
              metadata,
              content: row.published[locale],
              published_at: new Date(),
            })
          }
        }
        await article.goals().sync(metadata.goalIds)
      }
    })
  },
})
