import {DB, defineSeeder} from '@holo-js/db'
import {cmsLocales} from '@/lib/cms/contracts'
import goals from '../seed-data/sustainability-goals.json'
import SustainabilityGoal from '@/server/models/SustainabilityGoal'
import SustainabilityGoalTranslation from '@/server/models/SustainabilityGoalTranslation'

export default defineSeeder({name: 'sustainability_goals', async run() {
  await SustainabilityGoal.unguarded(async () => {
    for (const [sortOrder, goal] of goals.entries()) {
      if (await SustainabilityGoal.find(goal.id)) continue
      await DB.table('sustainability_goals').insert({id:goal.id,color:goal.color,image:goal.image,sort_order:sortOrder})
      for (const locale of cmsLocales) await SustainabilityGoalTranslation.create({goal_id:goal.id,locale,name:goal.name[locale],alt:goal.alt[locale]})
    }
  })
}})
