import {SustainabilityPublicationObserver} from '@/server/db/observers/SustainabilityPublicationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('sustainability_publications', {
  observers: [SustainabilityPublicationObserver],
  fillable: ['article_id', 'locale', 'revision', 'article_date', 'sort_order', 'featured', 'metadata', 'content', 'published_at'],
  relations: {article: belongsTo('SustainabilityArticle', 'article_id')},
})
