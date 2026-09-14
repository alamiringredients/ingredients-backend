import {ProductCategoryTranslationObserver} from '@/server/db/observers/ProductCategoryTranslationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('product_category_translations', {
  observers: [ProductCategoryTranslationObserver],
  fillable: ['category_id', 'locale', 'name', 'description', 'seo_title', 'seo_description', 'content'],
  relations: {owner: belongsTo('ProductCategory', 'category_id')},
})
