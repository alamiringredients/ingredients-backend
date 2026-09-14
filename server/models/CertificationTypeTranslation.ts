import {CertificationTypeTranslationObserver} from '@/server/db/observers/CertificationTypeTranslationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('certification_type_translations', {
  observers: [CertificationTypeTranslationObserver],
  fillable: ['type_id', 'locale', 'name', 'description'], relations: {type: belongsTo('CertificationType', 'type_id')},
})
