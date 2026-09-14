import {defineModel, hasMany} from '@holo-js/db'
import {ContentTranslationObserver} from '@/server/db/observers/ContentTranslationObserver'

export default defineModel('content_translations', {
  fillable: ['translation_key', 'page', 'source'],
  observers: [ContentTranslationObserver],
  relations: {values: hasMany('ContentTranslationValue', 'translation_id')},
})
