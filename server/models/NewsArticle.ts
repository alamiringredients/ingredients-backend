import {NewsArticleObserver} from '@/server/db/observers/NewsArticleObserver'
import {belongsTo, belongsToMany, defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'

const NewsArticle = defineModel('news_articles', {
  observers: [NewsArticleObserver],
  fillable: ['slug', 'revision', 'category_id', 'article_date', 'featured', 'previous_article_id', 'next_article_id'],
  relations: {
    category: belongsTo('NewsTaxonomy', 'category_id'),
    translations: hasMany('NewsArticleTranslation', 'article_id'),
    publications: hasMany('NewsPublication', 'article_id'),
    revisions: hasMany('NewsRevision', 'article_id'),
    tags: belongsToMany('NewsTaxonomy', 'news_article_tag', 'article_id', 'tag_id'),
    related: belongsToMany('NewsArticle', 'news_article_related', 'article_id', 'related_article_id').withPivot('sort_order').orderByPivot('sort_order'),
    previous: belongsTo('NewsArticle', 'previous_article_id'),
    next: belongsTo('NewsArticle', 'next_article_id'),
  },
})
export default defineMediaModel(NewsArticle, cmsMediaDefinition())
