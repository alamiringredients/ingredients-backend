import {belongsTo, defineModel} from '@holo-js/db'
import {ContentTranslationValueObserver} from '@/server/db/observers/ContentTranslationValueObserver'

export default defineModel('content_translation_values', {
  fillable: ['translation_id', 'locale', 'value'],
  observers: [ContentTranslationValueObserver],
  relations: {translation: belongsTo('ContentTranslation', 'translation_id')},
})
