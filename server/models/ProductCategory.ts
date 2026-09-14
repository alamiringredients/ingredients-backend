import {defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'
import {ProductCategoryObserver} from '@/server/db/observers/ProductCategoryObserver'

const ProductCategory = defineModel('product_categories', {
  fillable: ['seed_key', 'slug', 'published', 'sort_order'],
  observers: [ProductCategoryObserver],
  relations: {
    products: hasMany('Product', 'category_id'),
    translations: hasMany('ProductCategoryTranslation', 'category_id'),
  },
})
export default defineMediaModel(ProductCategory, cmsMediaDefinition({artwork: true}))
