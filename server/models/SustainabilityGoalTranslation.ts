import {SustainabilityGoalTranslationObserver} from '@/server/db/observers/SustainabilityGoalTranslationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('sustainability_goal_translations', {
  observers: [SustainabilityGoalTranslationObserver],
  fillable: ['goal_id', 'locale', 'name', 'alt'],
  relations: {goal: belongsTo('SustainabilityGoal', 'goal_id')},
})
