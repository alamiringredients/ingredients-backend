import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('sustainability_article_translations', {
  fillable: ['article_id', 'locale', 'content'],
  relations: {article: belongsTo('SustainabilityArticle', 'article_id')},
})
