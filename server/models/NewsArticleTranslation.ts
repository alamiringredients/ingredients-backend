import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('news_article_translations', {
  fillable: ['article_id', 'locale', 'content'],
  relations: {article: belongsTo('NewsArticle', 'article_id')},
})
