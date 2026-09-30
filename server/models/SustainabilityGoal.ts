import {SustainabilityGoalObserver} from '@/server/db/observers/SustainabilityGoalObserver'
import {belongsToMany, defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'
const SustainabilityGoal = defineModel('sustainability_goals', {
  observers: [SustainabilityGoalObserver],
  fillable: ['color', 'image', 'sort_order'],
  relations: {translations: hasMany('SustainabilityGoalTranslation', 'goal_id'), articles: belongsToMany('SustainabilityArticle', 'sustainability_article_goal', 'goal_id', 'article_id')},
})

export default defineMediaModel(SustainabilityGoal, cmsMediaDefinition())
