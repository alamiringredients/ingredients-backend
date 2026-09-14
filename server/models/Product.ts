import {belongsTo, belongsToMany, defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'
import {ProductObserver} from '@/server/db/observers/ProductObserver'

const Product = defineModel('products', {
  fillable: ['seed_key', 'category_id', 'slug', 'published', 'sort_order'],
  observers: [ProductObserver],
  relations: {
    category: belongsTo('ProductCategory', 'category_id'),
    translations: hasMany('ProductTranslation', 'product_id'),
    applications: belongsToMany('ProductApplication', 'application_product', 'product_id', 'application_id').withPivot('sort_order').orderByPivot('sort_order'),
    concentrations: belongsToMany('ConcentrationRange', 'concentration_product', 'product_id', 'concentration_id').withPivot('sort_order').orderByPivot('sort_order'),
  },
})
export default defineMediaModel(Product, cmsMediaDefinition())
