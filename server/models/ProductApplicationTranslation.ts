import {ProductApplicationTranslationObserver} from '@/server/db/observers/ProductApplicationTranslationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('application_translations', {
  name: 'ProductApplicationTranslation',
  observers: [ProductApplicationTranslationObserver],
  fillable: ['application_id', 'locale', 'name'],
  relations: {owner: belongsTo('ProductApplication', 'application_id')},
})
