import {ProductTranslationObserver} from '@/server/db/observers/ProductTranslationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('product_translations', {
  observers: [ProductTranslationObserver],
  fillable: ['product_id', 'locale', 'name', 'description', 'seo_title', 'seo_description', 'content'],
  relations: {owner: belongsTo('Product', 'product_id')},
})
