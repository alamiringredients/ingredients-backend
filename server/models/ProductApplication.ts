import {ProductApplicationObserver} from '@/server/db/observers/ProductApplicationObserver'
import {belongsToMany, defineModel, hasMany} from '@holo-js/db'
export default defineModel('product_applications', {
  observers: [ProductApplicationObserver],
  fillable: ['slug', 'is_active', 'sort_order'],
  relations: {
    translations: hasMany('ProductApplicationTranslation', 'application_id'),
    products: belongsToMany('Product', 'application_product', 'application_id', 'product_id'),
  },
})
