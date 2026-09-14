import {ConcentrationRangeObserver} from '@/server/db/observers/ConcentrationRangeObserver'
import {belongsToMany, defineModel, hasMany} from '@holo-js/db'
export default defineModel('concentration_ranges', {
  observers: [ConcentrationRangeObserver],
  fillable: ['slug', 'is_active', 'sort_order'],
  relations: {
    translations: hasMany('ConcentrationRangeTranslation', 'concentration_id'),
    products: belongsToMany('Product', 'concentration_product', 'concentration_id', 'product_id'),
  },
})
