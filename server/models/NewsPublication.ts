import {NewsPublicationObserver} from '@/server/db/observers/NewsPublicationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('news_publications', {
  observers: [NewsPublicationObserver],
  fillable: ['article_id', 'locale', 'revision', 'article_date', 'category_id', 'featured', 'metadata', 'content', 'published_at'],
  relations: {article: belongsTo('NewsArticle', 'article_id'), category: belongsTo('NewsTaxonomy', 'category_id')},
})
