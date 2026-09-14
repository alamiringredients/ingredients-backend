import {SustainabilityGoalObserver} from '@/server/db/observers/SustainabilityGoalObserver'
import {belongsToMany, defineModel, hasMany} from '@holo-js/db'
export default defineModel('sustainability_goals', {
  observers: [SustainabilityGoalObserver],
  fillable: ['color', 'image', 'sort_order'],
  relations: {translations: hasMany('SustainabilityGoalTranslation', 'goal_id'), articles: belongsToMany('SustainabilityArticle', 'sustainability_article_goal', 'goal_id', 'article_id')},
})
