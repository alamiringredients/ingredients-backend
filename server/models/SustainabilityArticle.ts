import {SustainabilityArticleObserver} from '@/server/db/observers/SustainabilityArticleObserver'
import {belongsTo, belongsToMany, defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'
const SustainabilityArticle = defineModel('sustainability_articles', {
  observers: [SustainabilityArticleObserver],
  fillable: ['slug', 'revision', 'article_date', 'updated_date', 'sort_order', 'featured', 'primary_goal_id'],
  relations: {
    primaryGoal: belongsTo('SustainabilityGoal', 'primary_goal_id'),
    goals: belongsToMany('SustainabilityGoal', 'sustainability_article_goal', 'article_id', 'goal_id'),
    translations: hasMany('SustainabilityArticleTranslation', 'article_id'),
    publications: hasMany('SustainabilityPublication', 'article_id'),
    revisions: hasMany('SustainabilityRevision', 'article_id'),
  },
})
export default defineMediaModel(SustainabilityArticle, cmsMediaDefinition())
